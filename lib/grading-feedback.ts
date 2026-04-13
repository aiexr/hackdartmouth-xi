const PLACEHOLDER_FEEDBACK_PATTERNS = [
  /meaningful evaluation/i,
  /\b(?:please\s+)?provide\b.*\btranscript\b/i,
  /\b(?:please\s+)?provide\b.*\btrnasciprt\b/i,
  /\b(?:please\s+)?provide\b.*\btransciprt\b/i,
  /\b(?:unable|cannot|can't)\b.*\bevaluat/i,
  /\binsufficient\b.*\btranscript\b/i,
];

export function isRenderableFeedbackItem(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_FEEDBACK_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function sanitizeFeedbackItems(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set<string>();

  return values.flatMap((value) => {
    if (!isRenderableFeedbackItem(value)) {
      return [];
    }

    const normalized = value.trim().replace(/\s+/g, " ");
    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      return [];
    }

    seen.add(dedupeKey);
    return [normalized];
  });
}
