function buildPrompt(question, chunks) {
  return `
Eres un asistente de soporte técnico.

REGLAS ESTRICTAS:
- SOLO puedes usar la información del manual
- SIEMPRE debes responder usando el manual si hay información relacionada
- NO puedes decir que no hay información si existe algo relevante
- NO inventes información
- Responde SIEMPRE en español

MANUAL:
${chunks.join("\n\n")}

PREGUNTA:
${question}

RESPUESTA:
`;
}

module.exports = { buildPrompt };
