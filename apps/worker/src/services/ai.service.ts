import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const askAI = async (
  webContent: string,
  question: string
): Promise<string> => {
  const prompt = `
        You are given website content below.
        Answer the user's question only using this content.

        Website Content:
        ${webContent.slice(0, 10000)}

        Question:
        ${question}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "No output generate for this prompt.";
};
