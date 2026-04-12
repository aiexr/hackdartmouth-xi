"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FavoriteItem } from "@/lib/favorites";
import type { User } from "@/lib/models/User";

const BIO_MAX_LENGTH = 256;
const WEEKLY_GOAL_MIN = 1;
const WEEKLY_GOAL_MAX = 30;
const WEEKLY_GOAL_PRESETS = [2, 4, 6, 8];

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
      ? "Profile is temporarily unavailable. Please try again in a moment."
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
      ? "Profile is temporarily unavailable. Please try again in a moment."
      : fallback;
  }

  const parsed = (() => {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  })();

  const payload = asRecord(parsed);
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof parsed === "string" && parsed.trim()) {
    return parsed.trim().slice(0, 240);
  }

  return fallback;
}

function toUser(value: Record<string, unknown>): User {
  const preferences = asRecord(value.preferences);
  const favorites = Array.isArray(value.favorites)
    ? value.favorites.filter((favorite): favorite is FavoriteItem => {
        if (!favorite || typeof favorite !== "object") {
          return false;
        }

        const item = favorite as Record<string, unknown>;
        return (
          typeof item.id === "string" &&
          typeof item.kind === "string" &&
          typeof item.title === "string" &&
          typeof item.href === "string" &&
          (item.subtitle === undefined ||
            item.subtitle === null ||
            typeof item.subtitle === "string")
        );
      })
    : [];

  return {
    email: typeof value.email === "string" ? value.email : "",
    name: typeof value.name === "string" ? value.name : "",
    image: typeof value.image === "string" ? value.image : "",
    provider: typeof value.provider === "string" ? value.provider : "unknown",
    focusTrack:
      typeof value.focusTrack === "string" || value.focusTrack === null
        ? value.focusTrack
        : null,
    bio: typeof value.bio === "string" || value.bio === null ? value.bio : null,
    resumeExtractedText:
      typeof value.resumeExtractedText === "string" || value.resumeExtractedText === null
        ? value.resumeExtractedText
        : null,
    preferences: {
      voiceId:
        typeof preferences.voiceId === "string" || preferences.voiceId === null
          ? (preferences.voiceId as string | null)
          : null,
      feedbackStyle:
        preferences.feedbackStyle === "detailed" ||
        preferences.feedbackStyle === "concise" ||
        preferences.feedbackStyle === "structured"
          ? (asRecord(value.preferences).feedbackStyle as
              | "detailed"
              | "concise"
              | "structured")
          : "structured",
      practiceReminders:
        typeof preferences.practiceReminders === "boolean"
          ? (preferences.practiceReminders as boolean)
          : true,
      weeklyGoal:
        typeof preferences.weeklyGoal === "number" && Number.isFinite(preferences.weeklyGoal)
          ? Math.min(
              WEEKLY_GOAL_MAX,
              Math.max(WEEKLY_GOAL_MIN, Math.round(preferences.weeklyGoal as number)),
            )
          : 4,
      interviewWrapUpMinutes:
        preferences.interviewWrapUpMinutes === null
          ? null
          : typeof preferences.interviewWrapUpMinutes === "number" &&
              Number.isFinite(preferences.interviewWrapUpMinutes)
            ? Math.max(1, Math.min(60, Math.round(preferences.interviewWrapUpMinutes as number)))
            : null,
    },
    favorites,
    createdAt:
      value.createdAt instanceof Date
        ? value.createdAt
        : new Date(
            typeof value.createdAt === "string" || typeof value.createdAt === "number"
              ? value.createdAt
              : Date.now(),
          ),
    updatedAt:
      value.updatedAt instanceof Date
        ? value.updatedAt
        : new Date(
            typeof value.updatedAt === "string" || typeof value.updatedAt === "number"
              ? value.updatedAt
              : Date.now(),
          ),
  };
}

function ProfileEditorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 animate-pulse rounded-none bg-base-300/55" />
        <div className="h-4 w-72 animate-pulse rounded-none bg-base-300/40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-none bg-base-300/40" />
          <div className="h-10 animate-pulse rounded-none border border-border bg-base-200/40" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded-none bg-base-300/40" />
          <div className="h-24 animate-pulse rounded-none border border-border bg-base-200/40" />
          <div className="h-3 w-28 animate-pulse rounded-none bg-base-300/35" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-44 animate-pulse rounded-none bg-base-300/40" />
          <div className="h-10 animate-pulse rounded-none border border-border bg-base-200/40" />
          <div className="h-3 w-52 animate-pulse rounded-none bg-base-300/35" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-base-content/60">
            <Loader2 className="size-4 animate-spin" />
            Loading profile...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ProfileEditorProps = {
  initialUser?: Record<string, unknown> | null;
  deferInitialFetch?: boolean;
  onProfileUpdated?: (user: Record<string, unknown>) => void;
};

function toFormData(user: User) {
  return {
    name: user.name || "",
    bio: user.bio || "",
    focusTrack: user.focusTrack || "",
    weeklyGoal: user.preferences.weeklyGoal || 4,
  };
}

