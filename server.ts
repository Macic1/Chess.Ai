import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { lobbyManager } from "./server/lobbyManager";

dotenv.config();

// Safe resolution compatible with both tsx (ESM) and bundled dist/server.cjs (CJS)
const safeDirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : typeof import.meta?.url === "string"
    ? path.dirname(fileURLToPath(import.meta.url))
    : process.cwd();

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

// Resilient Gemini text generation with model fallback and high-demand handling
async function generateTextWithGemini(
  ai: GoogleGenAI,
  prompt: string,
  temperature: number = 0.8
): Promise<{ text: string | null; isHighDemandOrQuota: boolean }> {
  const models = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { temperature },
      });
      const text = response.text?.trim();
      if (text) {
        return { text, isHighDemandOrQuota: false };
      }
    } catch (err: any) {
      const errStr = String(err?.message || err || "");
      const isOverloadedOrQuota =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === "UNAVAILABLE" ||
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.status === 429 ||
        err?.code === 429 ||
        errStr.includes("503") ||
        errStr.includes("high demand") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("429") ||
        errStr.includes("quota") ||
        errStr.includes("rate-limit") ||
        errStr.includes("overloaded");

      if (isOverloadedOrQuota) {
        continue;
      }
      return { text: null, isHighDemandOrQuota: false };
    }
  }
  return { text: null, isHighDemandOrQuota: true };
}

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

    // If currently in a cooldown window, seamlessly use local character engine
    if (now < quotaCooldownUntil) {
      return res.status(200).json({
        commentary: null,
        quotaLimited: true,
        fallback: true,
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
        fallback: true,
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

    const { text, isHighDemandOrQuota } = await generateTextWithGemini(ai, prompt, 0.9);

    if (isHighDemandOrQuota) {
      quotaCooldownUntil = Date.now() + 25000;
      return res.status(200).json({
        commentary: null,
        quotaLimited: true,
        fallback: true,
      });
    }

    const commentary = text ? text.replace(/^["']|["']$/g, "") : null;
    return res.json({ commentary });
  } catch (_error: any) {
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
        fallback: true,
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        hint: `Betrachte ${bestMoveSan || "das Zentrumsspiel"}. Entwickelt die Figuren harmonisch und stärkt die Königsstellung.`,
        fallback: true,
      });
    }

    const prompt = `You are a friendly chess grandmaster coach.
Current FEN: ${fen}
Turn to move: ${turn === "w" ? "White" : "Black"}
A solid candidate move found by engine is: ${bestMoveSan}
Candidate legal moves count: ${legalMoves?.length || "several"}

Provide a brief, encouraging coaching hint in German (1-2 sentences, max 25 words) explaining the strategic idea behind playing ${bestMoveSan} (e.g. piece development, king safety, central control, or tactical pressure).
Do NOT be overly verbose. Directly explain the idea.`;

    const { text, isHighDemandOrQuota } = await generateTextWithGemini(ai, prompt, 0.7);

    if (isHighDemandOrQuota) {
      quotaCooldownUntil = Date.now() + 25000;
    }

    const hint = text || `Betrachte ${bestMoveSan || "Figurenentwicklung"}. Stärkt die Koordination und kontrolliert zentrale Felder.`;
    return res.json({ hint });
  } catch (_error: any) {
    return res.status(200).json({
      hint: `Betrachte ${req.body?.bestMoveSan || "Figurenentwicklung"}. Stärkt die Koordination und kontrolliert zentrale Felder.`,
      fallback: true,
    });
  }
});

// --- LOBBY REST API (Provides instant fallback and status queries) ---
app.post("/api/lobby/create", (req, res) => {
  const { name } = req.body;
  const result = lobbyManager.createRoom(name || "Host", null);
  res.json(result);
});

app.post("/api/lobby/join", (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode) {
    return res.status(400).json({ success: false, error: "Code erforderlich." });
  }
  const result = lobbyManager.joinRoom(roomCode, name || "Gast", null);
  res.json(result);
});

