require("dotenv").config();

const express = require("express");
const fs = require("fs");

const { findRelevantChunks } = require("./utils/retrieval");
const { buildPrompt } = require("./utils/prompt");

const app = express();

// ✅ Force JSON parsing
app.use(express.json());

// ✅ Health check route (very useful)
app.get("/", (req, res) => {
  res.send("API is running");
});

// Load manual
const manualText = fs.readFileSync("./manuals/manual.txt", "utf-8");
const chunks = manualText.split("\n\n");

// ✅ Safer route
app.post("/chat", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    // 🛡️ Prevent crash
    if (!req.body || !req.body.message) {
      return res.status(400).json({
        error: "Missing 'message' in request body",
      });
    }

    const { message } = req.body;

    const relevant = findRelevantChunks(message, chunks);
    const prompt = buildPrompt(message, relevant);

    const reply = await callGemini(prompt);

    res.json({ reply });

  } catch (err) {
    console.error("Route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Safer Gemini call
async function callGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    console.log("Gemini response:", JSON.stringify(data, null, 2));

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No valid response from model"
    );
  } catch (err) {
    console.error("Gemini error:", err);
    return "Error calling AI service";
  }
}

// ✅ Use Render port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
}

app.listen(3000, () => console.log("Server running on port 3000"));
