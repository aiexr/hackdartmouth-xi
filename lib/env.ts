import "server-only";

export const APP_NAME = "LeetCode for Interviews";

const env = {
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  llmProvider: process.env.LLM_PROVIDER,
  openAiApiKey: process.env.OPENAI_API_KEY,
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
