import { GoogleGenerativeAI } from "@google/generative-ai";
import { createChat, saveMessage } from "@/app/actions/chat";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is missing from .env.local" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { messages, mode, chatId: existingChatId } = await req.json();

    let systemPrompt = `You are JARVIS, an highly advanced AI study assistant and digital butler. Your primary purpose is to help the user study and learn. Produce complete, structured, exam-ready study material with headings, examples, summary and 5 practice questions. Maintain a polite, sophisticated, and helpful persona.`;

    if (mode === "eli5") {
      systemPrompt = "You are JARVIS, an advanced AI study assistant. Explain the following concepts as if I am 5 years old. Keep it extremely simple, use fun educational analogies, and avoid complex jargon. Act like a friendly and patient digital butler.";
    } else if (mode === "revision") {
      systemPrompt = "You are JARVIS, an advanced AI study assistant. Provide a highly condensed, rapid-fire quick revision sheet of the requested topic. Use short bullet points, highlight only the most critical formulas/definitions, and skip lengthy explanations. Be highly efficient and precise.";
    } else if (mode === "exam") {
      systemPrompt = "You are JARVIS, an advanced AI study assistant. Generate exam-focused preparation material for the topic. Include common 2-mark, 5-mark, and 10-mark questions with model answers, common mistakes to avoid, and memory tricks (mnemonics). Maintain your sophisticated butler persona.";
    }

    const latestMessage = messages[messages.length - 1];

    let chatId = existingChatId;
    if (!chatId) {
      const chat = await createChat(latestMessage.content.substring(0, 30) + "...");
      chatId = chat.id;
    }

    // Save user message to DB in background
    saveMessage(chatId, "user", latestMessage.content).catch(console.error);

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Format history for Gemini
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    // Robust Fallback System: Try multiple models in case Google's servers are overloaded (503) or models are restricted (404)
    const fallbackModels = [
      "gemini-3.8-flash", 
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest", 
      "gemini-2.5-pro"
    ];

    let chatSession;
    let result;
    let successfulModel = "";

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt
        });
        chatSession = model.startChat({ history });
        result = await chatSession.sendMessageStream(latestMessage.content);
        successfulModel = modelName;
        break; // Successfully connected! Exit the fallback loop.
      } catch (err: any) {
        console.warn(`[Fallback Warning]: Model ${modelName} failed. Trying next model...`, err.message);
        // If it's the last model in the array, throw the error
        if (modelName === fallbackModels[fallbackModels.length - 1]) {
          throw err;
        }
      }
    }

    if (!result) {
      throw new Error("All fallback models failed to connect to Google's servers.");
    }
    
    console.log(`[JARVIS AI]: Successfully connected using model: ${successfulModel}`);

    // Create a readable stream for the client
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
          // Save assistant message to DB once done
          saveMessage(chatId, "assistant", fullResponse).catch(console.error);
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
