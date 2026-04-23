import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fileUpload } from "@/lib/services";
import { createRecordingId, saveRecording } from "@/lib/utils";
import {
  Delete01Icon,
  Mic02Icon,
  MicOff02Icon,
  PauseIcon,
  PlayIcon,
  RotateClockwiseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";

type ControllerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionChange?: (session: {
    isActive: boolean;
    isPaused: boolean;
    remainingSeconds: number;
    isUploading: boolean;
  }) => void;
};

const RECORDING_LIMIT_SECONDS = 5 * 60;
type PendingAction = "discard" | "restart" | null;

const Controller = ({
  open,
  onOpenChange,
  onSessionChange,
}: ControllerProps) => {
  const [includeMic, setIncludeMic] = useState(false);
  const [confirmAction, setConfirmAction] = useState<PendingAction>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const pendingActionRef = useRef<PendingAction>(null);
  const preferredMimeType = usePreferredRecordingMimeType();

  const {
    error,
    isAudioMuted,
    muteAudio,
    pauseRecording,
    resumeRecording,
    startRecording,
    status,
    stopRecording,
    unMuteAudio,
  } = useReactMediaRecorder({
    audio: includeMic,
    blobPropertyBag: { type: preferredMimeType },
    mediaRecorderOptions: { mimeType: preferredMimeType },
    onStop: async (blobUrl, blob) => {
      const pendingAction = pendingActionRef.current;

      if (pendingAction === "discard" || pendingAction === "restart") {
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const recordingId = createRecordingId();
      const extension = preferredMimeType.includes("mp4") ? "mp4" : "webm";
      const fileName = `clipr-recording-${recordingId}.${extension}`;

      saveRecording({
        createdAt: Date.now(),
        downloadName: fileName,
        id: recordingId,
        mimeType: preferredMimeType,
        url: blobUrl,
      });

      try {
        setUploadError("");
        setIsUploading(true);
        await fileUpload(blob, fileName);
      } catch (error) {
        setUploadError("Recording saved locally, but upload failed.");
        console.error("Upload failed", error);
      } finally {
        setIsUploading(false);
      }
    },
    screen: true,
    selfBrowserSurface: "include",
    stopStreamsOnStop: true,
    video: {
      frameRate: { ideal: 30, max: 30 },
      height: { ideal: 1080 },
      width: { ideal: 1920 },
    },
  });

  const browserSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getDisplayMedia" in navigator.mediaDevices &&
    "MediaRecorder" in window;

  const [remainingSeconds, setRemainingSeconds] = useState(
    RECORDING_LIMIT_SECONDS,
  );

  useEffect(() => {
    if (status === "recording") {
      const timer = window.setInterval(() => {
        setRemainingSeconds((current) => Math.max(current - 1, 0));
      }, 1000);

      return () => window.clearInterval(timer);
    }

    if (status === "idle" || status === "stopped") {
      setRemainingSeconds(RECORDING_LIMIT_SECONDS);
    }
  }, [status]);

  const isBusy =
    status === "acquiring_media" ||
    status === "stopping" ||
    status === "delayed_start";

  const canStart =
    browserSupported && (status === "idle" || status === "stopped") && !isBusy;

  const canStop = status === "recording" || status === "paused";
  const canPause = status === "recording";
  const canResume = status === "paused";
  const canToggleMute =
    includeMic && (status === "recording" || status === "paused");
  const canDiscardOrRestart = canPause || canResume;
  const durationLabel = formatDuration(remainingSeconds);
  const statusText = uploadError
    ? uploadError
    : error
      ? getErrorText(error)
      : getStatusText(status, isUploading);

  useEffect(() => {
    if (status === "recording" && remainingSeconds === 0) {
      stopRecording();
    }
  }, [remainingSeconds, status, stopRecording]);

  useEffect(() => {
    onSessionChange?.({
      isActive: canStop,
      isPaused: canResume,
      remainingSeconds,
      isUploading,
    });
  }, [canResume, canStop, isUploading, onSessionChange, remainingSeconds]);

  useEffect(() => {
    if (!canStop) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [canStop]);

  useEffect(() => {
    if (status !== "stopped") {
      return;
    }

    if (pendingActionRef.current === "discard") {
      pendingActionRef.current = null;
      onOpenChange(false);
      return;
    }

    if (pendingActionRef.current === "restart") {
      pendingActionRef.current = null;
      startRecording();
    }
  }, [onOpenChange, startRecording, status]);

  const handlePrimaryAction = () => {
    if (canStart) {
      setUploadError("");
      startRecording();
      return;
    }

    if (canStop) {
      stopRecording();
    }
  };

  const handlePauseToggle = () => {
    if (canPause) {
      pauseRecording();
      return;
    }

    if (canResume) {
      resumeRecording();
    }
  };

  const handleMicToggle = () => {
    if (status === "idle" || status === "stopped") {
      setIncludeMic((current) => !current);
      return;
    }

    if (canToggleMute) {
      if (isAudioMuted) {
        unMuteAudio();
      } else {
        muteAudio();
      }
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction || !canDiscardOrRestart) {
      setConfirmAction(null);
      return;
    }

    pendingActionRef.current = confirmAction;
    setConfirmAction(null);
    stopRecording();
  };

  const micIcon = !includeMic || isAudioMuted ? MicOff02Icon : Mic02Icon;
  const pauseIcon = canResume ? PlayIcon : PauseIcon;
  const primaryRingClass = canStop ? "bg-red-500" : "bg-orange-600";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-auto rounded-t-3xl border-t border-gray-200 bg-white p-0"
          onInteractOutside={(event) => {
            if (confirmAction) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (confirmAction) {
              event.preventDefault();
            }
          }}
        >
          <SheetHeader className="border-b border-gray-200 px-6 py-5">
            <div className="m-auto flex flex-col text-center">
              <SheetTitle className="text-gray-900">
                Instant Screen Recording
              </SheetTitle>
              <SheetDescription className="mb-8 text-sm text-gray-600">
                {statusText}
              </SheetDescription>

              <div className="mb-5 flex items-center justify-center ">
                <div className="rounded-full bg-gray-200 px-3 py-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {durationLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="flex h-14 items-center justify-center gap-2 rounded-full bg-gray-200 px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleMicToggle}
                    className={`${includeMic ? "bg-transparent" : "bg-gray-300"} flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-in-out hover:bg-gray-300`}
                  >
                    <HugeiconsIcon
                      icon={micIcon}
                      size={22}
                      className="text-gray-700"
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy || (!canPause && !canResume)}
                    onClick={handlePauseToggle}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-in-out hover:bg-gray-300"
                  >
                    <HugeiconsIcon
                      size={22}
                      icon={pauseIcon}
                      className="text-gray-700"
                    />
                  </Button>
                  <div className="flex h-19 w-19 items-center justify-center rounded-full bg-gray-200 shadow-md">
                    <button
                      type="button"
                      disabled={isBusy || (!canStart && !canStop)}
                      onClick={handlePrimaryAction}
                      className="flex h-[60%] w-[60%] cursor-pointer items-center justify-center rounded-full bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div
                        className={
                          canStop
                            ? `h-[45%] w-[45%] rounded ${primaryRingClass}`
                            : `h-[85%] w-[85%] rounded-full ${primaryRingClass}`
                        }
                      ></div>
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy || !canDiscardOrRestart}
                    onClick={() => setConfirmAction("restart")}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-in-out hover:bg-gray-300"
                  >
                    <HugeiconsIcon
                      size={22}
                      icon={RotateClockwiseIcon}
                      className="text-gray-700"
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy || !canDiscardOrRestart}
                    onClick={() => setConfirmAction("discard")}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-in-out hover:bg-gray-300"
                  >
                    <HugeiconsIcon
                      size={22}
                      icon={Delete01Icon}
                      className="text-gray-700"
                    />
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="m-auto">
                  <p className="mt-5 max-w-sm text-center text-sm text-red-600">
                    {statusText}
                  </p>
                </div>
              ) : null}
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "restart"
                ? "Restart recording?"
                : "Discard recording?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "restart"
                ? "Your current recording will be discarded and a new recording will start from 5:00."
                : "Your current recording will be discarded and cannot be recovered."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="ring-0 border-0 py-5 px-5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-orange-600 text-white hover:bg-orange-700 cursor-pointer duration-150 ease-in-out transition py-5 px-5"
              onClick={handleConfirmAction}
            >
              {confirmAction === "restart" ? "Restart" : "Discard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Controller;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getStatusText(status: string, isUploading = false) {
  if (isUploading) {
    return "Uploading your recording.";
  }

  switch (status) {
    case "acquiring_media":
      return "Waiting for the share picker.";
    case "delayed_start":
      return "Preparing the recorder.";
    case "recording":
      return "Recording is live.";
    case "paused":
      return "Recording is paused.";
    case "stopping":
      return "Finishing your recording.";
    case "stopped":
      return "Recording finished and saved locally.";
    case "permission_denied":
      return "Permissions were denied.";
    default:
      return "Ready to record.";
  }
}

function getErrorText(error: string) {
  switch (error) {
    case "permission_denied":
      return "Recording permissions were denied. Try again and allow screen or microphone access.";
    case "no_specified_media_found":
      return "No valid recording source was found.";
    case "media_in_use":
      return "The selected media device is already in use.";
    case "invalid_media_constraints":
      return "The selected recording constraints are not supported by this browser.";
    case "recorder_error":
      return "The recorder could not be started.";
    default:
      return "";
  }
}

function usePreferredRecordingMimeType() {
  return useMemo(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return "video/webm";
    }

    const candidates = [
      "video/mp4;codecs=h264,aac",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    return (
      candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ??
      "video/webm"
    );
  }, []);
}
