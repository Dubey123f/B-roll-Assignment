import { put } from "@vercel/blob"
import { randomBytes } from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Upload started")

    const formData = await req.formData()
    const aRoll = formData.get("aRoll") as File
    const bRolls: File[] = []

    let index = 0
    while (true) {
      const file = formData.get(`bRoll_${index}`) as File
      if (!file) break
      bRolls.push(file)
      index++
    }

    if (!aRoll || bRolls.length === 0) {
      console.log("[v0] Missing files: aRoll=", !!aRoll, "bRolls count=", bRolls.length)
      return NextResponse.json({ error: "Missing A-roll or B-roll files" }, { status: 400 })
    }

    console.log("[v0] A-roll size:", aRoll.size, "B-rolls:", bRolls.length)

    const projectId = randomBytes(16).toString("hex")
    console.log("[v0] Project ID:", projectId)

    // Upload A-roll
    let aRollBlob
    try {
      aRollBlob = await put(`projects/${projectId}/aroll.mp4`, aRoll, {
        access: "public",
        addRandomSuffix: false,
      })
      console.log("[v0] A-roll uploaded successfully:", aRollBlob.url)
    } catch (uploadError: any) {
      console.error("[v0] A-roll upload error:", uploadError)
      let errorMessage = "A-roll upload failed"
      if (uploadError?.message && typeof uploadError.message === "string") {
        errorMessage = uploadError.message
      } else if (uploadError?.error?.message) {
        errorMessage = uploadError.error.message
      } else if (typeof uploadError === "string") {
        errorMessage = uploadError
      } else {
        // For unknown error types, just log and use generic message
        console.error("[v0] Detailed error:", JSON.stringify(uploadError, null, 2))
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Upload B-rolls
    const bRollUrls = []
    for (let i = 0; i < bRolls.length; i++) {
      try {
        const blob = await put(`projects/${projectId}/broll_${i}.mp4`, bRolls[i], {
          access: "public",
          addRandomSuffix: false,
        })
        bRollUrls.push(blob.url)
        console.log(`[v0] B-roll ${i} uploaded successfully`)
      } catch (uploadError: any) {
        console.error(`[v0] B-roll ${i} upload error:`, uploadError)
        let errorMessage = `B-roll ${i} upload failed`
        if (uploadError?.message && typeof uploadError.message === "string") {
          errorMessage = uploadError.message
        } else if (uploadError?.error?.message) {
          errorMessage = uploadError.error.message
        } else if (typeof uploadError === "string") {
          errorMessage = uploadError
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
    }

    console.log("[v0] All uploads completed for project:", projectId)

    return NextResponse.json({
      projectId,
      aRollUrl: aRollBlob.url,
      bRollUrls,
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    let msg = "Unknown error"
    if (error?.message && typeof error.message === "string") {
      msg = error.message
    } else if (typeof error === "string") {
      msg = error
    }
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 })
  }
}
