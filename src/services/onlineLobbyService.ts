import { OnlineLobbyData, OnlineChatMessage } from '../types';

type Listener<T> = (data: T) => void;

class OnlineLobbyClient {
  private ws: WebSocket | null = null;
  private roomCode: string | null = null;
  private playerId: string | null = null;
  private isConnecting: boolean = false;
  private pollInterval: any = null;
  private pingInterval: any = null;

  private lobbyListeners = new Set<Listener<OnlineLobbyData>>();
  private chatListeners = new Set<Listener<OnlineChatMessage>>();
  private colorDrawListeners = new Set<Listener<any>>();
  private gameStartListeners = new Set<Listener<OnlineLobbyData>>();
  private errorListeners = new Set<Listener<string>>();

  public getCurrentRoomCode(): string | null {
    return this.roomCode;
  }

  public getCurrentPlayerId(): string | null {
    return this.playerId;
  }

  public onLobbyUpdate(fn: Listener<OnlineLobbyData>) {
    this.lobbyListeners.add(fn);
    return () => this.lobbyListeners.delete(fn);
  }

  public onChat(fn: Listener<OnlineChatMessage>) {
    this.chatListeners.add(fn);
    return () => this.chatListeners.delete(fn);
  }

  public onColorDrawing(fn: Listener<any>) {
    this.colorDrawListeners.add(fn);
    return () => this.colorDrawListeners.delete(fn);
  }

  public onGameStarted(fn: Listener<OnlineLobbyData>) {
    this.gameStartListeners.add(fn);
    return () => this.gameStartListeners.delete(fn);
  }

  public onError(fn: Listener<string>) {
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }

  private emitLobbyUpdate(lobby: OnlineLobbyData) {
    this.lobbyListeners.forEach((fn) => fn(lobby));
  }

  private emitChat(msg: OnlineChatMessage) {
    this.chatListeners.forEach((fn) => fn(msg));
  }

  private emitColorDrawing(data: any) {
    this.colorDrawListeners.forEach((fn) => fn(data));
  }

  private emitGameStarted(lobby: OnlineLobbyData) {
    this.gameStartListeners.forEach((fn) => fn(lobby));
  }

  private emitError(err: string) {
    this.errorListeners.forEach((fn) => fn(err));
  }

