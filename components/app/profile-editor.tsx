"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/lib/models/User";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toUser(value: Record<string, unknown>): User {
  const preferences = asRecord(value.preferences);

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
        typeof preferences.weeklyGoal === "number"
          ? (preferences.weeklyGoal as number)
          : 4,
    },
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

export function ProfileEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    focusTrack: "",
    weeklyGoal: 4,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = asRecord(await res.json());
        const parsedUser = toUser(data);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || "",
          bio: parsedUser.bio || "",
          focusTrack: parsedUser.focusTrack || "",
          weeklyGoal: parsedUser.preferences.weeklyGoal || 4,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (
    field: "name" | "bio" | "focusTrack",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleWeeklyGoalChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const bounded = Number.isFinite(parsed) ? Math.min(30, Math.max(1, parsed)) : 1;
    setFormData((prev) => ({ ...prev, weeklyGoal: bounded }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!res.ok) throw new Error("Failed to update profile");

      const data = asRecord(await res.json());
      setUser(toUser(data));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your profile information and practice preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="size-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800">Profile updated successfully!</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Your name"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself (optional)"
              disabled={saving}
              rows={3}
            />
            <p className="text-xs text-base-content/60">
              {formData.bio.length}/256 characters
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Weekly Practice Goal (loops)</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={formData.weeklyGoal}
              onChange={(e) => handleWeeklyGoalChange(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
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
