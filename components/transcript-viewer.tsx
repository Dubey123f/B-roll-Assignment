"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface TranscriptViewerProps {
  transcript: any
  insertions: any[]
}

export function TranscriptViewer({ transcript, insertions }: TranscriptViewerProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set())

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSegments(newExpanded)
  }

  const getInsertionsForSegment = (segmentStart: number, segmentEnd: number) => {
    return insertions.filter((ins) => ins.start_sec >= segmentStart && ins.start_sec < segmentEnd)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Transcript with B-Roll Insertions</h2>
        <p className="text-muted-foreground mb-4">Click on segments to see where B-roll will be inserted</p>
      </div>

      <ScrollArea className="border rounded-lg p-4 h-96">
        <div className="space-y-3">
          {transcript.segments?.map((segment: any, index: number) => {
            const segmentInsertions = getInsertionsForSegment(segment.start, segment.end)
            const isExpanded = expandedSegments.has(index)

            return (
              <div key={index}>
                <button
                  onClick={() => toggleSegment(index)}
                  className="w-full text-left p-3 bg-card hover:bg-secondary rounded-lg transition-colors border border-border"
                >
                  <div className="flex items-start gap-3">
                    <ChevronDown className={`w-4 h-4 mt-0.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
                        </span>
                        {segmentInsertions.length > 0 && (
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                            {segmentInsertions.length} B-roll insertion(s)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground break-words">{segment.text}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && segmentInsertions.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2 pb-2">
                    {segmentInsertions.map((insertion: any, insIndex: number) => (
                      <Card key={insIndex} className="p-3 bg-accent/10 border-accent/30">
                        <p className="text-sm font-semibold text-accent">B-Roll #{insertion.broll_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insertion.reason}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
