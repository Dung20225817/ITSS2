import mongoose from "mongoose";

export const connect = async (): Promise<void> => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("MONGO_URL is required");
  }

  try {
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export const isConnected = (): boolean => mongoose.connection.readyState === 1;

export const connectionState = (): number => mongoose.connection.readyState;
