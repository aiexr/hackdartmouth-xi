import "server-only";

const env = {
  appName:
    process.env.NEXT_PUBLIC_APP_NAME?.trim() || "LeetCode for Interviews",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  geminiApiKey: process.env.GEMINI_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME || "leetcode-for-interviews",
};

export const envFlags = {
  firebaseReady: Boolean(
    env.firebase.apiKey &&
      env.firebase.authDomain &&
      env.firebase.projectId &&
      env.firebase.appId,
  ),
  geminiReady: Boolean(env.geminiApiKey),
  elevenLabsReady: Boolean(env.elevenLabsApiKey && env.elevenLabsVoiceId),
  mongoReady: Boolean(env.mongodbUri),
};

export { env };
