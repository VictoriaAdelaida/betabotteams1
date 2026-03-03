function findRelevantChunks(question, chunks) {
  const words = question.toLowerCase().split(" ");

  return chunks
    .map(chunk => ({
      text: chunk,
      score: words.filter(w => chunk.toLowerCase().includes(w)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.text);
}

module.exports = { findRelevantChunks };