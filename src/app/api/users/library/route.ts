"use server";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}
const client = new MongoClient(uri);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userid = url.searchParams.get("userid");

  if (!userid) {
    return Response.json(
      { error: "Missing userid parameter" },
      { status: 400 }
    );
  }

  try {
    await client.connect();
    const database = client.db("Storypalzzz");
    const stories = database.collection("stories");

    // Fetch stories for the given userid and sort by createdAt in descending order
    const userStories = await stories
      .find({ userid })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(userStories, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch stories" }, { status: 500 });
  } finally {
    await client.close();
  }
}
