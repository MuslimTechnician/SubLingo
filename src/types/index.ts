export interface SubtitleSegment {
    startTime: string; // Format HH:MM:SS,mmm
    endTime: string;   // Format HH:MM:SS,mmm
    originalText: string;
    text: string;      // The translated text in the selected language
}

export interface Language {
    code: string;
    name: string;
    nativeName: string;
}

export interface SubtitleStyle {
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    bgOpacity: number;
    bottomPosition: number; // Distance from bottom in percentage (0-100)
}