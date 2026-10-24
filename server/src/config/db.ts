import mongoose from "mongoose";

export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB.");
  }

  await mongoose.connect(uri);
  console.info("Connected to MongoDB.");
}
