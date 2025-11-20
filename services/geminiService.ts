import { GoogleGenAI, Type } from "@google/genai";
import { TaskCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIdeas = async (type: 'task' | 'reward', currentCount: number) => {
  const model = 'gemini-2.5-flash';
  
  const taskPrompt = `
    Generate 3 creative and age-appropriate tasks for a child's behavior chart (ages 4-7).
    Categories are: Life Habits, Behavioral Habits, or Bonus Items.
    Output JSON only.
  `;

  const rewardPrompt = `
    Generate 3 fun and motivating rewards for a child (ages 4-7) that they can buy with points.
    Keep costs reasonable (between 20 and 200 points).
    Output JSON only.
  `;

  const prompt = type === 'task' ? taskPrompt : rewardPrompt;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: type === 'task' ? {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING, enum: [TaskCategory.LIFE, TaskCategory.BEHAVIOR, TaskCategory.BONUS] },
              stars: { type: Type.NUMBER, description: "Recommended star value between 1 and 10" }
            }
          }
        } : {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              cost: { type: Type.NUMBER, description: "Cost in stars" },
              icon: { type: Type.STRING, description: "A single emoji representing the reward" }
            }
          }
        }
      }
    });

    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};