import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts live in public/fonts/ so renders work offline and look identical everywhere.
// All three are SIL Open Font License (free for commercial use).
// To use your own: drop a .woff2/.ttf in public/fonts/ and add a loadFont() line.
export const DISPLAY = 'Anton'; // tall condensed — lyrics
export const HEAVY = 'Archivo Black'; // wide & heavy — titles, text masks
export const BODY = 'Inter'; // small labels

loadFont({family: DISPLAY, url: staticFile('fonts/Anton.woff2'), weight: '400'});
loadFont({family: HEAVY, url: staticFile('fonts/ArchivoBlack.woff2'), weight: '400'});
loadFont({family: BODY, url: staticFile('fonts/Inter-Bold.woff2'), weight: '700'});
