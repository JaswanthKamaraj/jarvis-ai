import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    // DEMO MODE: If no API key is provided, return hardcoded flashcards
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        flashcards: [
          { question: "Where is my API Key?", answer: "It is missing from your .env file!" },
          { question: "Is the app broken?", answer: "No, the UI is working perfectly, but it has no brain without an OpenAI Key." },
          { question: "How do I fix this?", answer: "Add your OPENAI_API_KEY to the .env file and restart the server." }
        ]
      }), { headers: { "Content-Type": "application/json" } });
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: "You are JARVIS, an advanced AI study assistant. Create exactly 6 high-quality flashcards for the requested topic. Ensure the answers are concise and easy to memorize.",
      prompt: `Topic: ${topic}`,
      schema: z.object({
        flashcards: z.array(
          z.object({
            question: z.string().describe("The front of the flashcard (the question or term)"),
            answer: z.string().describe("The back of the flashcard (the answer or definition)"),
          })
        ),
      }),
    });

    return new Response(JSON.stringify(result.object), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Flashcards API Error:", error);
    return new Response("Error generating flashcards", { status: 500 });
  }
}
