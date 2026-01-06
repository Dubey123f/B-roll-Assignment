"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimelinePlannerProps {
  projectId: string
  onPlanCreated: (data: any) => void
  onTranscriptGenerated: (data: any) => void
  loading: boolean
  onLoading: (loading: boolean) => void
}

export function TimelinePlanner({
  projectId,
  onPlanCreated,
  onTranscriptGenerated,
  loading,
  onLoading,
}: TimelinePlannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [timeline, setTimeline] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const generatePlan = async () => {
    setIsLoading(true)
    onLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/projects/${projectId}/plan`, {
        method: "POST",
      })

      const text = await response.text()
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response text:", text.substring(0, 200))

      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${text}`)
      }

      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        console.error("[v0] Failed to parse JSON:", parseErr)
        throw new Error(`Invalid response format: ${text.substring(0, 100)}`)
      }

      if (data.error) {
        throw new Error(data.details || data.error)
      }

      setTimeline(data)
      onTranscriptGenerated(data.transcript)
      onPlanCreated(data)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[v0] Generate plan error:", errorMsg)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
      onLoading(false)
    }
  }

  if (!timeline) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Generate Timeline Plan</h2>
        <p className="text-muted-foreground">
          Analyze your A-roll transcription and B-roll content to create an automated insertion plan.
        </p>
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
        <Button onClick={generatePlan} disabled={isLoading || loading} className="w-full">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? "Generating Plan..." : "Generate Timeline Plan"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Timeline Plan Generated</h2>

      <ScrollArea className="border rounded-lg p-4 h-96">
        <div className="space-y-4">
          {timeline.insertions?.map((insertion: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">B-Roll Insert #{index + 1}</span>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  {insertion.start_sec.toFixed(2)}s - {(insertion.start_sec + insertion.duration_sec).toFixed(2)}s
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Reason: {insertion.reason}</p>
              <div className="text-xs pt-2 border-t border-border">
                <p className="font-mono text-muted-foreground">Duration: {insertion.duration_sec.toFixed(2)}s</p>
                <p className="font-mono text-muted-foreground">
                  Confidence: {(insertion.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-sm font-semibold mb-2">Plan Summary</p>
        <p className="text-sm text-muted-foreground">Total insertions: {timeline.insertions?.length || 0}</p>
        <p className="text-sm text-muted-foreground">A-roll duration: {timeline.aRollDuration?.toFixed(2)}s</p>
      </div>
    </div>
  )
}
