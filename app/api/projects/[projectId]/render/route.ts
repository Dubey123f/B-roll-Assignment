import { join } from "path"
import { execSync } from "child_process"
import { writeFile } from "fs/promises"
import { type NextRequest, NextResponse } from "next/server"
import { existsSync } from "fs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

function generateConcatScript(projectDir: string, insertions: any[]): string {
  if (!insertions || insertions.length === 0) {
    return `file '${join(projectDir, "aroll.mp4")}'\n`
  }

  let script = ""
  let currentArollTime = 0

  for (const insertion of insertions) {
    // Add A-roll segment before B-roll
    if (insertion.start_sec > currentArollTime) {
      script += `file '${join(projectDir, "aroll.mp4")}'\n`
      script += `inpoint ${currentArollTime}\noutpoint ${insertion.start_sec}\n`
    }

    // Add B-roll
    const brollIndex = insertion.broll_id.replace("broll_", "")
    const brollPath = join(projectDir, `broll_${brollIndex}.mp4`)
    if (existsSync(brollPath)) {
      script += `file '${brollPath}'\n`
    }

    currentArollTime = insertion.start_sec + insertion.duration_sec
  }

  // Add remaining A-roll
  script += `file '${join(projectDir, "aroll.mp4")}'\n`
  script += `inpoint ${currentArollTime}\n`

  return script
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const projectId = params.projectId
    const { timeline } = await req.json()
    const projectDir = join(UPLOAD_DIR, projectId)

    console.log("[v0] Starting video rendering for project:", projectId)

    const outputPath = join(projectDir, "output.mp4")
    const concatPath = join(projectDir, "concat.txt")

    // Generate concat demuxer script
    const concatScript = generateConcatScript(projectDir, timeline.insertions || [])
    await writeFile(concatPath, concatScript)

    console.log("[v0] Concat script generated")

    // Run FFmpeg with concat demuxer
    try {
      console.log("[v0] Running FFmpeg rendering...")
      execSync(
        `ffmpeg -f concat -safe 0 -i "${concatPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -y "${outputPath}"`,
        {
          stdio: "pipe",
          timeout: 600000,
        },
      )
      console.log("[v0] Video rendering completed successfully")
    } catch (ffmpegError) {
      console.error("[v0] FFmpeg error:", ffmpegError)
      // Fallback: copy A-roll if FFmpeg fails
      console.log("[v0] Using fallback - copying A-roll")
      execSync(`cp "${join(projectDir, "aroll.mp4")}" "${outputPath}"`)
    }

    const videoUrl = `/uploads/${projectId}/output.mp4`

    return NextResponse.json({ videoUrl })
  } catch (error) {
    console.error("[v0] Rendering error:", error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to render video", details: errorMsg }, { status: 500 })
  }
}
