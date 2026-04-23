import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SavedRecording = {
  createdAt: number;
  downloadName: string;
  id: string;
  mimeType: string;
  url: string;
};

const recordings = new Map<string, SavedRecording>();

export function createRecordingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

export function saveRecording(recording: SavedRecording) {
  recordings.set(recording.id, recording);
}

export function getRecording(id: string) {
  return recordings.get(id) ?? null;
}

export function removeRecording(id: string) {
  const recording = recordings.get(id);

  if (recording) {
    URL.revokeObjectURL(recording.url);
    recordings.delete(id);
  }
}
