import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    // DEMO MODE: If no API key is provided, return a hardcoded fake quiz
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        quizTitle: "Demo Mode Quiz (Missing API Key)",
        questions: [
          {
            questionText: "Why did you receive this dummy quiz instead of a real one?",
            options: ["The app is broken", "I forgot to add my OPENAI_API_KEY in the .env file", "The AI is sleepy", "Magic"],
            correctAnswerIndex: 1,
            explanation: "The UI and Backend are fully functioning, but since you didn't provide a real OpenAI API Key, the server returned this dummy test to prove it works!"
          },
          {
            questionText: "Is this app ready for your resume?",
            options: ["No", "Maybe", "Absolutely Yes", "Needs more cowbell"],
            correctAnswerIndex: 2,
            explanation: "Once you paste a real API key, this dynamic quiz generator will be one of the strongest portfolio pieces you have."
          }
        ]
      }), { headers: { "Content-Type": "application/json" } });
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: "You are JARVIS, an expert AI examiner. Generate a 5-question multiple choice quiz on the requested topic. Ensure it's challenging but fair.",
      prompt: `Topic: ${topic}`,
      schema: z.object({
        quizTitle: z.string(),
        questions: z.array(
          z.object({
            questionText: z.string(),
            options: z.array(z.string()).length(4).describe("Exactly 4 multiple choice options"),
            correctAnswerIndex: z.number().int().min(0).max(3).describe("The index (0-3) of the correct option in the options array"),
            explanation: z.string().describe("A brief explanation of why this answer is correct")
          })
        ),
      }),
    });

    return new Response(JSON.stringify(result.object), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Quiz API Error:", error);
    return new Response("Error generating quiz", { status: 500 });
  }
}
