
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSymptom = async (symptom: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente síntoma físico desde la perspectiva de la biodescodificación femenina: "${symptom}". 
      Proporciona una breve interpretación emocional (máximo 100 palabras) que invite a la reflexión y termine con una frase motivadora sobre el poder de la sanación interior. 
      Responde de forma empática y cálida.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing symptom:", error);
    return "Lo siento, hubo un problema al procesar tu consulta. Inténtalo de nuevo.";
  }
};
