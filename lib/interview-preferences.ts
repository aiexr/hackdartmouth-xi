const INTERVIEW_WRAP_UP_MIN = 1;
const INTERVIEW_WRAP_UP_MAX = 60;

export const INTERVIEW_WRAP_UP_STORAGE_KEY = "interview-wrap-up-minutes";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null | undefined;

export function normalizeStoredInterviewWrapUpMinutes(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(
      INTERVIEW_WRAP_UP_MIN,
      Math.min(INTERVIEW_WRAP_UP_MAX, Math.round(value)),
    );
  }

  return null;
}

function getStorage(storage?: StorageLike): StorageLike {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function readStoredInterviewWrapUpMinutes(storage?: StorageLike) {
  try {
    const target = getStorage(storage);
    const raw = target?.getItem(INTERVIEW_WRAP_UP_STORAGE_KEY);

    if (raw === null || raw === undefined || raw.trim() === "") {
      return null;
    }

    return normalizeStoredInterviewWrapUpMinutes(Number(raw));
  } catch {
    return null;
  }
}

export function writeStoredInterviewWrapUpMinutes(
  value: number | null,
  storage?: StorageLike,
) {
  try {
    const target = getStorage(storage);
    if (!target) {
      return;
    }

    const normalized = normalizeStoredInterviewWrapUpMinutes(value);

    if (normalized === null) {
      target.removeItem(INTERVIEW_WRAP_UP_STORAGE_KEY);
      return;
    }

    target.setItem(INTERVIEW_WRAP_UP_STORAGE_KEY, String(normalized));
  } catch {
    // Ignore local storage access failures and keep the UI usable.
  }
}
