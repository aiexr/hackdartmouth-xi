"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  readStoredInterviewWrapUpMinutes,
  writeStoredInterviewWrapUpMinutes,
} from "@/lib/interview-preferences";

const INTERVIEW_WRAP_UP_MIN = 1;
const INTERVIEW_WRAP_UP_MAX = 60;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

async function readApiError(response: Response, fallback: string) {
  const raw = await response.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    return response.status >= 500
      ? "Interview settings are temporarily unavailable. Please try again in a moment."
      : fallback;
  }

  const lower = trimmed.toLowerCase();
  const looksLikeHtml =
    trimmed.startsWith("<!DOCTYPE html") ||
    trimmed.startsWith("<html") ||
    lower.includes("<body") ||
    lower.includes("<head");

  if (looksLikeHtml) {
    return response.status >= 500
      ? "Interview settings are temporarily unavailable. Please try again in a moment."
      : fallback;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const payload = asRecord(parsed);
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Ignore JSON parsing failures and fall back to raw text below.
  }

  return response.status >= 500
    ? "Interview settings are temporarily unavailable. Please try again in a moment."
    : trimmed.slice(0, 240) || fallback;
}

function normalizeInterviewWrapUpMinutes(value: unknown) {
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

function SettingsPanelSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        <div className="h-7 w-28 rounded-none bg-base-300/45" />
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-none bg-base-300/45" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-28 rounded-none bg-base-300/50" />
                <div className="h-4 w-56 max-w-full rounded-none bg-base-300/35" />
                <div className="h-4 w-40 rounded-none bg-base-300/35" />
              </div>
              <div className="mt-1 h-6 w-12 rounded-full bg-base-300/45" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="h-7 w-20 rounded-none bg-base-300/45" />
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-none bg-base-300/45" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-40 rounded-none bg-base-300/50" />
                <div className="h-4 w-full rounded-none bg-base-300/35" />
                <div className="h-4 w-11/12 rounded-none bg-base-300/35" />
                <div className="h-4 w-3/4 rounded-none bg-base-300/35" />
              </div>
              <div className="h-9 w-32 rounded-none bg-base-300/45" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="h-7 w-24 rounded-none bg-base-300/45" />
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-none bg-base-300/45" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-52 rounded-none bg-base-300/50" />
                  <div className="h-4 w-full rounded-none bg-base-300/35" />
                  <div className="h-4 w-5/6 rounded-none bg-base-300/35" />
                </div>
              </div>
              <div className="h-10 w-36 rounded-none bg-base-300/45" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-28 rounded-none bg-base-300/45" />
                <div className="h-9 w-32 rounded-none bg-base-300/45" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <div className="h-9 w-20 rounded-none bg-base-300/45" />
        <div className="h-9 w-20 rounded-none bg-base-300/45" />
      </div>

      <div className="inline-flex items-center gap-2 text-sm text-base-content/60">
        <Loader2 className="size-4 animate-spin" />
        Loading settings...
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [hydrated, setHydrated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [interviewWrapUpMinutes, setInterviewWrapUpMinutes] = useState("");
  const [savedInterviewWrapUpMinutes, setSavedInterviewWrapUpMinutes] = useState<number | null>(
    null,
  );
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [interviewNotice, setInterviewNotice] = useState<string | null>(null);
  const [interviewSuccess, setInterviewSuccess] = useState(false);
  const [isSavingInterviewPreference, setIsSavingInterviewPreference] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Sync with persisted preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const activeTheme = saved ?? document.documentElement.getAttribute("data-theme");
    if (activeTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setDarkMode(false);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function loadInterviewPreference() {
      setPreferencesLoading(true);
      setInterviewError(null);
      setInterviewNotice(null);

      const localWrapUpMinutes = readStoredInterviewWrapUpMinutes();
      setSavedInterviewWrapUpMinutes(localWrapUpMinutes);
      setInterviewWrapUpMinutes(localWrapUpMinutes === null ? "" : String(localWrapUpMinutes));

      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            await readApiError(response, "Failed to load interview settings."),
          );
        }

        const payload = asRecord(await response.json());
        const preferences = asRecord(payload.preferences);
        const wrapUpMinutes = normalizeInterviewWrapUpMinutes(
          preferences.interviewWrapUpMinutes,
        );

        if (cancelled) {
          return;
        }

        writeStoredInterviewWrapUpMinutes(wrapUpMinutes);
        setSavedInterviewWrapUpMinutes(wrapUpMinutes);
        setInterviewWrapUpMinutes(wrapUpMinutes === null ? "" : String(wrapUpMinutes));
      } catch {
        if (cancelled) {
          return;
        }

        setInterviewNotice(
          "We couldn't load your account setting right now. You can still update it on this device.",
        );
      } finally {
        if (!cancelled) {
          setPreferencesLoading(false);
        }
      }
    }

    void loadInterviewPreference();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  if (!hydrated || preferencesLoading) {
    return <SettingsPanelSkeleton />;
  }

  function toggleDarkMode(enabled: boolean) {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "corporate");
      localStorage.setItem("theme", "corporate");
    }
  }

  function handleInterviewWrapUpChange(value: string) {
    setInterviewWrapUpMinutes(value);
    setInterviewError(null);
    setInterviewNotice(null);
    setInterviewSuccess(false);
  }

  async function persistInterviewWrapUpPreference(value: number | null) {
    setInterviewError(null);
    setInterviewNotice(null);
    setInterviewSuccess(false);
    setIsSavingInterviewPreference(true);

    const normalizedValue = normalizeInterviewWrapUpMinutes(value);
    writeStoredInterviewWrapUpMinutes(normalizedValue);
    setSavedInterviewWrapUpMinutes(normalizedValue);
    setInterviewWrapUpMinutes(normalizedValue === null ? "" : String(normalizedValue));

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: {
            interviewWrapUpMinutes: normalizedValue,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Failed to update interview settings."),
        );
      }

      const payload = asRecord(await response.json());
      const preferences = asRecord(payload.preferences);
      const nextWrapUpMinutes = normalizeInterviewWrapUpMinutes(
        preferences.interviewWrapUpMinutes,
      );

      writeStoredInterviewWrapUpMinutes(nextWrapUpMinutes);
      setSavedInterviewWrapUpMinutes(nextWrapUpMinutes);
      setInterviewWrapUpMinutes(
        nextWrapUpMinutes === null ? "" : String(nextWrapUpMinutes),
      );
      setInterviewSuccess(true);
      window.setTimeout(() => setInterviewSuccess(false), 3000);
    } catch {
      setInterviewNotice(
        "Saved on this device only. We couldn't sync your interview setting to your account right now.",
      );
    } finally {
      setIsSavingInterviewPreference(false);
    }
  }

  async function handleSaveInterviewPreference() {
    const trimmed = interviewWrapUpMinutes.trim();

    if (!trimmed) {
      await persistInterviewWrapUpPreference(null);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setInterviewError("Enter a whole number between 1 and 60, or clear the field.");
      setInterviewSuccess(false);
      return;
    }

    await persistInterviewWrapUpPreference(parsed);
  }

  async function handleResetInterviewPreference() {
    await persistInterviewWrapUpPreference(null);
  }

  async function handleDeleteData() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete account data.");
      }

      localStorage.clear();
      setDeleted(true);
      setConfirmDelete(false);
      // Re-apply theme to corporate since we just cleared localStorage.
      document.documentElement.setAttribute("data-theme", "corporate");
      setDarkMode(false);

      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Failed to delete account data:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete account data.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Appearance */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="flex w-full items-start gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4 text-left">
                <div className="flex size-11 items-center justify-center rounded-none bg-neutral/10 text-base-content">
                  <Moon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base">Dark mode</h3>
                  <p className="text-sm leading-6 text-base-content/60">
                    Switch to a dark color scheme.
                  </p>
                </div>
              </div>
              <div className="ml-auto shrink-0 self-start">
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Interview</h2>
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="space-y-5">
              <div className="flex w-full items-start gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-4 text-left">
                  <div className="flex size-11 items-center justify-center rounded-none bg-primary/10 text-primary">
                    <Clock3 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base">Start wrapping up after (minutes)</h3>
                    <p className="text-sm leading-6 text-base-content/60">
                      Applies to both video and voice interviews. Leave this empty
                      to use each round&apos;s suggested duration instead.
                    </p>
                    {savedInterviewWrapUpMinutes !== null ? (
                      <p className="mt-2 text-sm leading-6 text-base-content/55">
                        Current saved default: {savedInterviewWrapUpMinutes} minute
                        {savedInterviewWrapUpMinutes === 1 ? "" : "s"}.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-base-content/55">
                        Current saved default: use the round&apos;s suggested duration.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-w-xs space-y-2">
                <label
                  htmlFor="interview-wrap-up-minutes"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/55"
                >
                  Wrap-Up Threshold
                </label>
                <Input
                  id="interview-wrap-up-minutes"
                  type="number"
                  min={INTERVIEW_WRAP_UP_MIN}
                  max={INTERVIEW_WRAP_UP_MAX}
                  inputMode="numeric"
                  value={interviewWrapUpMinutes}
                  onChange={(event) => handleInterviewWrapUpChange(event.target.value)}
                  disabled={isSavingInterviewPreference}
                  placeholder="Use round default"
                />
                <p className="text-xs text-base-content/55">
                  Values are saved as whole minutes and clamped to 1-60.
                </p>
              </div>

              {interviewError ? (
                <div className="flex items-start gap-3 rounded-none border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <p className="text-sm text-red-800">{interviewError}</p>
                </div>
              ) : null}

              {interviewNotice ? (
                <div className="flex items-start gap-3 rounded-none border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">{interviewNotice}</p>
                </div>
              ) : null}

              {interviewSuccess ? (
                <div className="flex items-start gap-3 rounded-none border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                  <p className="text-sm text-green-800">
                    Interview wrap-up preference saved.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handleSaveInterviewPreference()}
                  disabled={isSavingInterviewPreference}
                  className="gap-2"
                >
                  {isSavingInterviewPreference ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Preference
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleResetInterviewPreference()}
                  disabled={
                    isSavingInterviewPreference ||
                    (savedInterviewWrapUpMinutes === null &&
                      interviewWrapUpMinutes.trim() === "")
                  }
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  Use Round Default
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Account</h2>
        <Card className="bg-base-100/80">
          <CardContent className="py-5 pr-5 pl-8">
            <div className="flex w-full items-start gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4 text-left">
                <div className="flex size-11 items-center justify-center rounded-none bg-destructive/10 text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base">Delete account data</h3>
                  <p className="text-sm leading-6 text-base-content/60">
                    Permanently deletes your profile, interviews, resume context,
                    metrics, and saved preferences from our servers, then clears
                    this browser.
                  </p>
                  {confirmDelete ? (
                    <p className="mt-2 text-sm leading-6 text-destructive">
                      This is not a local-only reset. It permanently removes your
                      stored LeetSpeak account data and signs you out.
                    </p>
                  ) : null}
                  {deleteError ? (
                    <p className="mt-2 text-sm leading-6 text-destructive">
                      {deleteError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center justify-end gap-2 self-start">
                {deleted || isDeleting ? (
                  <span className="text-sm text-base-content/50">
                    {isDeleting ? "Deleting..." : "Deleted"}
                  </span>
                ) : confirmDelete ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={handleDeleteData}
                    >
                      Delete permanently
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDeleting}
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                    onClick={() => {
                      setDeleteError(null);
                      setConfirmDelete(true);
                    }}
                  >
                    Delete account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={() => setShowAbout(true)}>
          About
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowPrivacy(true)}>
          Privacy
        </Button>
      </div>

      {/* About modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-lg bg-base-100 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 text-base-content/40 hover:text-base-content"
              onClick={() => setShowAbout(false)}
            >
              <X className="size-4" />
            </button>
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <p className="text-sm text-base-content/70">
              Built by Luis Aguero, Benjamin Lin, Alexander Rodriguez, and Kaydan Tran.
            </p>
          </div>
        </div>
      )}

      {/* Privacy modal */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPrivacy(false)}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-base-100 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 text-base-content/40 hover:text-base-content"
              onClick={() => setShowPrivacy(false)}
            >
              <X className="size-4" />
            </button>
            <h2 className="mb-3 text-lg font-semibold">Privacy</h2>
            <div className="space-y-3 text-sm text-base-content/70">
              <p>
                This application collects your name and email address through Google Sign-In solely to identify your account and associate your interview sessions with your profile. Practice session transcripts, AI-generated feedback, and any resume text you upload are stored securely in our database and are used exclusively to personalize your coaching experience — they are never sold or shared with third parties.
              </p>
              <p>
                Resume content is processed at upload time to extract plain text; the original file is discarded immediately and only the extracted text is retained. Interview audio and video are processed in real time through our AI provider integrations and are not stored after a session ends. You may permanently delete your stored account data from our servers and clear this browser at any time using the "Delete account data" option above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
