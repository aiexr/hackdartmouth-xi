import { Binary, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export interface UserResume {
  _id?: ObjectId;
  email: string;
  fileName: string;
  mimeType: string;
  uploadedAt: Date;
  data: Binary;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResumeModel {
  static async getResumeByEmail(email: string): Promise<UserResume | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const resumesCollection = db.collection<UserResume>("user_resumes");
    return resumesCollection.findOne({ email });
  }

  static async upsertResume(email: string, input: { fileName: string; mimeType: string; uploadedAt: Date; data: Buffer }) {
    const db = await getMongoDb();
    if (!db) return null;

    const resumesCollection = db.collection<UserResume>("user_resumes");
    await resumesCollection.createIndex({ email: 1 }, { unique: true });

    const now = new Date();
    const result = await resumesCollection.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          fileName: input.fileName,
          mimeType: input.mimeType,
          uploadedAt: input.uploadedAt,
          data: new Binary(input.data),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return result ?? null;
  }

  static async ensureIndexes(): Promise<void> {
    const db = await getMongoDb();
    if (!db) return;

    const resumesCollection = db.collection<UserResume>("user_resumes");
    await resumesCollection.createIndex({ email: 1 }, { unique: true });
  }
}
