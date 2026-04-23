import { Button } from "@/components/ui/button";
import { useScreenRecordsList } from "@/hooks/useQueryInstance";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/recordings/$recordId")({
  component: RecordingSharePage,
});

function RecordingSharePage() {
  const { recordId } = Route.useParams();
  const { data, isLoading, isError } = useScreenRecordsList();

  const recording = useMemo(() => {
    return data?.data.find((item) => item.data.recordId === recordId) ?? null;
  }, [data?.data, recordId]);

  const playbackUrl = recording
    ? resolveRecordingUrl(recording.data.record)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Public Recording</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Recording {recordId}
          </h1>
        </div>

        <Button asChild variant="outline" className="border-gray-300">
          <Link to="/">Back to Library</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
          <div className="aspect-video animate-pulse bg-gray-200" />
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We couldn&apos;t load this shared recording.
        </div>
      ) : null}

      {!isLoading && !isError && !recording ? (
        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          This recording could not be found.
        </div>
      ) : null}

      {!isLoading && !isError && recording ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
          {playbackUrl ? (
            <video
              className="aspect-video w-full bg-black"
              controls
              playsInline
              preload="metadata"
              src={playbackUrl}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-orange-700 px-6 text-center text-sm text-white">
              This recording does not currently expose a public playback URL.
            </div>
          )}

          <div className="space-y-3 p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Recording {recording.data.recordId}
            </h2>
            <p className="text-sm text-gray-500">
              Media reference: {recording.data.record}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function resolveRecordingUrl(recordValue: string) {
  if (/^https?:\/\//i.test(recordValue)) {
    return recordValue;
  }

  return null;
}
