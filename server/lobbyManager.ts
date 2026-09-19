import { WebSocket } from "ws";
import { Chess } from "chess.js";
import {
  OnlineLobbyData,
  OnlinePlayer,
  PlayerColor,
  PieceType,
  MoveRecord,
  OnlineChatMessage,
} from "../src/types";

interface ServerPlayer {
  id: string;
  name: string;
  color?: PlayerColor;
  isHost: boolean;
  connected: boolean;
  socket: WebSocket | null;
}

interface ServerRoom {
  roomCode: string;
  hostId: string;
  createdAt: number;
  players: Map<string, ServerPlayer>;
  game: Chess;
  status: 'waiting' | 'drawing_color' | 'playing' | 'game_over';
  history: MoveRecord[];
  lastMove?: { from: string; to: string; san?: string };
  capturedPieces: { w: PieceType[]; b: PieceType[] };
  winner?: PlayerColor | 'draw' | null;
  winReason?: string;
  rematchRequestedBy: Set<string>;
  drawOfferedBy: string | null;
  drawLottery?: {
    player1Id: string;
    player2Id: string;
    player1Color: PlayerColor;
    player2Color: PlayerColor;
    finishedAt: number;
  };
  chatMessages: OnlineChatMessage[];
}

class LobbyManager {
  private rooms = new Map<string, ServerRoom>();
  private socketToRoom = new Map<WebSocket, { roomCode: string; playerId: string }>();

