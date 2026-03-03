require("dotenv").config();

const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const { findRelevantChunks } = require("./utils/retrieval");
const { buildPrompt } = require("./utils/prompt");

const app = express();

// Parse JSON
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Load manual
const manualText = fs.readFileSync("./manuals/manual.txt", "utf-8");
const chunks = manualText.split("\n\n");

// 🔥 DEBUG VERSION OF /chat
app.post("/chat", async (req, res) => {
  try {
    if (!req.body || !req.body.message) {
      return res.status(400).json({
        error: "Missing 'message' in request body",
        body: req.body,
      });
    }

    const { message } = req.body;

    const relevant = findRelevantChunks(message, chunks);
    const prompt = buildPrompt(message, relevant);

    const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    // 🔥 Return full debug info
    return res.json({
      debug: data,
      extracted:
        data?.candidates?.[0]?.content?.parts?.[0]?.text || null,
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

// Use Render port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
