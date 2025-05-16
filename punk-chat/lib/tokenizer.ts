/**
 * A simplified tokenizer that follows OpenAI's tokenization policy:
 * - 1 token ≈ 4 characters in English text
 * - 1 token ≈ ¾ of a word
 * - Spaces and punctuation count as tokens
 */
export function countTokens(text: string): number {
    if (!text || text.trim() === "") return 0
  
    // Method 1: Character-based approximation
    // 1 token ≈ 4 characters (including spaces and punctuation)
    const charCount = text.length
    const charBasedTokens = Math.ceil(charCount / 4)
  
    // Method 2: Word-based approximation
    // 1 token ≈ ¾ of a word
    // Split by whitespace to count words
    const words = text.trim().split(/\s+/)
    const wordCount = words.length
    const wordBasedTokens = Math.ceil(wordCount / 0.75)
  
    // Method 3: Count punctuation and special characters
    // These often get their own tokens
    const punctuationCount = (text.match(/[.,!?;:()[\]{}'"/\\<>@#$%^&*+=|~`-]/g) || []).length
  
    // Count newlines (each typically gets its own token)
    const newlineCount = (text.match(/\n/g) || []).length
  
    // Count spaces (each typically gets its own token)
    const spaceCount = (text.match(/\s/g) || []).length
  
    // Combine the approaches for a balanced estimate
    // We take the average of character-based and word-based approaches,
    // then add additional tokens for punctuation, newlines, and spaces
    const combinedEstimate = Math.ceil((charBasedTokens + wordBasedTokens) / 2)
  
    // Ensure we don't double-count punctuation and spaces that were already
    // included in the character count
    const adjustedPunctuation = Math.ceil(punctuationCount * 0.5)
    const adjustedSpaces = Math.ceil(spaceCount * 0.5)
  
    // Final token count
    const tokenCount = combinedEstimate + adjustedPunctuation + newlineCount + adjustedSpaces
  
    // Ensure we return at least 1 token for any non-empty text
    return Math.max(1, tokenCount)
  }
  
  // Helper function to escape special characters in regex
  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }
  
  