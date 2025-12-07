import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Task, Project } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are Horizon, an expert AI Project Architect. 
Your goal is to help users turn vague ideas into concrete, actionable projects.
You are encouraging but realistic. You prioritize breaking down complex problems into small steps.`;

/**
 * Generates a structured project plan using Gemini 3 Pro with Thinking Config
 * to ensure deep reasoning about dependencies and difficulty.
 */
export const generateProjectPlan = async (idea: string): Promise<{ title: string; description: string; tasks: Omit<Task, 'id' | 'isCompleted'>[]; tags: string[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy, short title for the project" },
      description: { type: Type.STRING, description: "A concise executive summary of the project" },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "3-5 relevant tags (e.g. 'React', 'Woodworking', 'Novel')" 
      },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedTime: { type: Type.STRING, description: "e.g. '2 hours', '3 days'" },
            category: { type: Type.STRING, enum: ['Research', 'Development', 'Design', 'Marketing', 'Other'] }
          },
          required: ['title', 'description', 'category']
        }
      }
    },
    required: ['title', 'description', 'tasks', 'tags']
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this project idea and create a structured plan: "${idea}". 
    Break it down into logical initial steps. Think deeply about potential pitfalls.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
      // Using thinking budget for better planning on complex ideas
      thinkingConfig: { thinkingBudget: 2048 } 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

/**
 * Generates a visual identity for the project using Gemini Flash Image
 */
export const generateProjectImage = async (description: string): Promise<string> => {
  if (!process.env.API_KEY) return "https://picsum.photos/400/300";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A futuristic, abstract, high-quality architectural concept art representing: ${description}. Minimalist, glowing, cyberpunk aesthetic. 4k resolution.` }]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
       }
    }
    return "https://picsum.photos/400/300"; // Fallback
  } catch (e) {
    console.error("Image gen failed", e);
    return "https://picsum.photos/400/300";
  }
};

/**
 * Performs research using Google Search Grounding
 */
export const researchTopic = async (query: string): Promise<{ text: string, links: Array<{title: string, uri: string}> }> => {
  if (!process.env.API_KEY) {
     return { text: "Please configure API Key to search.", links: [] };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a research assistant. Summarize findings concisely."
    }
  });

  const text = response.text || "No results found.";
  
  const links: Array<{title: string, uri: string}> = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        links.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }

  return { text, links };
};

/**
 * Standard chat for the 'Co-Founder' interface
 */
export const chatStream = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    // We map the simplified history format to what the SDK expects if needed, 
    // or use the chat helper. Here we'll use generateContentStream for single-turn 
    // context simulation or simple chat object.
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION
        }
    });

    return await chat.sendMessageStream({ message });
};
