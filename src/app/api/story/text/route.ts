"use server";

import { OpenAI } from "openai";
import { MongoClient } from "mongodb";

const openai = new OpenAI();
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}
const client = new MongoClient(uri);

export async function POST(request: Request) {
  const data = await request.json();
  const { userid, username, storyPrompt } = data;

  if (!userid || !username || !storyPrompt) {
    return Response.json(
      { error: "Missing userid, username, or storyPrompt parameter" },
      { status: 400 }
    );
  }

  try {
    await client.connect();
    const database = client.db("Storypalzzz");
    const stories = database.collection("stories");

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You a create children's story teller. Create a story with no more than 5 pages. Given a prompt that defines certain characteristics like main character, theme, setting, etc, respond with a story in JSON format with structure: {title: story's title, story: [{page_text: text for a page in the story, image_prompt: description of the scene in the story sufficient to recreate the image with no context}, ...]}",
        },
        {
          role: "user",
          content: storyPrompt,
        },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (content === null) {
      throw new Error("Received null content from OpenAI");
    }

    const story = JSON.parse(content);

    // Check if the story already exists in the database
    const existingStory = await stories.findOne({ story });
    if (existingStory) {
      return Response.json({ error: "Story already exists" }, { status: 409 });
    }

    // Insert story data into MongoDB
    const newStory = {
      userid,
      username,
      createdAt: new Date(),
      story,
      storyPrompt,
      storyName: story.title,
    };
    const result = await stories.insertOne(newStory);

    return Response.json(
      { story, storyId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
