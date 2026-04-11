import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export interface Interview {
  _id?: ObjectId;
  userId: ObjectId | null;
  email: string;
  scenarioId: string;
  status: "in-progress" | "completed" | "graded";
  transcript: Array<{
    role: "interviewer" | "candidate";
    content: string;
    timestamp: Date;
  }>;
  overallScore: number | null;
  letterGrade: string | null;
  gradingResult: {
    dimensions: Array<{
      name: string;
      score: number;
      feedback: string;
    }>;
    perQuestion: Array<{
      question: string;
      answerSummary: string;
      score: number;
      feedback: string;
    }>;
    strengths: string[];
    improvements: string[];
    keyMoments: Array<{
      timestamp: Date;
      type: string;
      description: string;
    }>;
  } | null;
  duration: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export class InterviewModel {
  static async createInterview(
    email: string,
    scenarioId: string,
    userId?: ObjectId
  ): Promise<Interview> {
    const db = await getMongoDb();
    if (!db) throw new Error("MongoDB not connected");

    const interviewsCollection = db.collection<Interview>("interviews");

    const newInterview: Interview = {
      userId: userId || null,
      email,
      scenarioId,
      status: "in-progress",
      transcript: [],
      overallScore: null,
      letterGrade: null,
      gradingResult: null,
      duration: null,
      createdAt: new Date(),
      completedAt: null,
    };

    const result = await interviewsCollection.insertOne(newInterview);
    return { ...newInterview, _id: result.insertedId };
  }

  static async getInterviewById(id: string): Promise<Interview | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const interviewsCollection = db.collection<Interview>("interviews");
    return await interviewsCollection.findOne({ _id: new ObjectId(id) });
  }

  static async getInterviewsByUser(email: string): Promise<Interview[]> {
    const db = await getMongoDb();
    if (!db) return [];

    const interviewsCollection = db.collection<Interview>("interviews");
    return await interviewsCollection.find({ email }).sort({ createdAt: -1 }).toArray();
  }

  static async appendTranscript(
    id: string,
    role: "interviewer" | "candidate",
    content: string
  ): Promise<Interview | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const interviewsCollection = db.collection<Interview>("interviews");
    const result = await interviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $push: {
          transcript: {
            role,
            content,
            timestamp: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    return (result as any)?.value ?? null;
  }

  static async completeInterview(
    id: string,
    duration: number
  ): Promise<Interview | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const interviewsCollection = db.collection<Interview>("interviews");
    const result = await interviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "completed",
          duration,
          completedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return (result as any)?.value ?? null;
  }

  static async updateGradingResult(
    id: string,
    overallScore: number,
    letterGrade: string,
    gradingResult: Interview["gradingResult"]
  ): Promise<Interview | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const interviewsCollection = db.collection<Interview>("interviews");
    const result = await interviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "graded",
          overallScore,
          letterGrade,
          gradingResult,
        },
      },
      { returnDocument: "after" }
    );

    return (result as any)?.value ?? null;
  }

  static async ensureIndexes(): Promise<void> {
    const db = await getMongoDb();
    if (!db) return;

    const interviewsCollection = db.collection<Interview>("interviews");
    await interviewsCollection.createIndex({ email: 1 });
    await interviewsCollection.createIndex({ scenarioId: 1 });
    await interviewsCollection.createIndex({ createdAt: 1 });
    await interviewsCollection.createIndex({ status: 1 });
  }
}
