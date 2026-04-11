import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  image: string;
  provider: string;
  focusTrack: string | null;
  bio: string | null;
  resumeUrl: string | null;
  resumeStorageKey: string | null;
  resumeFileName: string | null;
  resumeMimeType: string | null;
  resumeUploadedAt: Date | null;
  resumeExtractedText: string | null;
  preferences: {
    voiceId: string | null;
    feedbackStyle: "detailed" | "concise" | "structured";
    practiceReminders: boolean;
    weeklyGoal: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static async findOrCreateUser(email: string, name: string, image: string, provider: string): Promise<User> {
    const db = await getMongoDb();
    if (!db) throw new Error("MongoDB not connected");

    const usersCollection = db.collection<User>("users");

    // Create index if it doesn't exist
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return existingUser;
    }

    const newUser: User = {
      email,
      name,
      image,
      provider,
      focusTrack: null,
      bio: null,
      resumeUrl: null,
      resumeStorageKey: null,
      resumeFileName: null,
      resumeMimeType: null,
      resumeUploadedAt: null,
      resumeExtractedText: null,
      preferences: {
        voiceId: null,
        feedbackStyle: "structured",
        practiceReminders: true,
        weeklyGoal: 3,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const usersCollection = db.collection<User>("users");
    return await usersCollection.findOne({ email });
  }

  static async updateUserProfile(
    email: string,
    updates: Partial<Pick<User, "name" | "bio" | "resumeUrl" | "resumeStorageKey" | "resumeFileName" | "resumeMimeType" | "resumeUploadedAt" | "resumeExtractedText" | "focusTrack" | "preferences">>
  ): Promise<User | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const usersCollection = db.collection<User>("users");
    const result = await usersCollection.findOneAndUpdate(
      { email },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result ?? null;
  }

  static async ensureIndexes(): Promise<void> {
    const db = await getMongoDb();
    if (!db) return;

    const usersCollection = db.collection<User>("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });
  }
}
