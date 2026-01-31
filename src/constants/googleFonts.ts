export const GOOGLE_FONTS = [
  // Sans-serif
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Inter',
  'Source Sans Pro',
  'Nunito',
  'Raleway',
  'Oswald',
  'Ubuntu',
  'PT Sans',
  'Noto Sans',
  'Work Sans',
  'Rubik',
  'Barlow',
  'Mulish',
  'Cabin',
  'Questrial',
  'Karla',

  // Serif
  'Playfair Display',
  'Merriweather',
  'Lora',
  'EB Garamond',
  'Crimson Text',
  'Libre Baskerville',
  'Source Serif Pro',
  'PT Serif',
  'Noto Serif',
  'Bitter',

  // Display
  'Bebas Neue',
  'Anton',
  'Righteous',
  'Bangers',
  'Cinzel',
  'Fredoka One',
  'Permanent Marker',
  'Pacifico',
  'Shadows Into Light',
  'Lobster',

  // Monospace
  'Fira Code',
  'JetBrains Mono',
  'Source Code Pro',
  'Roboto Mono',
  'Ubuntu Mono',
  'PT Mono',
  'Noto Mono',
  'IBM Plex Mono',
  'Space Mono',
  'Anonymous Pro',
] as const;

export const GOOGLE_FONT_URL = 'https://fonts.googleapis.com/css2?family=' +
  GOOGLE_FONTS.map(font => font.replace(/ /g, '+')).join('&family=') +
  '&display=swap';
