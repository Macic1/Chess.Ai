import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Rate-limit & quota cooldown tracking
let quotaCooldownUntil = 0;
let lastCommentaryTimestamp = 0;
const MIN_COMMENTARY_INTERVAL_MS = 8000;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    isQuotaLimited: Date.now() < quotaCooldownUntil,
  });
});

// AI Enemy commentary & dialogue endpoint
app.post("/api/gemini/commentary", async (req, res) => {
  try {
    const {
      enemyName,
      enemyPersona,
      enemyDifficulty,
      fen,
      lastMove,
      playerColor,
      isCheck,
      isCheckmate,
      isDraw,
      moveCount,
      capturedPiece,
    } = req.body;

    const now = Date.now();

    // If currently in a quota cooldown window, skip remote call and use local character engine
    if (now < quotaCooldownUntil) {
      return res.status(200).json({
        commentary: null,
        quotaLimited: true,
        message: "Quota cooldown active. Using local dynamic enemy personality dialogue.",
      });
    }

    // Throttle frequency to conserve quota
    if (now - lastCommentaryTimestamp < MIN_COMMENTARY_INTERVAL_MS && !isCheckmate && !isDraw) {
      return res.status(200).json({
        commentary: null,
        throttled: true,
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        commentary: null,
        message: "Gemini API key not configured. Using dynamic built-in enemy dialogue.",
      });
    }

    const situationDescription = isCheckmate
      ? "The game has just ended in CHECKMATE!"
      : isCheck
      ? "A King is in CHECK!"
      : isDraw
      ? "The game is a DRAW / STALEMATE!"
      : capturedPiece
      ? `A piece (${capturedPiece}) was just captured!`
      : `Move #${moveCount} just played: ${lastMove || "game start"}.`;

    const prompt = `You are roleplaying as "${enemyName}" in a live chess match.
Character background: ${enemyPersona}
Difficulty level: ${enemyDifficulty}
Current Board FEN: ${fen}
Player is playing as: ${playerColor}
Latest event: ${situationDescription}

Respond with a single, concise, punchy in-character quote (1-2 short sentences maximum, under 25 words).
Be highly expressive, thematic to your persona, and directly react to the board position or move.
Do NOT output hashtags, quotation marks, or meta notes. Just speak directly to your human opponent.`;

    lastCommentaryTimestamp = now;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });

    const commentary = response.text?.trim().replace(/^["']|["']$/g, "") || "";
    return res.json({ commentary });
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    const isQuotaOrRateLimit =
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.status === 429 ||
      error?.code === 429 ||
      errorStr.includes("429") ||
      errorStr.includes("quota") ||
      errorStr.includes("RESOURCE_EXHAUSTED") ||
      errorStr.includes("rate-limits");

    if (isQuotaOrRateLimit) {
      // Cooldown for 30 seconds to allow quota window to reset without hammering
      quotaCooldownUntil = Date.now() + 30000;
      console.log(
        `[Gemini API] Quota limit active for 30s. Seamlessly serving built-in persona dialogues.`
      );
      return res.status(200).json({
        commentary: null,
        quotaLimited: true,
        fallback: true,
      });
    }

    console.warn("[Gemini API] Commentary notice:", errorStr.slice(0, 100));
    return res.status(200).json({
      commentary: null,
      fallback: true,
    });
  }
});

// Tactical Hint endpoint
app.post("/api/gemini/hint", async (req, res) => {
  try {
    const { fen, turn, legalMoves, bestMoveSan } = req.body;
    const now = Date.now();

    if (now < quotaCooldownUntil) {
      return res.status(200).json({
        hint: `Betrachte ${bestMoveSan || "das Zentrumsspiel"}. Entwickelt die Figuren harmonisch und stärkt die Königsstellung.`,
        quotaLimited: true,
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        hint: `Betrachte ${bestMoveSan || "das Zentrumsspiel"}. Entwickelt die Figuren harmonisch und stärkt die Königsstellung.`,
      });
    }

    const prompt = `You are a friendly chess grandmaster coach.
Current FEN: ${fen}
Turn to move: ${turn === "w" ? "White" : "Black"}
A solid candidate move found by engine is: ${bestMoveSan}
Candidate legal moves count: ${legalMoves?.length || "several"}

Provide a brief, encouraging coaching hint in German (1-2 sentences, max 25 words) explaining the strategic idea behind playing ${bestMoveSan} (e.g. piece development, king safety, central control, or tactical pressure).
Do NOT be overly verbose. Directly explain the idea.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const hint = response.text?.trim() || `Betrachte den Zug ${bestMoveSan}.`;
    return res.json({ hint });
  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    const isQuotaOrRateLimit =
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.status === 429 ||
      error?.code === 429 ||
      errorStr.includes("429") ||
      errorStr.includes("quota") ||
      errorStr.includes("RESOURCE_EXHAUSTED");

    if (isQuotaOrRateLimit) {
      quotaCooldownUntil = Date.now() + 30000;
      console.log("[Gemini API] Quota limit active on hint. Providing strategic engine hint.");
    } else {
      console.warn("[Gemini API] Hint notice:", errorStr.slice(0, 100));
    }

    return res.status(200).json({
      hint: `Betrachte ${req.body.bestMoveSan || "Figurenentwicklung"}. Stärkt die Koordination und kontrolliert zentrale Felder.`,
      fallback: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
