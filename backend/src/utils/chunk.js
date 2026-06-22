/**
 * Split plain text into chunks (one non-empty line = one chunk).
 * @param {string} text
 * @returns {string[]}
 */
export const chunkText = text => {
  const lines = text.split('\n');
  const chunks = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length > 0) {
      chunks.push(trimmedLine);
    }
  }

  return chunks;
};
