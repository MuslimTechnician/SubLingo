import { GoogleGenAI, Type } from '@google/genai';
import { SubtitleSegment } from '@/types';
import { fileToGenerativePart } from '@/lib/utils';

export const processVideoWithGemini = async (
  file: File,
  targetLanguage: string,
  apiKey: string,
  enableTranslation: boolean = true
): Promise<SubtitleSegment[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert file to base64 for the API
  const filePart = await fileToGenerativePart(file);

  const prompt = enableTranslation ? `
    Task: Extract voices from the provided video file, transcribe them, and translate the transcription with native-level contextual adaptation.

    Target Language for Translation: ${targetLanguage}

    Requirements:
    - Contextual Analysis: Analyze the audio to determine the specific domain, subject matter, and tone (e.g., formal, professional, spiritual, or technical).
    - Domain-Specific Translation: Translate the content according to the linguistic norms of that specific field. Avoid literal word-for-word translation. Instead, use the terminology, idioms, and stylistic conventions that a native speaker of ${targetLanguage} would naturally use when discussing that specific topic.
    - Source Language Detection: Automatically detect the source language and segment the speech into logical subtitle chunks.

    Data Mapping: For each chunk, provide:
    - 'startTime' and 'endTime' in strictly SRT format (HH:MM:SS,mmm).
    - 'originalText': The transcription in the original source language.
    - 'text': The adaptively translated text in ${targetLanguage}.

    Output strictly in JSON format matching the requested schema.
  ` : `
    Task: Extract voices from the provided video file and transcribe them accurately without translation.

    Requirements:
    - Accurate Transcription: Transcribe the speech exactly as spoken, maintaining proper punctuation, capitalization, and grammar.
    - Source Language Detection: Automatically detect the source language.
    - Logical Segmentation: Segment the speech into logical subtitle chunks with appropriate timing.

    Data Mapping: For each chunk, provide:
    - 'startTime' and 'endTime' in strictly SRT format (HH:MM:SS,mmm).
    - 'originalText': The transcription in the original language.
    - 'text': Same as originalText (no translation).

    Output strictly in JSON format matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          filePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING, description: "Start timestamp in HH:MM:SS,mmm format (e.g., 00:00:01,500)" },
              endTime: { type: Type.STRING, description: "End timestamp in HH:MM:SS,mmm format" },
              originalText: { type: Type.STRING, description: "Transcription in original language" },
              text: {
                type: Type.STRING,
                description: enableTranslation
                  ? `Translation in ${targetLanguage}`
                  : "Same as originalText (no translation)"
              },
            },
            required: ["startTime", "endTime", "originalText", "text"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response from AI model.");
    }

    const result = JSON.parse(jsonText) as SubtitleSegment[];
    return result;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("413")) {
       throw new Error("File is too large for the browser-based API call. Please use a shorter video clip (< 20MB) for this demo.");
    }
    throw new Error("Failed to process video: " + (error.message || "Unknown error"));
  }
};