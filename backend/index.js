// server.js
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import natural from "natural";
import stringSimilarity from "string-similarity";
import env from "dotenv";
import sent from "./sentences.js";

env.config();
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.API);
const tokenizer = new natural.WordTokenizer();

const sentences = sent;

app.get("/api/sentence", (req, res) => {
  const randomSentence =
    sentences[Math.floor(Math.random() * sentences.length)];
  res.json({
    sentence: randomSentence.marathi,
    fullAnswer: randomSentence.english,
  });
});

app.post("/api/check-accuracy", (req, res) => {
  const { userInput, correctAnswer } = req.body;

  if (!userInput || !correctAnswer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const userText = userInput.toLowerCase().trim();
  const correctText = correctAnswer.toLowerCase().trim();

  // Direct match
  if (userText === correctText) {
    return res.json({ accuracy: 100 });
  }

  // Calculate similarity
  const similarity = stringSimilarity.compareTwoStrings(userText, correctText);
  const accuracyScore = Math.round(similarity * 100);

  res.json({ accuracy: accuracyScore });
});

app.post("/api/similar-sentences", async (req, res) => {
  try {
    const { sentence } = req.body;

    if (!sentence) {
      return res.status(400).json({ error: "Sentence is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Given this English sentence: "${sentence}"
      Provide the following:
      1. Three similar sentences of increasing complexity
      2. A practical tip for sentence construction
      3. A contextual paragraph that naturally uses similar sentence structures and demonstrates practical usage.
      The paragraph should incorporate elements from the example sentences and feel natural in everyday conversation.
  
      Format your response exactly like this:
      SIMILAR1: [basic similar sentence]
      SIMILAR2: [intermediate similar sentence]
      SIMILAR3: [advanced similar sentence]
      TIP: [brief grammar or usage tip]
      CONTEXT: [natural paragraph using similar structures and demonstrating practical usage]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the response
    const similarSentences = {
      basic: response.match(/SIMILAR1: (.*)/)?.[1]?.trim() || "",
      intermediate: response.match(/SIMILAR2: (.*)/)?.[1]?.trim() || "",
      advanced: response.match(/SIMILAR3: (.*)/)?.[1]?.trim() || "",
    };

    const tip = response.match(/TIP: (.*)/)?.[1]?.trim() || "";
    const contextParagraph = response.match(/CONTEXT: (.*)/)?.[1]?.trim() || "";

    res.json({
      similarSentences: [
        similarSentences.basic,
        similarSentences.intermediate,
        similarSentences.advanced,
      ],
      tip,
      contextParagraph,
    });
  } catch (error) {
    console.error("Error generating similar sentences:", error);
    res.status(500).json({ error: "Failed to generate similar sentences" });
  }
});

// Grammar refinement endpoint
app.post("/api/refine-grammar", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Make the following text grammatically correct without changing its context. 
      Make it simple and use only simple and intermediate English words. 
      The goal is to make it clear and easy to understand while maintaining the original meaning.
      
      Original text: "${text}"
      
      Please provide only the corrected text without any explanations or additional comments.`;

    const result = await model.generateContent(prompt);
    const refinedText = result.response.text().trim();

    res.json({
      success: true,
      refinedText,
    });
  } catch (error) {
    console.error("Grammar refinement error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refine text",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
