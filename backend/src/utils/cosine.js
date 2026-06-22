/**
 * Calculate cosine similarity between two vectors.
 * Returns a value in [-1, 1] where 1 means the vectors point the same way
 * (most similar). This is how we rank which document best matches a question.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0; // sum of element-wise products
  let normA = 0; // squared magnitude of vecA
  let normB = 0; // squared magnitude of vecB

  // Accumulate the dot product and each vector's magnitude in one pass
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  // Divide the dot product by the product of the magnitudes
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
