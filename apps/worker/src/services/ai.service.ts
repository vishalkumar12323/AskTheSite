import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const askAI = async (
  webContent: string,
  question: string,
  previousMessages?: { role: string; content: string }[]
): Promise<string> => {
  // Build conversation context from previous Q&A pairs
  let conversationContext = "";
  if (previousMessages && previousMessages.length > 0) {
    conversationContext = "\nPrevious conversation:\n" +
      previousMessages
        .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n") +
      "\n";
  }

  const prompt = `You are a helpful assistant that answers questions about websites.
You are given website content below. Answer the user's question only using this content.
Format your answer in Markdown for readability. Use headers, lists, code blocks, and bold text where appropriate.
${conversationContext}
Website Content:
${webContent.slice(0, 10000)}

Question:
${question}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  console.log("AI Answer generation done...");
  return response.text ?? "No output generated for this prompt.";
};
