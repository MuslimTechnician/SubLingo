import { useState, useEffect } from 'react';

interface GoogleFontsComplete {
  [fontName: string]: {
    variants: string[];
    subsets: string[];
    weights: string[];
    styles: string[];
    category: string;
    unicodeRange: string[];
    version: string;
    lastModified: string;
    files: Record<string, string>;
  };
}

export const useGoogleFonts = () => {
  const [fonts, setFonts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFonts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch from google-fonts-complete CDN (no API key required)
        const response = await fetch(
          'https://cdn.jsdelivr.net/npm/google-fonts-complete/google-fonts.json'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch fonts: ${response.statusText}`);
        }

        const data: GoogleFontsComplete = await response.json();

        // Extract font family names and sort alphabetically
        const fontFamilies = Object.keys(data).sort((a, b) => a.localeCompare(b));

        setFonts(fontFamilies);

        // Store in localStorage for faster loading next time
        localStorage.setItem('google_fonts_cache', JSON.stringify({
          fonts: fontFamilies,
          timestamp: Date.now(),
        }));

        console.log(`Loaded ${fontFamilies.length} Google Fonts from CDN`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fonts';
        setError(errorMessage);
        console.error('Google Fonts CDN error:', errorMessage);

        // Try to load from cache on error
        const cached = localStorage.getItem('google_fonts_cache');
        if (cached) {
          try {
            const { fonts: cachedFonts } = JSON.parse(cached);
            if (cachedFonts && cachedFonts.length > 0) {
              console.log('Using cached font list due to fetch error');
              setFonts(cachedFonts);
            }
          } catch {
            // Cache is invalid
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check cache first (valid for 7 days - font list doesn't change often)
    const cached = localStorage.getItem('google_fonts_cache');
    if (cached) {
      try {
        const { fonts: cachedFonts, timestamp } = JSON.parse(cached);
        const daysSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        if (daysSinceCache < 7 && cachedFonts && cachedFonts.length > 0) {
          console.log(`Using cached font list (${cachedFonts.length} fonts)`);
          setFonts(cachedFonts);
          setIsLoading(false);
          return;
        }
      } catch {
        // Invalid cache, fetch fresh data
      }
    }

    fetchFonts();
  }, []);

  return {
    fonts,
    isLoading,
    error,
  };
};

// Helper to dynamically load a single font via Google Fonts CDN
// Uses API v1 for universal compatibility with all fonts (including variable fonts)
export const loadFontCSS = (fontFamily: string) => {
  // Convert spaces to + for URL encoding
  const formattedName = fontFamily.replace(/ /g, '+');

  // Use Google Fonts API v1 - works with ALL fonts (variable, legacy, regional)
  const fontUrl = `https://fonts.googleapis.com/css?family=${formattedName}:400,700&display=swap`;

  // Check if already loaded
  const linkId = `font-${formattedName}`;
  const existingLink = document.getElementById(linkId);
  if (existingLink) return;

  // Create and append the font link
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = fontUrl;

  // Handle load and error events
  link.onload = () => {
    console.log(`✓ Font loaded: ${fontFamily}`);
  };

  link.onerror = () => {
    console.warn(`✗ Failed to load font: ${fontFamily}`);
    // Remove failed link to allow retry
    link.remove();
  };

  document.head.appendChild(link);
};
