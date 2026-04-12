export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const normalizedUrl = rawUrl.startsWith("http")
    ? rawUrl
    : `https://${rawUrl}`;

  return normalizedUrl.replace(/\/$/, "");
}
