import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.API_KEY,
  baseURL: env.BASE_URL,
});

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

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  return response.choices[0].message.content || "No answer generated.";
};
