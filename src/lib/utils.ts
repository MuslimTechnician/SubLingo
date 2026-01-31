import { SubtitleSegment } from "./types";

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateSRTContent = (subtitles: SubtitleSegment[]): string => {
  return subtitles.map((sub, index) => {
    return `${index + 1}
${sub.startTime} --> ${sub.endTime}
${sub.text}

`;
  }).join('');
};

export const parseSRTTime = (timeString: string): number => {
  // format HH:MM:SS,mmm
  if (!timeString) return 0;
  const parts = timeString.split(':');
  if (parts.length < 3) return 0;

  const secondsParts = parts[2].split(',');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = parseInt(secondsParts[1] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};