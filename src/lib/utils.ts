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

export const parseSRTFile = (srtContent: string): SubtitleSegment[] => {
  const subtitles: SubtitleSegment[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // First line is index
    // Second line is timestamp: 00:00:00,000 --> 00:00:05,000
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

    if (!timeMatch) continue;

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];

    // Remaining lines are subtitle text
    const text = lines.slice(2).join('\n').trim();

    subtitles.push({
      startTime,
      endTime,
      originalText: text, // SRT doesn't have original text, so we use the same
      text,
    });
  }

  return subtitles;
};