  constructor() {
    // Periodic cleanup of abandoned rooms older than 4 hours
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.createdAt > 4 * 60 * 60 * 1000) {
          this.rooms.delete(code);
        }
      }
    }, 15 * 60 * 1000);
  }

  // Generates 6-character clean room codes (e.g. "K7N9P2")
  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let attempts = 0; attempts < 100; attempts++) {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!this.rooms.has(code)) return code;
    }
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  public getRoom(roomCode: string): ServerRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  public toPublicLobbyData(room: ServerRoom): OnlineLobbyData {
    const publicPlayers: Record<string, OnlinePlayer> = {};
    for (const [id, p] of room.players.entries()) {
      publicPlayers[id] = {
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.isHost,
        connected: p.connected,
        ready: true,
      };
    }

    return {
      id: room.roomCode,
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: publicPlayers,
      status: room.status,
      fen: room.game.fen(),
      history: room.history,
      turn: room.game.turn() as PlayerColor,
      lastMove: room.lastMove,
      capturedPieces: room.capturedPieces,
      inCheck: room.game.inCheck(),
      winner: room.winner,
      winReason: room.winReason,
      rematchRequestedBy: Array.from(room.rematchRequestedBy),
      drawOfferedBy: room.drawOfferedBy,
      drawLottery: room.drawLottery,
    };
  }

  public createRoom(
    hostName: string,
    socket: WebSocket | null
  ): { roomCode: string; playerId: string; lobby: OnlineLobbyData } {
    const roomCode = this.generateRoomCode();
    const hostId = this.generateId();
    const cleanName = hostName.trim().slice(0, 20) || "Spieler 1 (Host)";

    const hostPlayer: ServerPlayer = {
      id: hostId,
      name: cleanName,
      isHost: true,
      connected: true,
      socket,
    };

    const playersMap = new Map<string, ServerPlayer>();
    playersMap.set(hostId, hostPlayer);

    const room: ServerRoom = {
      roomCode,
      hostId,
      createdAt: Date.now(),
      players: playersMap,
      game: new Chess(),
      status: "waiting",
      history: [],
      capturedPieces: { w: [], b: [] },
      rematchRequestedBy: new Set(),
      drawOfferedBy: null,
      chatMessages: [
        {
          id: this.generateId(),
          senderId: "system",
          senderName: "Arena",
          text: `Lobby #${roomCode} erstellt. Teile den Code mit einem Mitspieler!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ],
    };

    this.rooms.set(roomCode, room);

    if (socket) {
      this.socketToRoom.set(socket, { roomCode, playerId: hostId });
    }

    return {
      roomCode,
      playerId: hostId,
      lobby: this.toPublicLobbyData(room),
    };
  }

  public joinRoom(
    roomCodeRaw: string,
    guestName: string,
    socket: WebSocket | null
  ): { success: boolean; error?: string; playerId?: string; lobby?: OnlineLobbyData } {
    const roomCode = roomCodeRaw.toUpperCase().trim();
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: `Keine Lobby mit Code "${roomCode}" gefunden.` };
    }

    // Check if room already has 2 players
    if (room.players.size >= 2) {
      return { success: false, error: "Diese Lobby ist bereits voll (maximal 2 Spieler)." };
    }

    const guestId = this.generateId();
    const cleanName = guestName.trim().slice(0, 20) || "Spieler 2 (Gast)";

    const guestPlayer: ServerPlayer = {
      id: guestId,
      name: cleanName,
      isHost: false,
      connected: true,
      socket,
    };

    room.players.set(guestId, guestPlayer);

    if (socket) {
      this.socketToRoom.set(socket, { roomCode, playerId: guestId });
    }

    room.chatMessages.push({
      id: this.generateId(),
      senderId: "system",
      senderName: "Arena",
      text: `${cleanName} ist der Lobby beigetreten! Farbe wird ausgelost...`,
      timestamp: Date.now(),
      isSystem: true,
    });

    // 2 players are in the room! Trigger the color lottery (Farbe auslosen)
    this.triggerColorLottery(room);

    return {
      success: true,
      playerId: guestId,
      lobby: this.toPublicLobbyData(room),
    };
  }

  // Trigger random color drawing between the 2 players
  private triggerColorLottery(room: ServerRoom) {
    const playersList = Array.from(room.players.values());
    if (playersList.length < 2) return;

    const p1 = playersList[0];
    const p2 = playersList[1];

    // True random draw: 50% chance for p1 White / p2 Black or vice versa
    const isP1White = Math.random() < 0.5;
    const p1Color: PlayerColor = isP1White ? "w" : "b";
    const p2Color: PlayerColor = isP1White ? "b" : "w";

    p1.color = p1Color;
    p2.color = p2Color;

    room.status = "drawing_color";
    room.drawLottery = {
      player1Id: p1.id,
      player2Id: p2.id,
      player1Color: p1Color,
      player2Color: p2Color,
      finishedAt: Date.now() + 2800, // 2.8 seconds dramatic reveal animation
    };

    // Broadcast lottery animation start
    this.broadcast(room, {
      type: "color_drawing_started",
      lobby: this.toPublicLobbyData(room),
      lottery: room.drawLottery,
    });

    // Automatically transition to active gameplay after animation time
    setTimeout(() => {
      if (room.status === "drawing_color") {
        room.status = "playing";
        room.chatMessages.push({
          id: this.generateId(),
          senderId: "system",
          senderName: "Arena",
          text: `Auslosung beendet: ${p1.name} spielt ${p1Color === 'w' ? 'Weiß ⚪' : 'Schwarz ⚫'}, ${p2.name} spielt ${p2Color === 'w' ? 'Weiß ⚪' : 'Schwarz ⚫'}. Die Partie beginnt!`,
          timestamp: Date.now(),
          isSystem: true,
        });

        this.broadcast(room, {
          type: "game_started",
          lobby: this.toPublicLobbyData(room),
        });
      }
    }, 2800);
  }

  public registerSocket(socket: WebSocket, roomCode: string, playerId: string) {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.socket = socket;
    player.connected = true;
    this.socketToRoom.set(socket, { roomCode: room.roomCode, playerId });

    this.broadcast(room, {
      type: "player_connected",
      playerId,
      lobby: this.toPublicLobbyData(room),
    });

    return true;
  }

  public handleSocketDisconnect(socket: WebSocket) {
    const mapping = this.socketToRoom.get(socket);
    if (!mapping) return;

    this.socketToRoom.delete(socket);
    const { roomCode, playerId } = mapping;
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (player && player.socket === socket) {
      player.connected = false;
      player.socket = null;

      this.broadcast(room, {
        type: "player_disconnected",
        playerId,
        lobby: this.toPublicLobbyData(room),
      });
    }
  }

  public makeMove(
    roomCode: string,
    playerId: string,
    from: string,
    to: string,
    promotion?: string
  ): { success: boolean; error?: string; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return { success: false, error: "Lobby nicht gefunden." };

    if (room.status !== "playing") {
      return { success: false, error: "Partie ist derzeit nicht aktiv." };
    }

    const player = room.players.get(playerId);
    if (!player) return { success: false, error: "Spieler nicht in der Lobby." };

    const turn = room.game.turn() as PlayerColor;
    if (player.color !== turn) {
      return { success: false, error: "Du bist derzeit nicht am Zug." };
    }

    try {
      const pieceOnTo = room.game.get(to as any);
      const moveResult = room.game.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!moveResult) {
        return { success: false, error: "Ungültiger Schachzug." };
      }

      // Record capture if any
      if (pieceOnTo) {
        const capturingColor = turn;
        room.capturedPieces[capturingColor].push(pieceOnTo.type as PieceType);
      } else if (moveResult.captured) {
        // En passant
        room.capturedPieces[turn].push(moveResult.captured as PieceType);
      }

      const moveRecord: MoveRecord = {
        san: moveResult.san,
        from: moveResult.from,
        to: moveResult.to,
        piece: moveResult.piece as PieceType,
        color: turn,
        captured: moveResult.captured as PieceType | undefined,
        promotion: moveResult.promotion as PieceType | undefined,
        fenAfter: room.game.fen(),
      };

      room.history.push(moveRecord);
      room.lastMove = { from: moveResult.from, to: moveResult.to, san: moveResult.san };
      room.drawOfferedBy = null; // Clear draw offer when a move is made

      // Check game over
      if (room.game.isGameOver()) {
        room.status = "game_over";
        if (room.game.isCheckmate()) {
          room.winner = turn; // player who just moved delivered checkmate
          room.winReason = `Schachmatt! ${player.name} gewinnt durch ein meisterhaftes Matt.`;
        } else if (room.game.isDraw()) {
          room.winner = "draw";
          if (room.game.isStalemate()) {
            room.winReason = "Remis durch Patt!";
          } else if (room.game.isThreefoldRepetition()) {
            room.winReason = "Remis durch 3-fache Stellungswiederholung!";
          } else if (room.game.isInsufficientMaterial()) {
            room.winReason = "Remis durch unzureichendes Material!";
          } else {
            room.winReason = "Remis durch 50-Züge-Regel!";
          }
        }
      }

      const updatedLobby = this.toPublicLobbyData(room);

      // Broadcast move event
      this.broadcast(room, {
        type: "move_made",
        move: moveRecord,
        lobby: updatedLobby,
      });

      return { success: true, lobby: updatedLobby };
    } catch (err: any) {
      return { success: false, error: err.message || "Fehler beim Ausführen des Zugs." };
    }
  }

  public resign(roomCode: string, playerId: string): { success: boolean; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room || room.status !== "playing") return { success: false };

    const player = room.players.get(playerId);
    if (!player || !player.color) return { success: false };

    const opponentColor: PlayerColor = player.color === "w" ? "b" : "w";
    const opponent = Array.from(room.players.values()).find((p) => p.color === opponentColor);

    room.status = "game_over";
    room.winner = opponentColor;
    room.winReason = `${player.name} hat aufgegeben. ${opponent?.name || "Gegner"} gewinnt!`;

    const lobby = this.toPublicLobbyData(room);
    this.broadcast(room, {
      type: "player_resigned",
      resignedPlayerId: playerId,
      lobby,
    });

    return { success: true, lobby };
  }

  public offerDraw(roomCode: string, playerId: string): { success: boolean; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room || room.status !== "playing") return { success: false };

    room.drawOfferedBy = playerId;
    const player = room.players.get(playerId);

    room.chatMessages.push({
      id: this.generateId(),
      senderId: "system",
      senderName: "Arena",
      text: `${player?.name || "Ein Spieler"} hat ein Remis (Unentschieden) angeboten.`,
      timestamp: Date.now(),
      isSystem: true,
    });

    const lobby = this.toPublicLobbyData(room);
    this.broadcast(room, {
      type: "draw_offered",
      offeredByPlayerId: playerId,
      lobby,
    });

    return { success: true, lobby };
  }

  public acceptDraw(roomCode: string, playerId: string): { success: boolean; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room || room.status !== "playing" || !room.drawOfferedBy) return { success: false };

    room.status = "game_over";
    room.winner = "draw";
    room.winReason = "Beide Spieler haben sich einvernehmlich auf Remis geeinigt.";
    room.drawOfferedBy = null;

    const lobby = this.toPublicLobbyData(room);
    this.broadcast(room, {
      type: "draw_accepted",
      lobby,
    });

    return { success: true, lobby };
  }

  public declineDraw(roomCode: string, playerId: string): { success: boolean; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return { success: false };

    room.drawOfferedBy = null;
    const player = room.players.get(playerId);

    room.chatMessages.push({
      id: this.generateId(),
      senderId: "system",
      senderName: "Arena",
      text: `${player?.name || "Ein Spieler"} hat das Remis-Angebot abgelehnt. Die Partie geht weiter!`,
      timestamp: Date.now(),
      isSystem: true,
    });

    const lobby = this.toPublicLobbyData(room);
    this.broadcast(room, {
      type: "draw_declined",
      lobby,
    });

    return { success: true, lobby };
  }

  public requestRematch(roomCode: string, playerId: string): { success: boolean; lobby?: OnlineLobbyData } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return { success: false };

    room.rematchRequestedBy.add(playerId);
    const player = room.players.get(playerId);

    const playersList = Array.from(room.players.values());

    // If both players agreed to rematch: swap colors and start new game!
    if (playersList.length === 2 && room.rematchRequestedBy.size === 2) {
      room.rematchRequestedBy.clear();
      room.game = new Chess();
      room.history = [];
      room.capturedPieces = { w: [], b: [] };
      room.lastMove = undefined;
      room.winner = undefined;
      room.winReason = undefined;
      room.drawOfferedBy = null;

      // Swap colors!
      const p1 = playersList[0];
      const p2 = playersList[1];
      const tempColor = p1.color;
      p1.color = p2.color;
      p2.color = tempColor;

      room.status = "playing";

      room.chatMessages.push({
        id: this.generateId(),
        senderId: "system",
        senderName: "Arena",
        text: `Revanche angenommen! Die Farben wurden getauscht. ${p1.name} ist ${p1.color === 'w' ? 'Weiß' : 'Schwarz'}, ${p2.name} ist ${p2.color === 'w' ? 'Weiß' : 'Schwarz'}.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      const lobby = this.toPublicLobbyData(room);
      this.broadcast(room, {
        type: "rematch_started",
        lobby,
      });
      return { success: true, lobby };
    }

    room.chatMessages.push({
      id: this.generateId(),
      senderId: "system",
      senderName: "Arena",
      text: `${player?.name || "Ein Spieler"} bittet um eine Revanche.`,
      timestamp: Date.now(),
      isSystem: true,
    });

    const lobby = this.toPublicLobbyData(room);
    this.broadcast(room, {
      type: "rematch_requested",
      requestedByPlayerId: playerId,
      lobby,
    });

    return { success: true, lobby };
  }

  public sendChatMessage(
    roomCode: string,
    playerId: string,
    text: string
  ): { success: boolean; message?: OnlineChatMessage } {
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return { success: false };

    const player = room.players.get(playerId);
    if (!player) return { success: false };

    const cleanText = text.trim().slice(0, 100);
    if (!cleanText) return { success: false };

    const msg: OnlineChatMessage = {
      id: this.generateId(),
      senderId: playerId,
      senderName: player.name,
      text: cleanText,
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    this.broadcast(room, {
      type: "chat_message",
      message: msg,
    });

    return { success: true, message: msg };
  }

  public broadcast(room: ServerRoom, payload: any) {
    const data = JSON.stringify(payload);
    for (const player of room.players.values()) {
      if (player.socket && player.socket.readyState === WebSocket.OPEN) {
        try {
          player.socket.send(data);
        } catch (e) {
          console.warn("[WebSocket Broadcast Error]", e);
        }
      }
    }
  }
}

export const lobbyManager = new LobbyManager();
