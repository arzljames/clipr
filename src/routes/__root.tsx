import { Button } from "@/components/ui/button";
import { Controller as ScreenRecorder } from "@/components/ScreenRecorder";
import { PauseIcon, RecordIcon, Video02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";

type RecorderSession = {
  isActive: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  isUploading: boolean;
};

const RootLayout = () => {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [recorderSession, setRecorderSession] = useState<RecorderSession>({
    isActive: false,
    isPaused: false,
    remainingSeconds: 5 * 60,
    isUploading: false,
  });

  return (
    <div className="relative flex h-svh w-full flex-col">
      <div className="sticky top-0 z-50 flex min-h-16 h-16 w-full flex-row items-center border-b border-b-gray-300 bg-white px-6">
        <div className="m-auto flex h-full w-full max-w-400 items-center justify-between">
          <h1 className="text-2xl text-orange-600 font-bold">Clipr.</h1>
          <div className="flex items-center gap-3">
            {recorderSession.isActive ? (
              <Button
                variant="outline"
                className="cursor-pointer border-orange-200 bg-orange-50 px-3 py-5 text-sm font-medium text-orange-700 hover:bg-orange-100"
                onClick={() => setIsRecordDrawerOpen(true)}
              >
                <HugeiconsIcon
                  icon={recorderSession.isPaused ? PauseIcon : RecordIcon}
                  size={18}
                />
                {recorderSession.isPaused ? "Paused" : "Recording"}{" "}
                {formatHeaderDuration(recorderSession.remainingSeconds)}
              </Button>
            ) : (
              <Button
                className="cursor-pointer bg-orange-600 px-4 py-5 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-orange-700"
                onClick={() => setIsRecordDrawerOpen(true)}
              >
                <HugeiconsIcon icon={Video02Icon} size={18} /> Record New
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <Outlet />
      </div>

      <ScreenRecorder
        open={isRecordDrawerOpen}
        onOpenChange={setIsRecordDrawerOpen}
        onSessionChange={setRecorderSession}
      />

      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout });

function formatHeaderDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
