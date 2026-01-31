import { GoogleGenAI, Type } from '@google/genai';
import { SubtitleSegment } from '@/types';
import { fileToGenerativePart } from '@/lib/utils';
import { extractAudioFromVideo } from '@/lib/audioExtractor';

export const processVideoWithGemini = async (
  file: File,
  targetLanguage: string,
  apiKey: string,
  enableTranslation: boolean = true,
  onProgress?: (stage: string, progress: number) => void
): Promise<SubtitleSegment[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extract audio from video first to reduce payload size
  // This reduces file size by ~90% allowing longer videos within API limits
  if (onProgress) {
    onProgress('extracting_audio', 0);
  }

  const audioFile = await extractAudioFromVideo(file, (progress) => {
    if (onProgress) {
      onProgress('extracting_audio', progress);
    }
  });

  if (onProgress) {
    onProgress('extracting_audio', 100);
  }

  // Convert audio file to base64 for the API
  const filePart = await fileToGenerativePart(audioFile);

  const prompt = enableTranslation ? `
    Task:
    You are given an audio file. Your task is to:
    1. Detect the source language automatically.
    2. Transcribe all speech accurately.
    3. Translate the transcription into ${targetLanguage} with native-level, context-aware adaptation.

    Translation Rules:
    - Analyze the content to determine domain (e.g., news, education, spiritual, technical) and tone (e.g., formal, conversational).
    - Translate meaning, not words. Do not translate literally.
    - Use terminology, idioms, and phrasing natural to ${targetLanguage} for that domain.
    - Preserve intent, emphasis, and emotional tone.
    - Do not summarize, add commentary, or invent content.

    Segmentation Rules:
    - Divide speech into logical subtitle chunks based on pauses, sentence boundaries, and meaning.
    - Each chunk should be readable within its time window.

    Timing Rules:
    - Provide accurate 'startTime' and 'endTime' for each chunk.
    - Format strictly in SRT style: HH:MM:SS,mmm
    - Ensure startTime < endTime, no overlapping ranges, and continuous flow.

    Output Rules:
    - Output **only** valid JSON, strictly following this schema:

    JSON Schema:
    [
      {
        "startTime": "00:00:01,500",
        "endTime": "00:00:04,200",
        "originalText": "Transcription in the detected language",
        "text": "Context-adapted translation in ${targetLanguage}"
      }
    ]
  ` : `
    Task:
    You are given an audio file. Your task is to:
    1. Detect the source language automatically.
    2. Transcribe all speech accurately without translation.

    Transcription Rules:
    - Preserve punctuation, capitalization, and spoken grammar.
    - Transcribe exactly as spoken. Do not paraphrase or summarize.
    - Exclude non-speech sounds unless they are clearly words (e.g., "uh", "okay").

    Segmentation Rules:
    - Divide speech into logical subtitle chunks based on pauses, sentence boundaries, and meaning.
    - Each chunk should be readable within its time window.

    Timing Rules:
    - Provide accurate 'startTime' and 'endTime' for each chunk.
    - Format strictly in SRT style: HH:MM:SS,mmm
    - Ensure startTime < endTime, no overlapping ranges, and continuous flow.

    Output Rules:
    - Output **only** valid JSON, strictly following this schema:

    JSON Schema:
    [
      {
        "startTime": "00:00:01,500",
        "endTime": "00:00:04,200",
        "originalText": "Exact transcription in the detected language",
        "text": "Exact transcription in the detected language"
      }
    ]
  `;

  try {
    // Update progress to show AI processing is starting
    if (onProgress) {
      onProgress('processing_ai', 0);
    }

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
       throw new Error("File is too large for the browser-based API call. Please try a shorter video or audio clip.");
    }
    throw new Error("Failed to process audio: " + (error.message || "Unknown error"));
  }
};