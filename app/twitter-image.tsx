import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "LeetSpeak social preview";
export const runtime = "nodejs";

export default async function TwitterImage() {
  const logoPng = await readFile(new URL("./logo.png", import.meta.url));
  const logoSrc = `data:image/png;base64,${logoPng.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "72px",
          background: "#f5f5f4",
          color: "#111827",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            width: "100%",
            padding: "48px 56px",
            background: "#ffffff",
            border: "1px solid #e7e5e4",
            borderRadius: "28px",
            boxShadow: "0 16px 56px rgba(15, 23, 42, 0.08)",
          }}
        >
          <img
            src={logoSrc}
            width={140}
            height={152}
            alt="LeetSpeak logo"
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              LeetSpeak
            </div>
            <div
              style={{
                marginTop: "16px",
                fontSize: 34,
                color: "#57534e",
                lineHeight: 1.2,
              }}
            >
              Speak your way through interviews.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
