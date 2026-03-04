function findRelevantChunks(query, chunks) {
  const lowerQuery = query.toLowerCase();

  const matched = chunks.filter(chunk => {
    const lowerChunk = chunk.toLowerCase();

    return lowerQuery
      .split(" ")
      .some(word => lowerChunk.includes(word));
  });

  // 🔥 ALWAYS include step 1 (first chunk)
  const firstStep = chunks[0];

  // Remove duplicates just in case
  const unique = [firstStep, ...matched].filter(
    (value, index, self) => self.indexOf(value) === index
  );

  // Limit size
  return unique.slice(0, 3);
}

module.exports = { findRelevantChunks };
