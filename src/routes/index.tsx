import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useScreenRecordsList } from "@/hooks/useQueryInstance";
import {
  ArrowUpDownIcon,
  Copy01Icon,
  LinkSquare02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, isLoading, isError } = useScreenRecordsList();
  const [sort, setSort] = useState({
    label: "Newest to Oldest",
    value: "desc",
  });
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false);
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);

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

  const sortedRecords = useMemo(() => {
    const records = [...(data?.data ?? [])];

    if (sort.value === "asc") {
      return records.reverse();
    }

    return records;
  }, [data?.data, sort.value]);

  const latestRecord = useMemo(() => {
    return data?.data?.[0] ?? null;
  }, [data?.data]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyShareLink = async (recordId: string) => {
    try {
      const shareUrl = buildRecordingShareUrl(recordId);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedRecordId(recordId);
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedRecordId(null);
      }, 3000);
    } catch (error) {
      toast.error("Could not copy the share link.");
    }
  };

  return (
    <div className="w-full max-w-400 m-auto">
      <div>
        <h2 className="text-xl font-medium text-gray-800">Recently Added</h2>
        <div className="mt-4">
          {isLoading ? (
            <div className="h-100 w-full animate-pulse rounded-3xl bg-gray-200" />
          ) : null}

          {!isLoading && latestRecord ? (
            <FeaturedRecordingCard
              record={latestRecord}
              onCopyShareLink={handleCopyShareLink}
              copiedRecordId={copiedRecordId}
            />
          ) : null}

          {!isLoading && !isError && !latestRecord ? (
            <div className="flex h-72 w-full items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
              No featured recording yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h4 className="text-sm text-gray-500">Library</h4>
          <h2 className="text-xl text-gray-800 font-medium">Videos</h2>
        </div>

        <Popover open={isSortPopoverOpen} onOpenChange={setIsSortPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              className="border-gray-300 cursor-pointer hover:bg-gray-100 duration-100 ease-in-out transition"
              variant="outline"
            >
              <HugeiconsIcon size={16} icon={ArrowUpDownIcon} />
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

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white"
              >
                <div className="h-44 animate-pulse bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))
          : null}

        {!isLoading && isError ? (
          <div className="col-span-full rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            We couldn&apos;t load the screen recordings right now.
          </div>
        ) : null}

        {!isLoading && !isError && sortedRecords.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            No screen recordings yet. Start your first recording to see it here.
          </div>
        ) : null}

        {!isLoading &&
          !isError &&
          sortedRecords.map((record) => {
            const playbackUrl = resolveRecordingUrl(record.data.record);

            return (
              <article
                key={record.meta.ZUID}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                {playbackUrl ? (
                  <video
                    className="h-44 w-full bg-gray-950 object-cover"
                    src={playbackUrl}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-44 items-end bg-gradient-to-br from-gray-900 via-gray-800 to-orange-700 p-4">
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
                      Screen Recording
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-1 text-base font-medium text-gray-900">
                      Recording {record.data.recordId}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                      {playbackUrl
                        ? "Ready to share publicly"
                        : "Preview unavailable until a public media URL is returned"}
                    </p>
                  </div>

                  {/* <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>ZUID {record.meta.ZUID}</span>
                    <span>{record.meta.contentModelZUID}</span>
                  </div> */}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      asChild
                      className="bg-orange-600 text-white hover:bg-orange-700 transition ease-in-out duration-150"
                    >
                      <a
                        href={buildRecordingShareUrl(record.data.recordId)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <HugeiconsIcon icon={LinkSquare02Icon} size={16} />
                        Open
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-300 text-gray-800 cursor-pointer bg-white hover:bg-gray-100 transition ease-in-out duration-150"
                      onClick={() => handleCopyShareLink(record.data.recordId)}
                    >
                      {copiedRecordId === record.data.recordId ? (
                        <>
                          <HugeiconsIcon icon={Tick02Icon} size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon icon={Copy01Icon} size={16} /> Copy
                          Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

function buildRecordingShareUrl(recordId: string) {
  if (typeof window === "undefined") {
    return `/recordings/${recordId}`;
  }

  return `${window.location.origin}/recordings/${recordId}`;
}

function resolveRecordingUrl(recordValue: string) {
  if (/^https?:\/\//i.test(recordValue)) {
    return recordValue;
  }

  return null;
}

type ScreenRecord = NonNullable<
  ReturnType<typeof useScreenRecordsList>["data"]
>["data"][number];

function FeaturedRecordingCard({
  record,
  onCopyShareLink,
  copiedRecordId,
}: {
  record: ScreenRecord;
  onCopyShareLink: (recordId: string) => void;
  copiedRecordId: string | null;
}) {
  const playbackUrl = resolveRecordingUrl(record.data.record);

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="grid min-h-72 grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        {playbackUrl ? (
          <video
            className="h-full min-h-72 w-full bg-gray-950 object-cover"
            controls
            src={playbackUrl}
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex min-h-72 items-end bg-gradient-to-br from-gray-900 via-gray-800 to-orange-700 p-6">
            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
              Featured Recording
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between gap-6 p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-orange-600">
              Latest recorded
            </p>
            <h3 className="text-2xl font-semibold text-gray-900">
              Recording {record.data.recordId}
            </h3>
            <p className="text-sm leading-6 text-gray-500">
              {playbackUrl
                ? "Your newest uploaded screen recording is ready to view and share."
                : "This latest recording is listed, but it does not expose a public preview URL yet."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>ZUID {record.meta.ZUID}</span>
              <span>{record.meta.contentModelZUID}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                <a
                  href={buildRecordingShareUrl(record.data.recordId)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open Recording
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300"
                onClick={() => onCopyShareLink(record.data.recordId)}
              >
                {copiedRecordId === record.data.recordId ? (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                    Copied
                  </>
                ) : (
                  "Copy Link"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
