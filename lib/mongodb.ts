import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

function isValidMongoUri(uri: string) {
  const trimmed = uri.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.includes("<") || trimmed.includes(">")) {
    return false;
  }

  return /^mongodb(\+srv)?:\/\/.+/.test(trimmed);
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const MONGO_CONNECT_TIMEOUT_MS = 10_000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function getMongoClient() {
  if (!env.mongodbUri || !isValidMongoUri(env.mongodbUri)) {
    return null;
  }

  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(env.mongodbUri, {
      connectTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
      serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
      socketTimeoutMS: 30_000,
      maxPoolSize: 5,
      minPoolSize: 0,
    });
    global.__mongoClientPromise__ = withTimeout(
      client.connect(),
      MONGO_CONNECT_TIMEOUT_MS,
      "MongoDB connection timed out.",
    );
  }

  return global.__mongoClientPromise__;
}

export async function getMongoDb() {
  const clientPromise = getMongoClient();
  if (!clientPromise) {
    return null;
  }

  try {
    const client = await clientPromise;
    return client.db(env.mongodbDbName);
  } catch (error) {
    global.__mongoClientPromise__ = undefined;
    throw error;
  }
}

export function clearMongoClient() {
  global.__mongoClientPromise__ = undefined;
}

export async function getOptionalMongoDb() {
  try {
    return await getMongoDb();
  } catch (error) {
    console.error("Failed to connect to MongoDB.", error);
    return null;
  }
}
