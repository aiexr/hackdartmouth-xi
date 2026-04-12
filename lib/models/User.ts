import { ObjectId } from "mongodb";
import type { FavoriteItem } from "@/lib/favorites";
import { getMongoDb, clearMongoClient } from "@/lib/mongodb";

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("timed out") ||
    msg.includes("topology was destroyed") ||
    msg.includes("connection closed") ||
    msg.includes("not connected");
}

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  image: string;
  provider: string;
  focusTrack: string | null;
  bio: string | null;
  resumeExtractedText: string | null;
  preferences: {
    voiceId: string | null;
    feedbackStyle: "detailed" | "concise" | "structured";
    practiceReminders: boolean;
    weeklyGoal: number;
    interviewWrapUpMinutes: number | null;
  };
  favorites: FavoriteItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private static indexesPromise: Promise<void> | null = null;

  static async findOrCreateUser(email: string, name: string, image: string, provider: string): Promise<User> {
    await this.ensureIndexes();

    const db = await getMongoDb();
    if (!db) throw new Error("MongoDB not connected");

    try {
      const usersCollection = db.collection<User>("users");
      const now = new Date();
      const user = await usersCollection.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            email,
            name,
            image,
            provider,
            focusTrack: null,
            bio: null,
            resumeExtractedText: null,
            preferences: {
              voiceId: null,
              feedbackStyle: "structured",
              practiceReminders: true,
              weeklyGoal: 4,
              interviewWrapUpMinutes: null,
            },
            favorites: [],
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true, returnDocument: "after" },
      );

      if (!user) {
        throw new Error(`Failed to upsert user for ${email}`);
      }

      return user;
    } catch (error) {
      if (isConnectionError(error)) clearMongoClient();
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const db = await getMongoDb();
    if (!db) return null;

    try {
      const usersCollection = db.collection<User>("users");
      return await usersCollection.findOne({ email });
    } catch (error) {
      if (isConnectionError(error)) clearMongoClient();
      throw error;
    }
  }

  static async updateUserProfile(
    email: string,
    updates: Partial<Pick<User, "name" | "bio" | "resumeExtractedText" | "focusTrack" | "preferences" | "favorites">>
  ): Promise<User | null> {
    const db = await getMongoDb();
    if (!db) return null;

    try {
      const usersCollection = db.collection<User>("users");
      const now = new Date();
      const setOnInsert: Record<string, unknown> = {
        email,
        name: "",
        image: "",
        provider: "google",
        focusTrack: null,
        bio: null,
        resumeExtractedText: null,
        preferences: {
          voiceId: null,
          feedbackStyle: "structured",
          practiceReminders: true,
          weeklyGoal: 4,
          interviewWrapUpMinutes: null,
        },
        favorites: [],
        createdAt: now,
      };

      for (const key of Object.keys(updates)) {
        delete setOnInsert[key];
      }

      const result = await usersCollection.findOneAndUpdate(
        { email },
        {
          $setOnInsert: setOnInsert,
          $set: {
            ...updates,
            updatedAt: now,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      return result ?? null;
    } catch (error) {
      if (isConnectionError(error)) clearMongoClient();
      throw error;
    }
  }

  static async ensureIndexes(): Promise<void> {
    if (!this.indexesPromise) {
      this.indexesPromise = (async () => {
        const db = await getMongoDb();
        if (!db) return;

        const usersCollection = db.collection<User>("users");
        await usersCollection.createIndex({ email: 1 }, { unique: true });
      })().catch((error) => {
        this.indexesPromise = null;
        throw error;
      });
    }

    await this.indexesPromise;
  }
}
