"use client"

import { useState } from "react"
import { Loader2, Download, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoRendererProps {
  projectId: string
  timelineData: any
}

export function VideoRenderer({ projectId, timelineData }: VideoRendererProps) {
  const [isRendering, setIsRendering] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "rendering" | "success" | "error">("idle")

  const renderVideo = async () => {
    setIsRendering(true)
    setStatus("rendering")
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline: timelineData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Rendering failed")
      }

      const data = await response.json()
      setVideoUrl(data.videoUrl)
      setStatus("success")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Rendering failed"
      setError(errorMsg)
      setStatus("error")
    } finally {
      setIsRendering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Render Final Video</h2>
        <p className="text-muted-foreground">
          Stitch together your A-roll and B-roll videos based on the planned timeline. This may take a few moments.
        </p>
      </div>

      {status === "idle" && (
        <Button onClick={renderVideo} disabled={isRendering} className="w-full">
          {isRendering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isRendering ? "Rendering..." : "Start Video Rendering"}
        </Button>
      )}

      {status === "rendering" && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing video... This may take a moment</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Rendering Error</p>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={renderVideo} variant="outline" size="sm" className="mt-3 bg-transparent">
              Retry
            </Button>
          </div>
        </div>
      )}

      {status === "success" && videoUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Video rendered successfully!</span>
          </div>

          <div className="bg-secondary rounded-lg p-6 overflow-hidden">
            <video src={videoUrl} controls className="w-full rounded-lg bg-black" />
          </div>

          <a href={videoUrl} download className="block">
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Final Video
            </Button>
          </a>

          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2">What's next:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Download your video and use it for your project</li>
              <li>You can upload new videos to create another project</li>
              <li>Consider adjusting B-roll durations for optimal pacing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
