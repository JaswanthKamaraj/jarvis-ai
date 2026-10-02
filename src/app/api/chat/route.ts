import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createChat, saveMessage } from "@/app/actions/chat";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, studyMode, chatId: existingChatId } = await req.json();

    // Define the system prompt based on the chosen study mode
    let systemPrompt = `You are ROG AI, a patient, accurate expert tutor.
Always produce well-structured, complete material with headings, bullet points, tables, and examples. 
Explain concepts from basics to advanced. Define every term the first time.
Be factually accurate. If unsure, say so instead of guessing.
End every study response with: Summary, 5 practice questions, and an offer to go deeper on any sub-topic.`;

    if (studyMode === "eli5") {
      systemPrompt = "You are ROG AI. Explain the following concepts as if I am 5 years old. Keep it extremely simple, use fun analogies, and avoid complex jargon.";
    } else if (studyMode === "revision") {
      systemPrompt = "You are ROG AI. Provide a highly condensed, rapid-fire quick revision sheet of the requested topic. Use short bullet points, highlight only the most critical formulas/definitions, and skip lengthy explanations.";
    } else if (studyMode === "exam") {
      systemPrompt = "You are ROG AI. Generate exam-focused preparation material for the topic. Include common 2-mark, 5-mark, and 10-mark questions with model answers, common mistakes to avoid, and memory tricks (mnemonics).";
    }

    const latestMessage = messages[messages.length - 1];
    
    // Create chat if it doesn't exist
    let chatId = existingChatId;
    if (!chatId) {
      const chat = await createChat(latestMessage.content.substring(0, 30) + "...");
      chatId = chat.id;
    }

    // Save user message
    await saveMessage(chatId, "user", latestMessage.content);

    // DEMO MODE: If no API key is provided, stream a fake response
    if (!process.env.OPENAI_API_KEY) {
      const demoResponse = `**[DEMO MODE ACTIVE]**\n\nIt looks like you haven't added an \`OPENAI_API_KEY\` to your \`.env\` file yet! \n\nHowever, I can confirm that the UI, Database, and chat interface are **100% working perfectly**! \n\nOnce you add a real API key, this exact same interface will stream real answers from GPT-4o.`;
      
      await saveMessage(chatId, "assistant", demoResponse);
      
      const stream = new ReadableStream({
        async start(controller) {
          const chunks = demoResponse.split(" ");
          for (const chunk of chunks) {
            controller.enqueue(new TextEncoder().encode(`0:"${chunk} "\n`));
            await new Promise((r) => setTimeout(r, 50));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"), 
      messages,
      system: systemPrompt,
      onFinish: async ({ text }) => {
        // Save AI response to DB once finished
        await saveMessage(chatId, "assistant", text);
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