  // Connects or re-connects the WebSocket connection
  public connectSocket(): Promise<WebSocket> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(this.ws);
    }

    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          this.ws = ws;
          // Start keepalive ping
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 20000);

          // If we have room and playerId, register
          if (this.roomCode && this.playerId) {
            this.ws.send(
              JSON.stringify({
                type: 'register',
                roomCode: this.roomCode,
                playerId: this.playerId,
              })
            );
          }
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'room_created':
              case 'join_result':
              case 'room_synced':
              case 'player_connected':
              case 'player_disconnected':
              case 'player_resigned':
              case 'draw_offered':
              case 'draw_accepted':
              case 'draw_declined':
              case 'rematch_requested':
              case 'rematch_started':
              case 'move_made': {
                if (data.lobby) {
                  this.emitLobbyUpdate(data.lobby);
                }
                break;
              }
              case 'color_drawing_started': {
                if (data.lobby) {
                  this.emitLobbyUpdate(data.lobby);
                }
                this.emitColorDrawing(data.lottery || data.lobby?.drawLottery);
                break;
              }
              case 'game_started': {
                if (data.lobby) {
                  this.emitLobbyUpdate(data.lobby);
                  this.emitGameStarted(data.lobby);
                }
                break;
              }
              case 'chat_message': {
                if (data.message) {
                  this.emitChat(data.message);
                }
                break;
              }
              case 'move_error': {
                this.emitError(data.error || 'Ungültiger Zug.');
                break;
              }
              default:
                break;
            }
          } catch (e) {
            console.warn('[Client WS parse error]', e);
          }
        };

        ws.onclose = () => {
          this.ws = null;
          // Auto start polling fallback if in an active room
          this.startPollingFallback();
        };

        ws.onerror = () => {
          this.ws = null;
          this.startPollingFallback();
          resolve(ws);
        };
      } catch (e) {
        this.startPollingFallback();
        resolve(null as any);
      }
    });
  }

  // Backup HTTP polling to ensure rock-solid connection even if WebSockets are briefly interrupted
  private startPollingFallback() {
    if (this.pollInterval || !this.roomCode) return;
    this.pollInterval = setInterval(async () => {
      if (!this.roomCode) return;
      try {
        const res = await fetch(`/api/lobby/${this.roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.lobby) {
            this.emitLobbyUpdate(data.lobby);
          }
        }
      } catch {
        // silent fallback
      }
    }, 1500);
  }

  private stopPollingFallback() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // 1. CREATE LOBBY
  public async createLobby(playerName: string): Promise<{ roomCode: string; playerId: string; lobby: OnlineLobbyData }> {
    await this.connectSocket();

    // Prefer HTTP for the initial creation to guarantee clean JSON response, then register socket
    const res = await fetch('/api/lobby/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });

    const data = await res.json();
    this.roomCode = data.roomCode;
    this.playerId = data.playerId;

    // Save locally for reconnect
    try {
      sessionStorage.setItem('chess_room_code', data.roomCode);
      sessionStorage.setItem('chess_player_id', data.playerId);
      sessionStorage.setItem('chess_player_name', playerName);
    } catch {}

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'register',
          roomCode: this.roomCode,
          playerId: this.playerId,
        })
      );
    }

    this.emitLobbyUpdate(data.lobby);
    return data;
  }

  // 2. JOIN LOBBY
  public async joinLobby(
    roomCode: string,
    playerName: string
  ): Promise<{ success: boolean; error?: string; playerId?: string; lobby?: OnlineLobbyData }> {
    await this.connectSocket();

    const cleanCode = roomCode.toUpperCase().trim();

    const res = await fetch('/api/lobby/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: cleanCode, name: playerName }),
    });

    const data = await res.json();
    if (data.success) {
      this.roomCode = cleanCode;
      this.playerId = data.playerId;

      try {
        sessionStorage.setItem('chess_room_code', cleanCode);
        sessionStorage.setItem('chess_player_id', data.playerId);
        sessionStorage.setItem('chess_player_name', playerName);
      } catch {}

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'register',
            roomCode: this.roomCode,
            playerId: this.playerId,
          })
        );
      }

      this.emitLobbyUpdate(data.lobby);
    }

    return data;
  }

  // Fetch current state
  public async fetchRoomState(roomCode?: string): Promise<OnlineLobbyData | null> {
    const code = roomCode || this.roomCode;
    if (!code) return null;

    try {
      const res = await fetch(`/api/lobby/${code}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.exists && data.lobby) {
        this.emitLobbyUpdate(data.lobby);
        return data.lobby;
      }
      return null;
    } catch {
      return null;
    }
  }

  // 3. MAKE A MOVE
  public async makeMove(from: string, to: string, promotion?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.roomCode || !this.playerId) {
      return { success: false, error: 'Keine aktive Lobby.' };
    }

    // Try WebSocket first
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'make_move',
          roomCode: this.roomCode,
          playerId: this.playerId,
          from,
          to,
          promotion,
        })
      );
      return { success: true };
    }

    // Fallback to HTTP
    const res = await fetch('/api/lobby/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: this.roomCode,
        playerId: this.playerId,
        from,
        to,
        promotion,
      }),
    });

    const data = await res.json();
    if (data.success && data.lobby) {
      this.emitLobbyUpdate(data.lobby);
    }
    return data;
  }

  // 4. GAME ACTIONS
  public async resign(): Promise<void> {
    this.sendAction('resign');
  }

  public async offerDraw(): Promise<void> {
    this.sendAction('offer_draw');
  }

  public async acceptDraw(): Promise<void> {
    this.sendAction('accept_draw');
  }

  public async declineDraw(): Promise<void> {
    this.sendAction('decline_draw');
  }

  public async requestRematch(): Promise<void> {
    this.sendAction('rematch');
  }

  public async sendChat(text: string): Promise<void> {
    this.sendAction('chat', { text });
  }

  private sendAction(action: string, extra?: any) {
    if (!this.roomCode || !this.playerId) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: action,
          roomCode: this.roomCode,
          playerId: this.playerId,
          ...extra,
        })
      );
      return;
    }

    // HTTP fallback
    fetch('/api/lobby/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: this.roomCode,
        playerId: this.playerId,
        action,
        ...extra,
      }),
    }).catch(console.warn);
  }

  public leaveLobby() {
    this.stopPollingFallback();
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.playerId = null;
    try {
      sessionStorage.removeItem('chess_room_code');
      sessionStorage.removeItem('chess_player_id');
    } catch {}
  }
}

export const onlineLobbyClient = new OnlineLobbyClient();
