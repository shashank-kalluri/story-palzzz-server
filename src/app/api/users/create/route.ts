"use server";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}
const client = new MongoClient(uri);

export async function POST(request: Request) {
  const data = await request.json();
  const { email, userId } = data;

  if (!email || !userId) {
    return Response.json(
      { error: "Missing email or userId parameter" },
      { status: 400 }
    );
  }

  try {
    await client.connect();
    const database = client.db("Storypalzzz");
    const users = database.collection("users");

    // Check if the user already exists
    const existingUser = await users.findOne({ email, userId });
    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }

    const newUser = { email, userId, createdAt: new Date() };
    const result = await users.insertOne(newUser);

    return Response.json(
      { message: "User created", userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  } finally {
    await client.close();
  }
}
