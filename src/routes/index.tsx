import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowUpDownIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [sort, setSort] = useState({
    label: "Newest to Oldest",
    value: "desc",
  });
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false);

  const sortOptions = [
    {
      label: "Newest to Oldest",
      value: "desc",
    },
    {
      label: "Oldest to Newest",
      value: "asc",
    },
  ];
  return (
    <div className="w-full max-w-400 m-auto">
      <div>
        <h2 className="text-xl">Recently Added</h2>
        <div className="w-full h-50 bg-gray-200 mt-4"></div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h4 className="text-sm text-gray-500">Library</h4>
          <h2 className="text-xl text-gray-900">Videos</h2>
        </div>

        <Popover open={isSortPopoverOpen} onOpenChange={setIsSortPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              className="border-gray-300 cursor-pointer hover:bg-gray-100 duration-100 ease-in-out transition"
              variant="outline"
            >
              <HugeiconsIcon icon={ArrowUpDownIcon} />
              {sort.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="ring-gray-300 gap-0">
            {sortOptions.map(({ label, value }) => {
              return (
                <span
                  key={value}
                  onClick={() => {
                    setSort({ value, label });
                    setIsSortPopoverOpen(false);
                  }}
                  className="p-2 bg-red-5 hover:bg-gray-100 rounded-lg cursor-pointer duration-100 ease-in-out transition flex items-center"
                >
                  <p>{label}</p>
                  {sort.value === value && (
                    <HugeiconsIcon
                      size={18}
                      className="ml-2"
                      icon={Tick02Icon}
                    />
                  )}
                </span>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
