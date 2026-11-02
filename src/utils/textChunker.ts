/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Splits text into optimal chunks for speech synthesis.
 * Handles both Hindi (Devanagari purna viram '।') and Latin punctuation,
 * preserving natural pauses while keeping chunks below maxChars.
 */
export function chunkTextForTTS(text: string, maxChars = 480): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  
  // Split by paragraph first if text is large
  const paragraphs = trimmed.split(/\n+/);
  
  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if (cleanPara.length <= maxChars) {
      chunks.push(cleanPara);
      continue;
    }

    // Split by sentence terminators: Hindi purna viram (।), period, exclamation, question mark, or semicolon
    // Regex matches the terminator along with trailing whitespace
    const sentenceParts = cleanPara.match(/[^.!?।;\n]+(?:[.!?।;\n]+|$)/g) || [cleanPara];

    let currentChunk = '';

    for (const part of sentenceParts) {
      const piece = part.trim();
      if (!piece) continue;

      if (!currentChunk) {
        if (piece.length <= maxChars) {
          currentChunk = piece;
        } else {
          // Sentence itself exceeds maxChars: split by comma or words
          const words = piece.split(/\s+/);
          let subChunk = '';
          for (const word of words) {
            if (!subChunk) {
              subChunk = word;
            } else if ((subChunk + ' ' + word).length <= maxChars) {
              subChunk += ' ' + word;
            } else {
              chunks.push(subChunk);
              subChunk = word;
            }
          }
          if (subChunk) {
            currentChunk = subChunk;
          }
        }
      } else {
        if ((currentChunk + ' ' + piece).length <= maxChars) {
          currentChunk += ' ' + piece;
        } else {
          chunks.push(currentChunk);
          currentChunk = piece;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}
