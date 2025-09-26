import { VideoPlayer } from "./modules/classroomvideo-player";
import ProgressSidebar from "./modules/progress-sidebar";

export default function ClassroomPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Classroom</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">UPSHIFT: English...</span>
            <span>class video • 20minute</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="max-w-[900px]">
              <VideoPlayer />
              
            </div>
          </div>
          <ProgressSidebar />
        </div>
      </div>
    </div>
  )
}
