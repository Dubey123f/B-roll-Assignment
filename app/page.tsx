"use client"

import { useState } from "react"
import { VideoUploader } from "@/components/video-uploader"
import { TimelinePlanner } from "@/components/timeline-planner"
import { TranscriptViewer } from "@/components/transcript-viewer"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Film } from "lucide-react"

export default function Page() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [transcriptData, setTranscriptData] = useState<any>(null)
  const [timelineData, setTimelineData] = useState<any>(null)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">B-Roll Inserter</h1>
            </div>
            <p className="text-sm text-muted-foreground">Intelligent video editing powered by AI</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Tabs value={projectId ? (timelineData ? "timeline" : "analyze") : "upload"} className="w-full">
          {/* Tab Navigation */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1">
              <TabsTrigger value="upload" className="relative">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold">1</span>
                  Upload
                </span>
                {projectId && <CheckCircle className="w-4 h-4 absolute right-2 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="analyze" disabled={!projectId}>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold">2</span>
                  Analyze
                </span>
                {timelineData && <CheckCircle className="w-4 h-4 absolute right-2 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="timeline" disabled={!timelineData}>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold">3</span>
                  Timeline
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="upload" className="mt-0">
            <Card className="p-8 border-0 shadow-lg">
              <VideoUploader onProjectCreated={setProjectId} onLoading={() => {}} />
            </Card>
          </TabsContent>

          <TabsContent value="analyze" className="mt-0">
            {projectId && (
              <Card className="p-8 border-0 shadow-lg">
                <TimelinePlanner
                  projectId={projectId}
                  onPlanCreated={setTimelineData}
                  onTranscriptGenerated={setTranscriptData}
                  loading={false}
                  onLoading={() => {}}
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            {transcriptData && timelineData && (
              <Card className="p-8 border-0 shadow-lg">
                <TranscriptViewer transcript={transcriptData} insertions={timelineData.insertions} />
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
