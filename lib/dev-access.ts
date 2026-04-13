import "server-only";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function normalizeHostname(hostOrUrl: string | null | undefined) {
  if (!hostOrUrl) {
    return null;
  }

  const trimmed = hostOrUrl.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("://")) {
    try {
      return new URL(trimmed).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("[")) {
    const closingBracketIndex = trimmed.indexOf("]");
    if (closingBracketIndex >= 0) {
      return trimmed.slice(0, closingBracketIndex + 1);
    }
  }

  const [hostname] = trimmed.split(":");
  return hostname || null;
}

export function isLocalOrDevAccessAllowed(hostOrUrl: string | null | undefined) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const hostname = normalizeHostname(hostOrUrl);
  if (!hostname) {
    return false;
  }

  return LOCAL_HOSTNAMES.has(hostname);
}
