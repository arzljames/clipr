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

// const AUTH_COOKIE_KEY = "APP_SID";

// let inMemoryAuthToken: string | null = null;

// const isLocalhost = (): boolean => {
//   if (typeof window === "undefined") return false;

//   const hostname = window.location.hostname;
//   return (
//     hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
//   );
// };

// export const getAuthToken = (): string | null => {
//   return inMemoryAuthToken ?? Cookies.get(AUTH_COOKIE_KEY) ?? null;
// };

// export const setAuthToken = (token: string): void => {
//   inMemoryAuthToken = token;

//   // Only mirror APP_SID client-side in localhost for local development.
//   if (isLocalhost()) {
//     Cookies.set(AUTH_COOKIE_KEY, token, {
//       path: "/",
//       sameSite: "lax",
//     });
//   }
// };

// export const clearAuthToken = (): void => {
//   inMemoryAuthToken = null;

//   Cookies.remove(AUTH_COOKIE_KEY);
//   Cookies.remove(AUTH_COOKIE_KEY, { path: "/" });
//   Cookies.remove(AUTH_COOKIE_KEY, { path: "/", domain: ".zesty.dev" });
//   Cookies.remove(AUTH_COOKIE_KEY, { path: "/", domain: ".zesty.io" });
// };
