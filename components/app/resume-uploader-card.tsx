"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResumeUpload } from "@/components/app/resume-upload-provider";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type ResumeUploaderCardProps = {
  initialHasResumeContext: boolean;
};

export function ResumeUploaderCard({ initialHasResumeContext }: ResumeUploaderCardProps) {
  const {
    uploadingResume,
    resumeFile,
    hasResumeContext,
    resumeError,
    resumeSuccess,
    lastProcessedFileName,
    startUpload,
    cancelUpload,
    initialize,
  } = useResumeUpload();

  const [inputKey, setInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initialize(initialHasResumeContext);
  }, [initialize, initialHasResumeContext]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setInputKey((k) => k + 1);
    startUpload(file);
  };

  const handleCancel = () => {
    setInputKey((k) => k + 1);
    cancelUpload();
  };

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
          </div>
          {hasResumeContext && !uploadingResume && (
            <Badge className="shrink-0 rounded-none">Context active</Badge>
          )}
        </div>

        <div className="space-y-3 rounded-none border border-dashed border-border/80 bg-base-200/40 p-4">
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            disabled={uploadingResume}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={uploadingResume ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
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

            {uploadingResume && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-base-content/60 hover:text-base-content"
                onClick={handleCancel}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            )}
          </div>

          <div className="rounded-none border border-border/70 bg-base-100 px-3 py-2.5">
            {uploadingResume && resumeFile ? (
              <>
                <p className="truncate text-sm font-medium">{resumeFile.name}</p>
                <p className="mt-0.5 text-xs text-base-content/60">
                  {formatFileSize(resumeFile.size)}
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
              <p className="whitespace-pre-wrap break-words">
                {resumeError || "Resume processed successfully."}
              </p>
            </div>
          )}

          <p className="text-xs text-base-content/60">
            Files are not stored — only extracted text is saved for coaching context.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
