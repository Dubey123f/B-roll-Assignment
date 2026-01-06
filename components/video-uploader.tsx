"use client"

import type React from "react"
import { useState } from "react"
import { Upload, Loader2, CheckCircle, AlertCircle, X, Film, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoUploaderProps {
  onProjectCreated: (projectId: string) => void
  onLoading: (loading: boolean) => void
}

interface UploadFile {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

export function VideoUploader({ onProjectCreated, onLoading }: VideoUploaderProps) {
  const [aRollFile, setARollFile] = useState<UploadFile | null>(null)
  const [bRollFiles, setBRollFiles] = useState<UploadFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleARollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      if (file.size > 200 * 1024 * 1024) {
        setErrorMsg("A-roll file is too large (max 200MB)")
        setOverallStatus("error")
        return
      }
      setARollFile({
        file,
        status: "pending",
        progress: 0,
      })
      setOverallStatus("idle")
      setErrorMsg("")
    }
  }

  const handleBRollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => {
        if (file.size > 200 * 1024 * 1024) {
          return {
            file,
            status: "error" as const,
            progress: 0,
            error: "File too large (max 200MB)",
          }
        }
        return {
          file,
          status: "pending" as const,
          progress: 0,
        }
      })
      setBRollFiles([...bRollFiles, ...newFiles])
      setOverallStatus("idle")
      setErrorMsg("")
    }
  }

  const removeBRollFile = (index: number) => {
    setBRollFiles(bRollFiles.filter((_, i) => i !== index))
  }

  const removeARollFile = () => {
    setARollFile(null)
  }

  const handleSubmit = async () => {
    if (!aRollFile || bRollFiles.length === 0) {
      setErrorMsg("Upload both A-roll and B-roll videos to proceed")
      setOverallStatus("error")
      return
    }

    setIsLoading(true)
    setOverallStatus("uploading")
    onLoading(true)

    try {
      const formData = new FormData()
      formData.append("aRoll", aRollFile.file)
      bRollFiles.forEach((uploadFile, index) => {
        formData.append(`bRoll_${index}`, uploadFile.file)
      })

      console.log("[v0] Uploading files, total brolls:", bRollFiles.length)

      const response = await fetch("/api/projects/create", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response preview:", responseText.substring(0, 200))

      if (!response.ok) {
        let errorMsg = `Upload failed with status ${response.status}`
        try {
          const parsed = JSON.parse(responseText)
          errorMsg = parsed.error || errorMsg
        } catch {
          errorMsg = responseText || errorMsg
        }
        throw new Error(errorMsg)
      }

      const data = JSON.parse(responseText)
      const { projectId } = data

      if (!projectId) {
        throw new Error("Server did not return a project ID")
      }

      setARollFile((prev) => (prev ? { ...prev, status: "success", progress: 100 } : null))
      setBRollFiles((prev) => prev.map((f) => ({ ...f, status: "success", progress: 100 })))
      setOverallStatus("success")
      setErrorMsg("")
      onProjectCreated(projectId)
    } catch (error) {
      setOverallStatus("error")
      const msg = error instanceof Error ? error.message : "Upload failed"
      console.error("[v0] Upload error:", msg)
      setErrorMsg(msg)
      setARollFile((prev) => (prev ? { ...prev, status: "error", error: msg } : null))
    } finally {
      setIsLoading(false)
      onLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Upload Your Videos</h2>
        <p className="text-base text-muted-foreground">
          Upload your main A-roll content and supplementary B-roll clips for intelligent insertion analysis
        </p>
      </div>

      {/* A-Roll Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <label className="text-sm font-semibold">A-Roll (Main Content)</label>
        </div>
        {!aRollFile ? (
          <label className="block border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">Your main video file (MP4, WebM, etc.)</p>
              </div>
            </div>
            <input type="file" accept="video/*" onChange={handleARollChange} className="hidden" />
          </label>
        ) : (
          <div className="border border-border rounded-xl p-4 bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{aRollFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(aRollFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={removeARollFile}
                className="p-2 hover:bg-destructive/10 rounded-lg transition flex-shrink-0"
                disabled={isLoading}
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
            {aRollFile.status === "success" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ready for analysis</span>
              </div>
            )}
            {aRollFile.status === "error" && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{aRollFile.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* B-Roll Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <label className="text-sm font-semibold">B-Roll Videos (Supplementary Content)</label>
          </div>
          {bRollFiles.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {bRollFiles.length} file{bRollFiles.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <label className="block border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">Add multiple B-roll clips</p>
            </div>
          </div>
          <input type="file" accept="video/*" multiple onChange={handleBRollChange} className="hidden" />
        </label>

        {bRollFiles.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bRollFiles.map((uploadFile, index) => (
              <div
                key={`${uploadFile.file.name}-${index}`}
                className="border border-border rounded-lg p-3 bg-card hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBRollFile(index)}
                    className="p-1.5 hover:bg-destructive/10 rounded transition flex-shrink-0"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {overallStatus === "error" && errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">Upload failed</p>
            <p className="text-destructive/80 text-sm mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {overallStatus === "success" && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-300 text-sm">Upload successful!</p>
            <p className="text-green-600 dark:text-green-400 text-sm mt-1">Proceed to timeline analysis</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !aRollFile || bRollFiles.length === 0}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        {isLoading ? "Processing & Uploading..." : "Upload & Analyze"}
      </Button>
    </div>
  )
}
