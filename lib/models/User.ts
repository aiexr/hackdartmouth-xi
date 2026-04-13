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

function isDuplicateKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("e11000");
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

export type UserProfileRecord = Omit<User, "resumeExtractedText"> & {
  hasResumeContext: boolean;
};

type CoachUsageState = {
  date: string;
  count: number;
};

type UserWithCoachUsage = User & {
  coachUsage?: CoachUsageState;
};

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

  static async getUserProfileByEmail(email: string): Promise<UserProfileRecord | null> {
    const db = await getMongoDb();
    if (!db) return null;

    try {
      const usersCollection = db.collection<User>("users");
      const [user] = await usersCollection
        .aggregate<UserProfileRecord>([
          { $match: { email } },
          { $limit: 1 },
          {
            $project: {
              _id: 1,
              email: 1,
              name: 1,
              image: 1,
              provider: 1,
              focusTrack: 1,
              bio: 1,
              preferences: 1,
              favorites: 1,
              createdAt: 1,
              updatedAt: 1,
              hasResumeContext: {
                $gt: [
                  {
                    $strLenCP: {
                      $ifNull: ["$resumeExtractedText", ""],
                    },
                  },
                  0,
                ],
              },
            },
          },
        ])
        .toArray();

      return user ?? null;
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

  static async consumeCoachMessage(
    email: string,
    dateKey: string,
    dailyLimit: number,
  ): Promise<{ allowed: boolean; remaining: number; count: number }> {
    await this.ensureIndexes();

    const db = await getMongoDb();
    if (!db) {
      throw new Error("MongoDB not connected");
    }

    try {
      const usersCollection = db.collection<UserWithCoachUsage>("users");
      const now = new Date();

      const incrementExisting = async () =>
        usersCollection.findOneAndUpdate(
          {
            email,
            "coachUsage.date": dateKey,
            "coachUsage.count": { $lt: dailyLimit },
          },
          {
            $inc: { "coachUsage.count": 1 },
            $set: { updatedAt: now },
          },
          { returnDocument: "after" },
        );

      const startNewDay = async () =>
        usersCollection.findOneAndUpdate(
          {
            email,
            $or: [
              { "coachUsage.date": { $exists: false } },
              { "coachUsage.date": { $ne: dateKey } },
            ],
          },
          {
            $setOnInsert: {
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
            },
            $set: {
              coachUsage: {
                date: dateKey,
                count: 1,
              },
              updatedAt: now,
            },
          },
          { upsert: true, returnDocument: "after" },
        );

      const firstIncrement = await incrementExisting();
      if (firstIncrement?.coachUsage) {
        return {
          allowed: true,
          count: firstIncrement.coachUsage.count,
          remaining: Math.max(0, dailyLimit - firstIncrement.coachUsage.count),
        };
      }

      const firstDayUsage = await startNewDay().catch((error) => {
        if (isDuplicateKeyError(error)) {
          return null;
        }

        throw error;
      });
      if (firstDayUsage?.coachUsage) {
        return {
          allowed: true,
          count: firstDayUsage.coachUsage.count,
          remaining: Math.max(0, dailyLimit - firstDayUsage.coachUsage.count),
        };
      }

      const retryIncrement = await incrementExisting();
      if (retryIncrement?.coachUsage) {
        return {
          allowed: true,
          count: retryIncrement.coachUsage.count,
          remaining: Math.max(0, dailyLimit - retryIncrement.coachUsage.count),
        };
      }

      const currentUser = await usersCollection.findOne(
        { email },
        { projection: { coachUsage: 1 } },
      );

      const currentCount =
        currentUser?.coachUsage?.date === dateKey
          ? currentUser.coachUsage.count
          : 0;

      return {
        allowed: false,
        count: currentCount,
        remaining: Math.max(0, dailyLimit - currentCount),
      };
    } catch (error) {
      if (isConnectionError(error)) clearMongoClient();
      throw error;
    }
  }

  static async releaseCoachMessage(email: string, dateKey: string): Promise<void> {
    const db = await getMongoDb();
    if (!db) {
      return;
    }

    try {
      const usersCollection = db.collection<UserWithCoachUsage>("users");
      await usersCollection.updateOne(
        {
          email,
          "coachUsage.date": dateKey,
          "coachUsage.count": { $gt: 0 },
        },
        {
          $inc: { "coachUsage.count": -1 },
          $set: { updatedAt: new Date() },
        },
      );
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
