// Semantic similarity utilities for B-roll matching

export interface EmbeddingVector {
  values: number[]
  dimension: number
}

// Simple token-based embedding for lightweight matching
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2)
}

// Compute Jaccard similarity between two texts
export function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenizeText(text1))
  const tokens2 = new Set(tokenizeText(text2))

  const intersection = Array.from(tokens1).filter((token) => tokens2.has(token)).length
  const union = tokens1.size + tokens2.size - intersection

  return union > 0 ? intersection / union : 0
}

// Compute cosine similarity between embedding vectors
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same dimension")
  }

  let dotProduct = 0
  let magnitude1 = 0
  let magnitude2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    magnitude1 += vec1[i] * vec1[i]
    magnitude2 += vec2[i] * vec2[i]
  }

  magnitude1 = Math.sqrt(magnitude1)
  magnitude2 = Math.sqrt(magnitude2)

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  return dotProduct / (magnitude1 * magnitude2)
}

// Simple embedding based on token presence and frequency
export function createEmbedding(text: string, vocabulary: Set<string> = new Set()): number[] {
  const tokens = tokenizeText(text)
  const freq = new Map<string, number>()

  tokens.forEach((token) => {
    freq.set(token, (freq.get(token) || 0) + 1)
    vocabulary.add(token)
  })

  // Create sparse representation with vocabulary
  const vocab = Array.from(vocabulary)
  const embedding = new Array(Math.min(vocab.length, 100)).fill(0)

  for (let i = 0; i < embedding.length; i++) {
    if (vocab[i]) {
      embedding[i] = (freq.get(vocab[i]) || 0) / tokens.length
    }
  }

  return embedding
}
