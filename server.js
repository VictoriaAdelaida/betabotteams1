const express = require("express");
const fs = require("fs");
const { findRelevantChunks } = require("./utils/retrieval");
const { buildPrompt } = require("./utils/prompt");

const app = express();
app.use(express.json());

// Load manual
const manualText = fs.readFileSync("./manuals/manual.txt", "utf-8");
const chunks = manualText.split("\n\n"); // simple split

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const relevant = findRelevantChunks(message, chunks);
  const prompt = buildPrompt(message, relevant);

  const reply = await callGemini(prompt);

  res.json({ reply });
});

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
}

app.listen(3000, () => console.log("Server running on port 3000"));