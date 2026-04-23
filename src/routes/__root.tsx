import { Button } from "@/components/ui/button";
import { Controller as ScreenRecorder } from "@/components/ScreenRecorder";
import { Video02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";

const RootLayout = () => {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);

  return (
    <div className="relative flex h-svh w-full flex-col">
      <div className="sticky top-0 z-50 flex min-h-16 h-16 w-full flex-row items-center border-b border-b-gray-300 bg-white px-6">
        <div className="m-auto flex h-full w-full max-w-400 items-center justify-between">
          <h1>Clipr</h1>
          <Button
            className="cursor-pointer bg-orange-600 px-4 py-5 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-orange-700"
            onClick={() => setIsRecordDrawerOpen(true)}
          >
            <HugeiconsIcon icon={Video02Icon} size={18} /> Record New
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Outlet />
      </div>

      <ScreenRecorder
        open={isRecordDrawerOpen}
        onOpenChange={setIsRecordDrawerOpen}
      />

      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout });
