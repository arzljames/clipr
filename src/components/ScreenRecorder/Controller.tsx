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
import { useFileUpload } from "@/hooks/useQueryInstance";
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
import { toast } from "sonner";

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
  const pendingActionRef = useRef<PendingAction>(null);
  const preferredMimeType = usePreferredRecordingMimeType();
  const { mutateAsync: uploadFile, isPending: isUploading } = useFileUpload();

  const {
    error,
    isAudioMuted,
    muteAudio,
    pauseRecording,
    previewAudioStream,
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
        await uploadFile({ file: blob, fileName });
        toast.success("Recording uploaded successfully.");
      } catch (error) {
        setUploadError("Recording saved locally, but upload failed.");
        toast.error("Recording upload failed.");
        console.error("Upload failed", error);
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
  const canToggleMute = status === "recording" || status === "paused";
  const canDiscardOrRestart = canPause || canResume;
  const hasCapturedAudioTrack =
    (previewAudioStream?.getAudioTracks().length ?? 0) > 0;
  const audioLevel = useAudioLevel(previewAudioStream, hasCapturedAudioTrack);
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
      if (!hasCapturedAudioTrack) {
        toast.error(
          "No audio track is attached. Turn the mic on before starting the recording.",
        );
        return;
      }

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

  const isMicOn =
    status === "idle" || status === "stopped"
      ? includeMic
      : hasCapturedAudioTrack && !isAudioMuted;
  const micIcon = isMicOn ? Mic02Icon : MicOff02Icon;
  const pauseIcon = canResume ? PlayIcon : PauseIcon;
  const primaryRingClass = canStop ? "bg-red-500" : "bg-orange-600";
  const disableAllControls = isBusy || isUploading;
  const showAudioWarning =
    (status === "recording" || status === "paused") &&
    includeMic &&
    !hasCapturedAudioTrack;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-auto rounded-t-3xl border-t border-gray-200 bg-white p-0"
          onInteractOutside={(event) => {
            if (confirmAction || isUploading) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (confirmAction || isUploading) {
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

              {showAudioWarning ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No microphone audio is being captured in this recording.
                  Enable the mic before you start recording, then allow browser
                  audio access when prompted.
                </div>
              ) : null}

              <div className="mb-5 flex items-center justify-center ">
                <div className="rounded-full bg-gray-200 px-3 py-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {durationLabel}
                  </p>
                </div>
              </div>

              {isUploading ? (
                <div className="mb-5 flex items-center justify-center gap-2 text-sm font-medium text-orange-700">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
                  Saving to cloud...
                </div>
              ) : null}

              <div className="flex items-center justify-center">
                <div className="flex h-14 items-center justify-center gap-2 rounded-full bg-gray-200 px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disableAllControls}
                    onClick={handleMicToggle}
                    className={`${isMicOn ? "bg-transparent" : "bg-gray-300"} relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-in-out hover:bg-gray-300`}
                  >
                    <HugeiconsIcon
                      icon={micIcon}
                      size={22}
                      className="text-gray-700"
                    />
                    {isMicOn && hasCapturedAudioTrack ? (
                      <span className="pointer-events-none absolute bottom-1.5 flex items-end gap-[2px]">
                        {buildAudioBars(audioLevel).map((barHeight, index) => (
                          <span
                            key={index}
                            className="w-[2px] rounded-full bg-orange-600/80 transition-all duration-100"
                            style={{ height: `${barHeight}px` }}
                          />
                        ))}
                      </span>
                    ) : null}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disableAllControls || (!canPause && !canResume)}
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
                      disabled={disableAllControls || (!canStart && !canStop)}
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
                    disabled={disableAllControls || !canDiscardOrRestart}
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
                    disabled={disableAllControls || !canDiscardOrRestart}
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
          if (!nextOpen && !isUploading) {
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
              disabled={isUploading}
              onClick={() => setConfirmAction(null)}
              className="ring-0 border-0 py-5 px-5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUploading}
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
      return "Recording finished and saved to cloud.";
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

function useAudioLevel(stream: MediaStream | null, enabled: boolean) {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!enabled || !stream) {
      setAudioLevel(0);
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId = 0;

    const updateLevel = () => {
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (const value of dataArray) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }

      const rms = Math.sqrt(sum / dataArray.length);
      setAudioLevel(Math.min(rms * 2.8, 1));
      animationFrameId = window.requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      source.disconnect();
      void audioContext.close();
      setAudioLevel(0);
    };
  }, [enabled, stream]);

  return audioLevel;
}

function buildAudioBars(audioLevel: number) {
  const minHeight = 3;
  const maxHeight = 12;
  const centerHeight = minHeight + audioLevel * maxHeight;

  return [
    Math.max(minHeight, centerHeight * 0.55),
    Math.max(minHeight, centerHeight),
    Math.max(minHeight, centerHeight * 0.7),
  ];
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
