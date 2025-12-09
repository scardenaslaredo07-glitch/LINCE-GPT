
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { BalanceResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const balanceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    unbalancedEquation: {
      type: Type.STRING,
      description: 'The original unbalanced equation provided by the user.',
    },
    balancedEquation: {
      type: Type.STRING,
      description: 'The correctly balanced chemical equation. If unsolvable, leave empty or state "Impossible".',
    },
    synthesis: {
        type: Type.STRING,
        description: 'A concise summary or synthesis of the final balanced equation and the key changes made.',
    },
    explanation: {
      type: Type.STRING,
      description: 'A general explanation of the balancing process.',
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'An array of strings, where each string is a detailed, numbered step in the balancing process.',
    },
    isSolvable: {
      type: Type.BOOLEAN,
      description: 'True if the equation can be chemically balanced.',
    },
    neutralizationType: {
      type: Type.STRING,
      enum: ['NONE', 'COLD', 'HEAT', 'IMPOSSIBLE'],
      description: 'The type of outcome. COLD if H >= 14. HEAT if O >= 16. IMPOSSIBLE if unsolvable and no thresholds met. NONE otherwise.',
    },
    warningMessage: {
      type: Type.STRING,
      description: 'Explanation of the neutralization or error (e.g., "Neutralización por frío: Exceso de hidrógeno").',
    },
  },
  required: ['unbalancedEquation', 'balancedEquation', 'synthesis', 'explanation', 'steps', 'isSolvable', 'neutralizationType'],
};

export async function balanceEquation(equation: string): Promise<BalanceResult> {
  const prompt = `You are "Skynet", an advanced AI chemistry calculator. You MUST respond in Spanish.

Analyze the following chemical equation: "${equation}"

Perform the following checks strictly in this order:

1. **Atom Count Check (Reactants & Potential Products)**:
   - Count the TOTAL number of Hydrogen (H) atoms involved.
   - Count the TOTAL number of Oxygen (O) atoms involved.

2. **Neutralization Determination**:
   - **Neutralización por Calor (HEAT)**: If Total Oxygen (O) >= 16.
     - Set 'neutralizationType' to 'HEAT'.
     - Set 'warningMessage' to "Neutralización por calor detectada (O >= 16). Contradicción térmica inminente."
   - **Neutralización por Frío (COLD)**: If Total Hydrogen (H) >= 14.
     - Set 'neutralizationType' to 'COLD'.
     - Set 'warningMessage' to "Neutralización por frío detectada (H >= 14). Congelación molecular inminente."
   
   *Priority*: If both thresholds are met, prioritize the one with the higher count relative to its threshold, or default to HEAT.

3. **Solvability Check**:
   - Can this equation physically exist and be balanced?
   - If NO (contradiction/impossible):
     - Set 'isSolvable' to false.
     - IF a Neutralization (HEAT/COLD) was detected above, KEEP that neutralization type. The cause of the contradiction is the excess atoms.
     - IF NO Neutralization was detected above, set 'neutralizationType' to 'IMPOSSIBLE' and explain the contradiction in 'warningMessage'.

Output requirements:
- Even if neutralizations occur or it is impossible, provide the balanced equation and steps if mathematically possible/approximable, otherwise explain the failure.
- **Synthesis**: Summarize the result.

Return your response in the specified structured JSON format only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: balanceResponseSchema,
      },
    });

    const jsonString = response.text.trim();
    // It is already a JSON object due to responseMimeType
    const result = JSON.parse(jsonString);
    return result as BalanceResult;

  } catch (error) {
    console.error("Error balancing equation:", error);
    throw new Error("Failed to get a valid response from the AI. Please check the equation and try again.");
  }
}

export function createChatSession(): Chat {
    const systemInstruction = 'Eres Skynet, un tutor experto en química. Responde SIEMPRE en español. Monitorea "Neutralización por Frío" (Hidrógeno >= 14) y "Neutralización por Calor" (Oxígeno >= 16).';
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
}

export async function synthesizeSpeech(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw new Error("Failed to generate audio for the explanation.");
  }
}
