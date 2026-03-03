const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ FIX: Parse JSON body
app.use(express.json());

// Optional: handle invalid JSON errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON:", err.message);
    return res.status(400).json({ reply: "Invalid JSON format" });
  }
  next();
});

app.post("/chat", async (req, res) => {
  try {
    if (!req.body || !req.body.message) {
      return res.status(400).json({
        error: "Missing 'message' in request body",
        body: req.body
      });
    }

    const { message } = req.body;

    const relevant = findRelevantChunks(message, chunks);
    const prompt = buildPrompt(message, relevant);

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

    // 🔥 RETURN EVERYTHING
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

    const data = await response.json();

    const reply =
      data.output?.[0]?.content?.[0]?.text ||
      "No response from AI";

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ reply: "Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
