import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowDown01Icon,
  ComputerScreenShareIcon,
  Delete01Icon,
  Mic02Icon,
  PauseIcon,
  Video02Icon,
} from "@hugeicons/core-free-icons";
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
            <HugeiconsIcon icon={Video02Icon} /> Record New
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Outlet />
      </div>

      <Sheet open={isRecordDrawerOpen} onOpenChange={setIsRecordDrawerOpen}>
        <SheetContent
          side="bottom"
          className="h-auto rounded-t-3xl border-t border-gray-200 bg-white p-0"
        >
          <SheetHeader className="border-b border-gray-200 px-6 py-5">
            <div className="m-auto text-center">
              <SheetTitle className="text-gray-900">
                Instant Screen Recording
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-600">
                5 minutes recording limit
              </SheetDescription>

              <div className="bg-gray-200 w-auto px-8 h-14 rounded-full mt-10 flex items-center gap-2 justify-center">
                <div className="w-10 h-10 flex items-center justify-center transition hover:bg-gray-300 duration-100 ease-in-out rounded-full cursor-pointer relative">
                  <HugeiconsIcon icon={Mic02Icon} className="text-gray-700" />
                  <span className="w-4 h-4 bg-gray-100 border border-gray-400 rounded-full absolute right-0 bottom-0 flex items-center justify-center">
                    <HugeiconsIcon icon={ArrowDown01Icon} />
                  </span>
                </div>
                <div className="w-10 h-10 flex items-center justify-center transition hover:bg-gray-300 duration-100 ease-in-out rounded-full cursor-pointer">
                  <HugeiconsIcon icon={PauseIcon} className="text-gray-700" />
                </div>
                <div className="w-19 h-19 border-16 border-gray-200 bg-gray-900 rounded-full flex items-center justify-center">
                  <div className="w-[45%] h-[45%] bg-red-500 rounded-md cursor-pointer"></div>
                </div>
                <Button className="w-10 h-10 flex items-center justify-center transition hover:bg-gray-300 duration-100 ease-in-out rounded-full cursor-pointer">
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    className="text-gray-700"
                  />
                </Button>
                <div className="w-10 h-10 flex items-center justify-center transition hover:bg-gray-300 duration-100 ease-in-out rounded-full cursor-pointer">
                  <HugeiconsIcon
                    icon={ComputerScreenShareIcon}
                    className="text-gray-700"
                  />
                </div>
              </div>
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <TanStackRouterDevtools />
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout });
