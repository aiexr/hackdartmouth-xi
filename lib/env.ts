import "server-only";

const env = {
  appName:
    process.env.NEXT_PUBLIC_APP_NAME?.trim() || "LeetCode for Interviews",
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  llmProvider: process.env.LLM_PROVIDER,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiApiBaseUrl: process.env.OPENAI_BASE_URL,
  openAiModel: process.env.OPENAI_MODEL,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME || "leetcode-for-interviews",
};

export const envFlags = {
  authReady: Boolean(
    env.nextAuth.secret &&
      env.nextAuth.googleClientId &&
      env.nextAuth.googleClientSecret,
  ),
  geminiReady: Boolean(env.geminiApiKey),
  elevenLabsReady: Boolean(env.elevenLabsApiKey && env.elevenLabsVoiceId),
  mongoReady: Boolean(env.mongodbUri),
};

export { env };
