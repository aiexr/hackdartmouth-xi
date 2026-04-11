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

export function getMongoClient() {
  if (!env.mongodbUri || !isValidMongoUri(env.mongodbUri)) {
    return null;
  }

  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(env.mongodbUri);
    global.__mongoClientPromise__ = client.connect();
  }

  return global.__mongoClientPromise__;
}

export async function getMongoDb() {
  const clientPromise = getMongoClient();
  if (!clientPromise) {
    return null;
  }

  const client = await clientPromise;
  return client.db(env.mongodbDbName);
}
