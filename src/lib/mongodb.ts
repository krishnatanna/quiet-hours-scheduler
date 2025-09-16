import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in env");
}

const uri = process.env.MONGODB_URI;
let cached: { client?: MongoClient } = (global as any).__mongo__ || {};

if (!cached.client) {
  cached.client = new MongoClient(uri);
  // start connecting (node will pool)
  cached.client.connect().catch((e) => console.error("Mongo connect error", e));
  (global as any).__mongo__ = cached;
}

export const mongoClient = cached.client!;
export const getDb = (name = "quiet_hours_db") => mongoClient.db(name);
