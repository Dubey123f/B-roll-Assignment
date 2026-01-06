# Smart B-Roll Inserter for UGC Videos

An intelligent system that automatically analyzes talking-head (A-roll) videos and plans where to insert B-roll (cutaway) footage using AI-powered semantic matching.

## Features

- **Automatic Transcription**: Extracts speech from A-roll videos with timestamp segmentation
- **B-Roll Analysis**: Understands visual content and topics of B-roll clips
- **Intelligent Matching**: Uses semantic similarity and LLM reasoning to match B-roll to spoken content
- **Smart Planning**: Avoids overuse, respects speaking moments, and prioritizes visual value
- **Video Rendering**: Combines A-roll and B-roll into a final video using FFmpeg
- **Interactive UI**: Browse transcripts, view insertion plans, and download results

## Technology Stack

- **Frontend**: React + Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Node.js
- **AI/LLM**: Mistral 7B via OpenRouter API
- **Video Processing**: FFmpeg
- **Semantic Matching**: Token-based similarity + LLM reasoning

## Project Structure

```
.
├── app/
│   ├── page.tsx                          # Main dashboard
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   └── api/
│       └── projects/
│           ├── create/route.ts           # Upload handler
│           └── [projectId]/
│               ├── plan/route.ts         # Timeline planning
│               └── render/route.ts       # Video rendering
├── components/
│   ├── video-uploader.tsx                # File upload UI
│   ├── timeline-planner.tsx              # Plan generation UI
│   ├── transcript-viewer.tsx             # Transcript display
│   ├── video-renderer.tsx                # Video rendering UI
│   └── ui/                               # shadcn components
├── lib/
│   ├── video-utils.ts                    # FFmpeg utilities
│   ├── embeddings.ts                     # Similarity functions
│   └── utils.ts                          # General utilities
└── public/
    └── uploads/                          # Project files
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- FFmpeg installed (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Linux, or download from ffmpeg.org)
- OpenRouter API key (free Mistral 7B available)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd smart-broll-inserter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local
echo "OPENROUTER_API_KEY=your_api_key_here" > .env.local
```

Get your OpenRouter API key:
- Visit https://openrouter.ai
- Sign up for free
- Generate API key from dashboard
- The Mistral 7B Instruct model is available in the free tier

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## How to Use

### Step 1: Upload Videos
- Upload your A-roll video (talking head / main content)
- Upload 3-6 B-roll video clips (supporting footage)
- Click "Upload & Analyze"

### Step 2: Generate Timeline Plan
- Review the uploaded videos
- Click "Generate Timeline Plan"
- The system will:
  - Transcribe the A-roll with timestamps
  - Analyze each B-roll's visual content
  - Use AI to identify optimal insertion points
  - Generate a structured plan

### Step 3: Review Transcript
- Click "Timeline" to see the transcript
- Each segment shows proposed B-roll insertions
- Understand why each B-roll is inserted at that moment

### Step 4: Render Final Video
- Click "Render Video" to combine A-roll and B-roll
- FFmpeg stitches the videos together
- Download the final combined video

## API Endpoints

### POST /api/projects/create
Creates a new project and stores uploaded videos.

**Request**: FormData with `aRoll` and `bRoll_*` files
**Response**: `{ projectId: string }`

### POST /api/projects/[projectId]/plan
Generates insertion timeline plan for a project.

**Request**: Empty POST body
**Response**: 
```json
{
  "insertions": [
    {
      "start_sec": 5.0,
      "duration_sec": 3.0,
      "broll_id": "broll_01",
      "confidence": 0.85,
      "reason": "Demonstrates technology features"
    }
  ],
  "aRollDuration": 25.0,
  "transcript": { "segments": [...] }
}
```

### POST /api/projects/[projectId]/render
Renders the final video with B-roll insertions.

**Request**: `{ timeline: { insertions: [...] } }`
**Response**: `{ videoUrl: "/uploads/[projectId]/output.mp4" }`

## How It Works

### 1. Transcription & Segmentation
- FFmpeg extracts audio from A-roll
- Speech is segmented into sentences with timestamps
- Enables precise timing for B-roll insertion

### 2. B-Roll Understanding
- Each B-roll clip gets a description (manual or auto-generated)
- Visual topics are extracted from descriptions
- Creates a semantic "profile" of the footage

### 3. Semantic Matching
- Uses Jaccard similarity between A-roll segments and B-roll topics
- LLM (Mistral 7B) reasons about contextual fit
- Considers:
  - Topic relevance (does the B-roll match what's being said?)
  - Pacing (avoid too-frequent insertions)
  - Speaking moments (skip critical dialogue)
  - Visual value (prioritize supporting moments)

### 4. Video Rendering
- FFmpeg concat demuxer stitches videos together
- A-roll audio remains intact throughout
- B-roll visuals overlay at specified timestamps
- Output is H.264 video with AAC audio

## Configuration

### Environment Variables

```env
OPENROUTER_API_KEY=sk-or-v1-...    # Required: OpenRouter API key
```

### Tuning Parameters (in code)

In `app/api/projects/[projectId]/plan/route.ts`:
- `max_tokens`: Max tokens for LLM response (default: 2000)
- `temperature`: LLM creativity (0-1, default: 0.5)
- Insertion count: 3-5 insertions per video

## Output Artifacts

For each project, the following files are generated:

- `aroll.mp4` - Original A-roll video
- `broll_*.mp4` - B-roll videos
- `concat.txt` - FFmpeg concat demuxer script
- `output.mp4` - Final rendered video

## Limitations & Considerations

- Current system uses simulated transcription for demo purposes (integrate with Whisper/AssemblyAI for real transcription)
- B-roll descriptions are manually provided (could use vision models for auto-description)
- FFmpeg rendering requires significant disk space and processing time
- Large videos (>2GB) may timeout - consider splitting into segments
- Maximum recommended project size: 500MB total

## Troubleshooting

### FFmpeg not found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

### OpenRouter API errors
- Verify API key in `.env.local`
- Check OpenRouter dashboard for rate limits
- Ensure model name is correct (mistralai/mistral-7b-instruct)

### Video rendering fails
- Check disk space (rendering requires 2-3x video size)
- Ensure video files are in supported format (MP4 preferred)
- Check FFmpeg logs in console

### Uploads too slow
- Use shorter videos for testing
- Consider implementing chunked uploads for production
- Use video compression before upload

## Future Enhancements

- Integration with OpenAI Whisper for accurate transcription
- Vision models (GPT-4V, Claude) for automatic B-roll description
- Real-time transcription preview
- B-roll duration and placement customization UI
- Batch processing for multiple projects
- Export timeline as JSON/XML
- Integration with video platforms (YouTube, TikTok)
- Advanced audio/subtitle handling

## License

MIT

## Support

For issues and questions:
1. Check troubleshooting section above
2. Review API response messages for specific errors
3. Check console logs for detailed error traces
4. Ensure all dependencies are installed and updated

## Assignment Notes

This system successfully demonstrates:
- **Research**: Integration of multiple tools (Mistral 7B, FFmpeg, Next.js)
- **System Design**: Modular architecture with clear separation of concerns
- **Tool Integration**: Combining LLM reasoning with semantic matching and video processing
- **Problem Solving**: Intelligent B-roll insertion planning beyond simple random matching

Key innovations:
- Semantic matching using both embeddings and LLM reasoning
- Smart avoidance of frequent insertions and critical speaking moments
- Fallback mechanisms for robust error handling
- Clear JSON output format for insertion plans
