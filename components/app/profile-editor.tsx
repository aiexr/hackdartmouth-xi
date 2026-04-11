"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { roleTracks } from "@/data/scenarios";
import type { User } from "@/lib/models/User";

export function ProfileEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    resumeUrl: "",
    focusTrack: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setUser(data);
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          resumeUrl: data.resumeUrl || "",
          focusTrack: data.focusTrack || "",
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

      const updatedUser = await res.json();
      setUser(updatedUser);
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
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedTrack =
    roleTracks.find((t) => t.id === formData.focusTrack)?.name || "None selected";

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
              <AlertCircle className="size-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/256 characters
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resume URL</label>
            <Input
              value={formData.resumeUrl}
              onChange={(e) => handleInputChange("resumeUrl", e.target.value)}
              placeholder="https://example.com/resume.pdf (optional)"
              type="url"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Focus Track</label>
            <div className="grid gap-2">
              {roleTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleInputChange("focusTrack", track.id)}
                  disabled={saving}
                  className={`flex items-center justify-between rounded-lg border-2 p-3 text-left transition-colors ${
                    formData.focusTrack === track.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{track.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {track.description}
                    </p>
                  </div>
                  {formData.focusTrack === track.id && (
                    <span className="text-xs font-semibold text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
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
