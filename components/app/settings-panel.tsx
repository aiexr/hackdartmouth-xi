"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Moon, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function SettingsPanel() {
  const [darkMode, setDarkMode] = useState(false);
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
  }, []);

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
