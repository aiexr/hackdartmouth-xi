"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/models/User";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function parseHasResumeContext(value: Record<string, unknown>): boolean {
  return value.hasResumeContext === true;
}

function parseErrorMessage(value: unknown, fallback: string): string {
  const payload = asRecord(value);
  return typeof payload.error === "string" && payload.error.trim().length > 0
    ? payload.error
    : fallback;
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
          : 3,
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

export function ProfileEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [hasResumeContext, setHasResumeContext] = useState(false);
  const [lastProcessedFileName, setLastProcessedFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    focusTrack: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = asRecord(await res.json());
        const parsedUser = toUser(data);
        setUser(parsedUser);
        setHasResumeContext(parseHasResumeContext(data));
        setFormData({
          name: parsedUser.name || "",
          bio: parsedUser.bio || "",
          focusTrack: parsedUser.focusTrack || "",
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
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeError("Choose a PDF or DOCX file first.");
      return;
    }

    setUploadingResume(true);
    setResumeError(null);
    setResumeSuccess(false);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const res = await fetch("/api/user/profile/resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(parseErrorMessage(payload, "Failed to upload resume"));
      }

      const payload = asRecord(await res.json());
      const updatedUser = toUser(payload);
      setUser(updatedUser);
      setHasResumeContext(parseHasResumeContext(payload));
      setLastProcessedFileName(resumeFile.name);
      setResumeFile(null);
      setResumeSuccess(true);
      setTimeout(() => setResumeSuccess(false), 3000);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const shouldShowResumeBadge = hasResumeContext || Boolean(resumeFile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-base-content/60" />
        </CardContent>
      </Card>
    );
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

          <div className="space-y-4 rounded-none border border-border/70 bg-base-200/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-base-content/60" />
                  <label className="text-sm font-medium">Resume</label>
                </div>
                <p className="mt-1 text-xs text-base-content/60">
                  Upload a PDF or DOCX. We extract and store text context for interview grading.
                </p>
              </div>
              {shouldShowResumeBadge && (
                <Badge className="shrink-0">
                  {hasResumeContext ? "Processed" : "Selected"}
                </Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setResumeFile(file);
                    setResumeError(null);
                    setResumeSuccess(false);
                  }}
                  disabled={saving || uploadingResume}
                />
                <p className="text-xs text-base-content/60">
                  PDF or DOCX up to 10 MB.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={handleResumeUpload}
                disabled={saving || uploadingResume || !resumeFile}
              >
                {uploadingResume ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    {hasResumeContext ? "Reprocess Resume" : "Process Resume"}
                  </>
                )}
              </Button>
            </div>

            {(resumeError || resumeSuccess) && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  resumeError
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}
              >
                {resumeError || "Resume processed successfully."}
              </div>
            )}

            {hasResumeContext && (
              <div className="rounded-xl border border-dashed border-border/80 bg-base-200 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {lastProcessedFileName || "Resume context available"}
                  </p>
                  <p className="text-xs text-base-content/60">
                    Resume processed successfully. Extracted text is stored in your profile for interview context.
                  </p>
                </div>
              </div>
            )}
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
