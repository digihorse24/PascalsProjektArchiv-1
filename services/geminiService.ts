
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private static getAI() {
    // Create a new instance right before making an API call to ensure the latest API key is used
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateImage(prompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Per guidelines, iterate through parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  }

  static async generateVideo(prompt: string, imageBase64?: string): Promise<string> {
    const ai = this.getAI();
    
    // Using Veo 3.1 Fast for efficiency
    const payload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    };

    if (imageBase64) {
      // Ensure we extract only the base64 part if a data URL is provided
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      payload.image = {
        imageBytes: base64Data,
        mimeType: 'image/png'
      };
    }

    let operation = await ai.models.generateVideos(payload);

    // Polling with status updates (10 second interval recommended)
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No download link");

    // Fetch the actual video blob using the current API key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}
