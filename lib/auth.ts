import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

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

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !isValidMongoUri(uri)) return null;

  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  return globalWithMongo._mongoClientPromise;
}

const clientPromise = getClientPromise();

export const authOptions: NextAuthOptions = {
  adapter: clientPromise
    ? (MongoDBAdapter(clientPromise) as NextAuthOptions["adapter"])
    : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
  },
  session: {
    strategy: clientPromise ? "database" : "jwt",
  },
};

export { clientPromise };
