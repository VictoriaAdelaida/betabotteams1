function buildPrompt(question, chunks) {
  return `
You are an IT support assistant.

STRICT RULES:
- Only answer based on the provided manual excerpts
- If the user greets you, say:
  "Hola, ¿Que problema estas teniendo?
- If the answer is not in the manuals, say:
  "No puedo encontrar información sobre este problema en el manual."
- Do NOT use external knowledge
- Do NOT guess

Manual excerpts:
${chunks.join("\n\n")}

User question:
${question}
`;
}

module.exports = { buildPrompt };
