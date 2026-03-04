function findRelevantChunks(query, chunks) {
  const lowerQuery = query.toLowerCase();

  const queryWords = lowerQuery.split(" ").filter(w => w.length > 2);

  const scored = chunks.map(chunk => {
    const lowerChunk = chunk.toLowerCase();

    let score = 0;

    queryWords.forEach(word => {
      if (lowerChunk.includes(word)) score++;
    });

    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.chunk);
}

module.exports = { findRelevantChunks };
