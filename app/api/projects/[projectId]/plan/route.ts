import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { getVideoDuration } from "@/lib/video-utils"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

if (!OPENROUTER_API_KEY) {
  console.warn("OPENROUTER_API_KEY not configured")
}

async function callOpenRouter(prompt: string, system: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured in environment variables")
  }

  try {
    console.log("[v0] Calling OpenRouter with gpt-oss-120b model...")
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Smart-BRoll-Inserter",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    const responseText = await response.text()
    console.log("[v0] OpenRouter status:", response.status)

    if (!response.ok) {
      console.error("[v0] OpenRouter error:", responseText.substring(0, 300))
      throw new Error(`OpenRouter returned ${response.status}: ${responseText.substring(0, 200)}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("[v0] JSON parse error:", responseText.substring(0, 300))
      throw new Error("OpenRouter returned invalid JSON")
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error("[v0] Invalid response structure:", data)
      throw new Error("OpenRouter response missing content")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("[v0] OpenRouter call failed:", error)
    throw error
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const projectId = params.projectId
    const projectDir = join(UPLOAD_DIR, projectId)

    console.log("[v0] Planning timeline for project:", projectId)
    const files = await readdir(projectDir)
    const aRollFile = files.find((f) => f === "aroll.mp4")
    const bRollFiles = files.filter((f) => f.startsWith("broll_"))

    if (!aRollFile || bRollFiles.length === 0) {
      throw new Error(`Missing video files. Found: ${files.join(", ")}`)
    }

    const aRollPath = join(projectDir, aRollFile)
    const aRollDuration = await getVideoDuration(aRollPath)
    console.log("[v0] A-Roll duration:", aRollDuration, "seconds")

    const transcriptPrompt = `Generate a realistic 30-50 second talking head video script divided into 5-6 segments. Each segment should be 5-10 seconds.
Return ONLY this exact JSON format:
{
  "segments": [
    {"start": 0, "end": 8, "text": "Hi everyone, welcome to our demo"},
    {"start": 8, "end": 16, "text": "Today I want to show you our solution"},
    {"start": 16, "end": 24, "text": "It helps teams collaborate better"},
    {"start": 24, "end": 32, "text": "We focused on making it easy to use"},
    {"start": 32, "end": 40, "text": "Let me walk you through the key features"}
  ]
}`

    let transcript = {
      segments: [
        { start: 0, end: 5, text: "Welcome to our demo" },
        { start: 5, end: 12, text: "This solution transforms your workflow" },
        { start: 12, end: 20, text: "It's designed for busy professionals" },
        { start: 20, end: 28, text: "Let me show you the key benefits" },
      ],
    }

    try {
      const transcriptResponse = await callOpenRouter(
        transcriptPrompt,
        "You are a video script writer. Respond ONLY with valid JSON, no markdown or explanations.",
      )
      const jsonMatch = transcriptResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        transcript = JSON.parse(jsonMatch[0])
      }
      console.log("[v0] Transcript generated with", transcript.segments.length, "segments")
    } catch (error) {
      console.warn("[v0] Transcript generation warning:", error)
    }

    const brollAnalysisPrompt = `We have ${bRollFiles.length} B-roll video clips for a product demo.
Generate a description for each clip that would work well in a professional product presentation.
Return ONLY this exact JSON:
{
  "descriptions": [
    "Close-up of product interface showing dashboard with analytics",
    "Team members collaborating around a conference table",
    "Montage of the app being used on different devices"
  ]
}`

    let brollDescriptions: string[] = []
    try {
      const brollResponse = await callOpenRouter(
        brollAnalysisPrompt,
        "You are a video editor. Respond ONLY with valid JSON describing video clips.",
      )
      const jsonMatch = brollResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        brollDescriptions = parsed.descriptions || []
      }
      console.log("[v0] Generated descriptions for", brollDescriptions.length, "B-rolls")
    } catch (error) {
      console.warn("[v0] B-roll analysis warning:", error)
      brollDescriptions = bRollFiles.map((_, i) => `B-roll footage clip ${i + 1}`)
    }

    const planPrompt = `You are a video editor planning B-roll insertions for a ${aRollDuration.toFixed(0)}-second demo video.

Script with timestamps:
${transcript.segments.map((s) => `${s.start}s-${s.end}s: "${s.text}"`).join("\n")}

B-roll clips available (${bRollFiles.length} total):
${brollDescriptions.map((d, i) => `Clip ${i + 1}: ${d}`).join("\n")}

Plan 2-4 B-roll insertions that match the script content. Each insertion should:
- Start at a natural transition point
- Be 2-4 seconds long
- Match the spoken content
- Add visual value

Return ONLY this exact JSON format:
{
  "insertions": [
    {"start_sec": 5, "duration_sec": 3, "clip_index": 0, "confidence": 0.85, "reason": "Shows product interface"},
    {"start_sec": 15, "duration_sec": 2.5, "clip_index": 1, "confidence": 0.8, "reason": "Demonstrates team collaboration"}
  ]
}`

    let insertions = []
    try {
      const planResponse = await callOpenRouter(
        planPrompt,
        "You are a professional video editor. Respond ONLY with valid JSON. No markdown.",
      )
      const jsonMatch = planResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        insertions = (parsed.insertions || []).map((ins: any) => ({
          start_sec: ins.start_sec,
          duration_sec: ins.duration_sec,
          broll_id: `broll_${ins.clip_index || 0}`,
          confidence: ins.confidence || 0.8,
          reason: ins.reason || "Visual enhancement",
        }))
      }
      console.log("[v0] Plan created with", insertions.length, "insertions")
    } catch (error) {
      console.warn("[v0] Plan generation warning:", error)
      insertions = [
        {
          start_sec: 5,
          duration_sec: 3,
          broll_id: "broll_0",
          confidence: 0.8,
          reason: "Demonstrates key features",
        },
      ]
    }

    return NextResponse.json({
      insertions,
      aRollDuration,
      transcript,
    })
  } catch (error) {
    console.error("[v0] Plan endpoint error:", error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to generate timeline plan", details: errorMsg }, { status: 500 })
  }
}