app.get("/api/lobby/:roomCode", (req, res) => {
  const roomCode = req.params.roomCode;
  const room = lobbyManager.getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ exists: false, error: "Lobby nicht gefunden." });
  }
  res.json({
    exists: true,
    lobby: lobbyManager.toPublicLobbyData(room),
    chatMessages: room.chatMessages,
  });
});

app.post("/api/lobby/move", (req, res) => {
  const { roomCode, playerId, from, to, promotion } = req.body;
  const result = lobbyManager.makeMove(roomCode, playerId, from, to, promotion);
  res.json(result);
});

app.post("/api/lobby/action", (req, res) => {
  const { roomCode, playerId, action, text } = req.body;
  switch (action) {
    case "resign":
      return res.json(lobbyManager.resign(roomCode, playerId));
    case "offer_draw":
      return res.json(lobbyManager.offerDraw(roomCode, playerId));
    case "accept_draw":
      return res.json(lobbyManager.acceptDraw(roomCode, playerId));
    case "decline_draw":
      return res.json(lobbyManager.declineDraw(roomCode, playerId));
    case "rematch":
      return res.json(lobbyManager.requestRematch(roomCode, playerId));
    case "chat":
      return res.json(lobbyManager.sendChatMessage(roomCode, playerId, text || ""));
    default:
      return res.status(400).json({ success: false, error: "Unbekannte Aktion." });
  }
});

async function startServer() {
  const server = http.createServer(app);

  // Dedicated WebSocket Server for Chess Multiplayer Lobbies
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      if (url.pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
      // Non-/ws upgrades are handled by Vite if running in dev
    } catch (e) {
      console.warn("[Upgrade error]", e);
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        switch (msg.type) {
          case "create_room": {
            const result = lobbyManager.createRoom(msg.name, ws);
            ws.send(JSON.stringify({ type: "room_created", ...result }));
            break;
          }
          case "join_room": {
            const result = lobbyManager.joinRoom(msg.roomCode, msg.name, ws);
            ws.send(JSON.stringify({ type: "join_result", ...result }));
            break;
          }
          case "register": {
            lobbyManager.registerSocket(ws, msg.roomCode, msg.playerId);
            const room = lobbyManager.getRoom(msg.roomCode);
            if (room) {
              ws.send(
                JSON.stringify({
                  type: "room_synced",
                  lobby: lobbyManager.toPublicLobbyData(room),
                  chatMessages: room.chatMessages,
                })
              );
            }
            break;
          }
          case "make_move": {
            const result = lobbyManager.makeMove(
              msg.roomCode,
              msg.playerId,
              msg.from,
              msg.to,
              msg.promotion
            );
            if (!result.success) {
              ws.send(JSON.stringify({ type: "move_error", error: result.error }));
            }
            break;
          }
          case "resign": {
            lobbyManager.resign(msg.roomCode, msg.playerId);
            break;
          }
          case "offer_draw": {
            lobbyManager.offerDraw(msg.roomCode, msg.playerId);
            break;
          }
          case "accept_draw": {
            lobbyManager.acceptDraw(msg.roomCode, msg.playerId);
            break;
          }
          case "decline_draw": {
            lobbyManager.declineDraw(msg.roomCode, msg.playerId);
            break;
          }
          case "rematch": {
            lobbyManager.requestRematch(msg.roomCode, msg.playerId);
            break;
          }
          case "chat": {
            lobbyManager.sendChatMessage(msg.roomCode, msg.playerId, msg.text);
            break;
          }
          case "ping": {
            ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.warn("[WS message parse error]", err);
      }
    });

    ws.on("close", () => {
      lobbyManager.handleSocketDisconnect(ws);
    });

    ws.on("error", (err) => {
      console.warn("[WS error]", err);
      lobbyManager.handleSocketDisconnect(ws);
    });
  });

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (HTTP & WebSocket)`);
  });
}

startServer();
