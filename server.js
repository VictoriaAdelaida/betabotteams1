require("dotenv").config();

const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const { findRelevantChunks } = require("./utils/retrieval");
const { buildPrompt } = require("./utils/prompt");

const app = express();

// 🔥 SIMPLE MEMORY (last message)
let lastMessage = "";

// Parse JSON
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Ensure API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in environment variables");
  process.exit(1);
}

// Load manual
const manualText = fs.readFileSync("./manuals/manual.txt", "utf-8");

// Windows-safe splitting
const chunks = manualText.split(/\r?\n\r?\n/);

// /chat endpoint
app.post("/chat", async (req, res) => {
  try {
    if (!req.body || !req.body.message) {
      return res.status(400).json({
        error: "Missing 'message' in request body",
      });
    }

    const { message } = req.body;
    console.log("Incoming message:", JSON.stringify(message));

    // 🔥 COMBINE WITH LAST MESSAGE (memory hack)
    const combinedMessage = lastMessage
      ? lastMessage + "\n" + message
      : message;

    console.log("COMBINED MESSAGE:", JSON.stringify(combinedMessage));

    // Save current message for next request
    lastMessage = message;

    const relevant = findRelevantChunks(combinedMessage, chunks);

    console.log("CHUNKS:", chunks);
    console.log("RELEVANT:", relevant);

    const prompt = buildPrompt(combinedMessage, relevant);

    console.log("========== PROMPT SENT ==========");
    console.log(prompt);
    console.log("================================");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    console.log("RAW DATA:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se encontró respuesta en el manual";

    return res.json({ reply });

  } catch (err) {
    console.error("🔥 Server error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Use Render port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
