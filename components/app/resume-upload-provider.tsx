"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const RESUME_ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

type ResumeUploadContextValue = {
  uploadingResume: boolean;
  resumeFile: File | null;
  hasResumeContext: boolean;
  resumeError: string | null;
  resumeSuccess: boolean;
  lastProcessedFileName: string | null;
  startUpload: (file: File) => void;
  cancelUpload: () => void;
  initialize: (initialHasResumeContext: boolean) => void;
};

const ResumeUploadContext = createContext<ResumeUploadContextValue | null>(null);

export function useResumeUpload(): ResumeUploadContextValue {
  const ctx = useContext(ResumeUploadContext);
  if (!ctx) throw new Error("useResumeUpload must be used within ResumeUploadProvider");
  return ctx;
}

export function ResumeUploadProvider({ children }: { children: React.ReactNode }) {
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasResumeContext, setHasResumeContext] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [lastProcessedFileName, setLastProcessedFileName] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialize = useCallback((initialHasResumeContext: boolean) => {
    if (!initialized) {
      setHasResumeContext(initialHasResumeContext);
      setInitialized(true);
    }
  }, [initialized]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setUploadingResume(false);
    setResumeFile(null);
    setResumeError(null);
  }, []);

  const startUpload = useCallback((file: File) => {
    setResumeError(null);
    setResumeSuccess(false);

    const ext = getFileExtension(file.name);
    if (!RESUME_ALLOWED_EXTENSIONS.includes(ext as (typeof RESUME_ALLOWED_EXTENSIONS)[number])) {
      setResumeError("Please select a PDF or DOCX file.");
      return;
    }
    if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
      setResumeError("This file is too large. Please choose one under 10 MB.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResumeFile(file);
    setUploadingResume(true);

    const run = async () => {
      try {
        const formData = new FormData();
        formData.append("resume", file);
        const res = await fetch("/api/user/profile/resume", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        const raw = await res.text();
        let parsed: unknown = null;

        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = raw;
        }

        if (!res.ok) {
          const msg = asRecord(parsed);
          const details =
            typeof msg.details === "string" && msg.details.trim()
              ? ` ${msg.details}`
              : typeof parsed === "string" && parsed.trim()
                ? ` ${parsed.trim()}`
                : "";
          throw new Error(
            typeof msg.error === "string" && msg.error.trim()
              ? `${msg.error}${details}`
              : details.trim() || "Failed to upload resume"
          );
        }

        const payload = asRecord(parsed);

        setHasResumeContext(payload.hasResumeContext === true);
        setLastProcessedFileName(file.name);
        setResumeFile(null);
        setResumeSuccess(true);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setResumeSuccess(false), 3000);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setResumeError(err instanceof Error ? err.message : "Failed to upload resume");
        setResumeFile(null);
      } finally {
        setUploadingResume(false);
      }
    };

    void run();
  }, []);

  return (
    <ResumeUploadContext.Provider
      value={{
        uploadingResume,
        resumeFile,
        hasResumeContext,
        resumeError,
        resumeSuccess,
        lastProcessedFileName,
        startUpload,
        cancelUpload,
        initialize,
      }}
    >
      {children}
    </ResumeUploadContext.Provider>
  );
}
