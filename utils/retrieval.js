function findRelevantChunks(query, chunks) {
  const lowerQuery = query.toLowerCase();

  return chunks.filter(chunk => {
    const lowerChunk = chunk.toLowerCase();

    return lowerQuery
      .split(" ")
      .some(word => lowerChunk.includes(word));
  }).slice(0, 3);
}