export function ProfileEditor({
  initialUser = null,
  deferInitialFetch = false,
  onProfileUpdated,
}: ProfileEditorProps) {
  const initialParsedUser = initialUser ? toUser(initialUser) : null;

  const [user, setUser] = useState<User | null>(
    initialParsedUser,
  );
  const [loading, setLoading] = useState(!initialParsedUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialParsedUser?.name || "",
    bio: initialParsedUser?.bio || "",
    focusTrack: initialParsedUser?.focusTrack || "",
    weeklyGoal: initialParsedUser?.preferences.weeklyGoal || 4,
  });

  const applyUser = useCallback((value: Record<string, unknown>) => {
    const parsedUser = toUser(value);
    setUser(parsedUser);
    setFormData(toFormData(parsedUser));
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!initialUser) {
      if (deferInitialFetch) {
        setLoading(true);
      }
      return;
    }

    applyUser(initialUser);
  }, [applyUser, deferInitialFetch, initialUser]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to fetch profile"));
      }

      const data = asRecord(await res.json());
      applyUser(data);
    } catch (err) {
      setUser(null);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't load your profile right now. Please try again.",
        );
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    if (initialUser || deferInitialFetch) {
      return;
    }

    void fetchProfile();
  }, [deferInitialFetch, fetchProfile, initialUser]);

  const handleInputChange = (
    field: "name" | "bio" | "focusTrack",
    value: string
  ) => {
    const nextValue = field === "bio" ? value.slice(0, BIO_MAX_LENGTH) : value;
    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    setError(null);
    setSuccess(false);
  };

  const handleWeeklyGoalChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const bounded = Number.isFinite(parsed)
      ? Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, parsed))
      : WEEKLY_GOAL_MIN;
    setFormData((prev) => ({ ...prev, weeklyGoal: bounded }));
    setError(null);
    setSuccess(false);
  };

  const applyWeeklyGoal = (weeklyGoal: number) => {
    setFormData((prev) => ({ ...prev, weeklyGoal }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Load your profile before saving changes.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          focusTrack: formData.focusTrack,
          weeklyGoal: formData.weeklyGoal,
        }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to update profile"));
      }

      const data = asRecord(await res.json());
      applyUser(data);
      onProfileUpdated?.(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileEditorSkeleton />;
  }

  if (!user) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information and practice preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-none border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-800">
                  We couldn&apos;t load your profile.
                </p>
                <p className="mt-1 break-words text-sm text-red-700">
                  {error ?? "Please try again in a moment."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => void fetchProfile()}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your profile information and practice preferences.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/55">
            <span className="border border-base-300 px-2.5 py-1.5">
              Saved to your account
            </span>
            <span className="border border-base-300 px-2.5 py-1.5">
              Goal range {WEEKLY_GOAL_MIN}-{WEEKLY_GOAL_MAX}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-none border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <p className="break-words text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 rounded-none border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">Profile updated successfully!</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-2 rounded-none border border-base-300 p-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/55">
                  Display Name
                </label>
                <p className="mt-1 text-sm text-base-content/60">
                  This shows up across your profile and interview context.
                </p>
              </div>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your name"
                disabled={saving}
                maxLength={80}
              />
            </div>

            <div className="space-y-3 rounded-none border border-base-300 bg-base-200/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center border border-base-300 bg-base-100 text-base-content/70">
                  <Target className="size-4" />
                </div>
                <div className="min-w-0">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/55">
                    Weekly Practice Goal
                  </label>
                  <p className="mt-1 text-sm text-base-content/60">
                    Set a target number of completed sessions each week.
                  </p>
                </div>
              </div>

              <Input
                type="number"
                min={WEEKLY_GOAL_MIN}
                max={WEEKLY_GOAL_MAX}
                value={formData.weeklyGoal}
                onChange={(e) => handleWeeklyGoalChange(e.target.value)}
                disabled={saving}
              />

              <div className="flex flex-wrap gap-2">
                {WEEKLY_GOAL_PRESETS.map((goal) => (
                  <Button
                    key={goal}
                    type="button"
                    size="sm"
                    variant={formData.weeklyGoal === goal ? "default" : "outline"}
                    onClick={() => applyWeeklyGoal(goal)}
                    disabled={saving}
                  >
                    {goal}/week
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-none border border-base-300 p-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/55">
                Bio
              </label>
              <p className="mt-1 text-sm text-base-content/60">
                A short summary of your background, strengths, or what you&apos;re practicing for.
              </p>
            </div>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself (optional)"
              disabled={saving}
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              className="min-h-32 rounded-none"
            />
            <p className="text-xs text-base-content/60">
              {formData.bio.length}/{BIO_MAX_LENGTH} characters
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-base-content/55">
              Changes update your saved profile and practice defaults.
            </p>
            <Button
              type="submit"
              disabled={saving || !user}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
