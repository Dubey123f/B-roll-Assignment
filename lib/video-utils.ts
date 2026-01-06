import { execSync } from "child_process"

export async function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void> {
  try {
    execSync(`ffmpeg -i "${videoPath}" -q:a 9 -n "${outputPath}"`, { stdio: "pipe" })
  } catch (error) {
    console.error("Audio extraction failed:", error)
  }
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`,
      { encoding: "utf-8" },
    )
    return Number.parseFloat(output.trim())
  } catch (error) {
    console.error("Failed to get video duration:", error)
    return 0
  }
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
}

export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration,width,height,r_frame_rate -of csv=p=0 "${videoPath}"`,
      { encoding: "utf-8" },
    )
    const [duration, width, height, fps] = output.trim().split(",")
    return {
      duration: Number.parseFloat(duration),
      width: Number.parseInt(width),
      height: Number.parseInt(height),
      fps: Number.parseInt(fps.split("/")[0]) / Number.parseInt(fps.split("/")[1]),
    }
  } catch (error) {
    console.error("Failed to get video metadata:", error)
    return { duration: 0, width: 0, height: 0, fps: 0 }
  }
}
