"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const RESUME_ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

type ResumeUploaderCardProps = {
  initialHasResumeContext: boolean;
};

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

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ResumeUploaderCard({ initialHasResumeContext }: ResumeUploaderCardProps) {
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const [hasResumeContext, setHasResumeContext] = useState(initialHasResumeContext);
  const [lastProcessedFileName, setLastProcessedFileName] = useState<string | null>(null);
  const [resumeInputKey, setResumeInputKey] = useState(0);

  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  const processResumeFile = async (file: File) => {
    setUploadingResume(true);
    setResumeError(null);
    setResumeSuccess(false);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/user/profile/resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(parseErrorMessage(payload, "Failed to upload resume"));
      }

      const payload = asRecord(await res.json());
      setHasResumeContext(parseHasResumeContext(payload));
      setLastProcessedFileName(file.name);
      setResumeFile(null);
      setResumeInputKey((prev) => prev + 1);
      setResumeSuccess(true);
      setTimeout(() => setResumeSuccess(false), 3000);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Failed to upload resume");
      setResumeFile(null);
      setResumeInputKey((prev) => prev + 1);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeFileChange = (file: File | null) => {
    setResumeError(null);
    setResumeSuccess(false);

    if (!file) {
      setResumeFile(null);
      return;
    }

    const extension = getFileExtension(file.name);
    if (!RESUME_ALLOWED_EXTENSIONS.includes(extension as (typeof RESUME_ALLOWED_EXTENSIONS)[number])) {
      setResumeFile(null);
      setResumeError("Please select a PDF or DOCX file.");
      setResumeInputKey((prev) => prev + 1);
      return;
    }

    if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
      setResumeFile(null);
      setResumeError("This file is too large. Please choose one under 10 MB.");
      setResumeInputKey((prev) => prev + 1);
      return;
    }

    setResumeFile(file);
    void processResumeFile(file);
  };

  const shouldShowResumeBadge = hasResumeContext || uploadingResume;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Resume</h2>
            </div>
            <p className="mt-2 text-sm text-base-content/60">
              {hasResumeContext
                ? "Resume processed successfully."
                : "No resume processed yet."}
            </p>
            <p className="mt-1 text-xs text-base-content/60">
              Extracted text context is stored in MongoDB for interview coaching and grading.
            </p>
          </div>
          {shouldShowResumeBadge && (
            <Badge className="shrink-0 rounded-none">
              {uploadingResume ? "Processing" : "Context active"}
            </Badge>
          )}
        </div>

        <div className="space-y-3 rounded-none border border-dashed border-border/80 bg-base-200/40 p-4">
          <input
            key={resumeInputKey}
            ref={resumeFileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => handleResumeFileChange(event.target.files?.[0] ?? null)}
            disabled={uploadingResume}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={uploadingResume ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => resumeFileInputRef.current?.click()}
              disabled={uploadingResume}
            >
              {uploadingResume ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  {hasResumeContext ? "Choose New Resume File" : "Choose Resume File"}
                </>
              )}
            </Button>
          </div>

          <div className="rounded-none border border-border/70 bg-base-100 px-3 py-2.5">
            {uploadingResume && resumeFile ? (
              <>
                <p className="truncate text-sm font-medium">{resumeFile.name}</p>
                <p className="mt-0.5 text-xs text-base-content/60">
                  {formatFileSize(resumeFile.size)} • Processing now
                </p>
              </>
            ) : hasResumeContext ? (
              <>
                <p className="text-sm text-base-content/80">Resume is currently active</p>
                <p className="mt-0.5 text-xs text-base-content/60">
                  Context has been extracted and is used for coaching and grading
                </p>
                {lastProcessedFileName && (
                  <p className="mt-1 text-xs text-base-content/60 truncate">
                    Last upload: {lastProcessedFileName}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-base-content/70">No file selected yet</p>
                <p className="mt-0.5 text-xs text-base-content/60">
                  Accepted: PDF or DOCX, up to 10 MB
                </p>
              </>
            )}
          </div>

          {(resumeError || resumeSuccess) && (
            <div
              className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
                resumeError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              {resumeError ? (
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              )}
              <p>{resumeError || "Resume processed successfully."}</p>
            </div>
          )}

          <p className="text-xs text-base-content/60">
            We only store extracted text context, never the original uploaded file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
