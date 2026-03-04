require("dotenv").config();

const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const { findRelevantChunks } = require("./utils/retrieval");
const { buildPrompt } = require("./utils/prompt");

const app = express();

// 🔥 SESSION MEMORY (per user, resets on restart)
const sessions = {};

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

// 🔥 DEBUG: total chunks
console.log("TOTAL CHUNKS LOADED:", chunks.length);

// /chat endpoint
app.post("/chat", async (req, res) => {
  try {
    if (!req.body || !req.body.message || !req.body.sessionId) {
      return res.status(400).json({
        error: "Missing 'message' or 'sessionId' in request body",
      });
    }

    const { message, sessionId } = req.body;

    console.log("Incoming message:", JSON.stringify(message));
    console.log("Session ID:", sessionId);

    // 🔥 Initialize session
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        step: 1,
        lastMessage: ""
      };
    }

    const session = sessions[sessionId];

    console.log("SESSION BEFORE:", session);

    const lowerMsg = message.toLowerCase();

    // 🔥 IMPROVED progress detection
    const isProgress =
      /^(ok|okay|listo|hecho|ya|ya hice|ya lo hice|ya quedo|ya quedó|ya ingrese|ya ingresé|siguiente|continua|continúe|ahora que)/i.test(lowerMsg) ||
      lowerMsg.includes("siguiente") ||
      lowerMsg.includes("que sigue") ||
      lowerMsg.includes("ahora que");

    if (isProgress) {
      session.step += 1;
    }

    // 🔥 Prevent overflow
    if (session.step > chunks.length) {
      session.step = chunks.length;
    }

    // Save last message
    session.lastMessage = message;

    console.log("SESSION AFTER:", session);

    // 🔥 STEP CONTROL
    const stepIndex = session.step - 1;

    // 🔥 DEBUG CURRENT STEP
    console.log("CURRENT STEP INDEX:", stepIndex);
    console.log("CURRENT STEP CONTENT:", chunks[stepIndex]);

    const relevant = [
      chunks[stepIndex],
      chunks[stepIndex + 1] // optional context
    ].filter(Boolean);

    console.log("CHUNKS:", chunks);

    // 🔥 BETTER RELEVANT LOGGING
    relevant.forEach((chunk, i) => {
      console.log(`RELEVANT[${i}]:`, chunk);
    });

    // 🔥 FAILSAFE
    if (!relevant.length) {
      return res.json({
        reply: "No se encontró información para este paso."
      });
    }

    // 🔥 PROMPT
    const prompt = buildPrompt(
      message,
      relevant,
      session.step
    );

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
