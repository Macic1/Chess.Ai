import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  OnlineLobbyData,
  OnlinePlayer,
  PlayerColor,
} from '../types';
import { onlineLobbyClient } from '../services/onlineLobbyService';
import { PieceIcon } from './PieceIcon';
import {
  Users,
  Copy,
  Check,
  Sparkles,
  X,
  Shuffle,
  Globe,
  Loader2,
  Share2,
  Swords,
  Crown,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineGame: (lobby: OnlineLobbyData, myPlayerId: string) => void;
  initialRoomCode?: string;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartOnlineGame,
  initialRoomCode = '',
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('chess_saved_player_name') || '';
  });
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Active room state while inside lobby modal
  const [activeLobby, setActiveLobby] = useState<OnlineLobbyData | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  // Lottery animation states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawResult, setDrawResult] = useState<{
    myColor: PlayerColor;
    opponentColor: PlayerColor;
    opponentName: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  // Reset inputs when opening modal
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.toUpperCase());
      setTab('join');
    }
  }, [initialRoomCode]);

  // Subscribe to lobby updates
  useEffect(() => {
    if (!isOpen) return;

    const unsubLobby = onlineLobbyClient.onLobbyUpdate((lobby) => {
      setActiveLobby(lobby);
      const currentId = onlineLobbyClient.getCurrentPlayerId();
      if (currentId) {
        setMyPlayerId(currentId);
      }

      // If already playing and game started, transition to main board
      if (lobby.status === 'playing' && currentId) {
        onStartOnlineGame(lobby, currentId);
      }
    });

    const unsubDraw = onlineLobbyClient.onColorDrawing((lottery) => {
      setIsDrawing(true);
      const currentId = onlineLobbyClient.getCurrentPlayerId();
      if (currentId && lottery) {
        const isP1 = lottery.player1Id === currentId;
        const myColor = isP1 ? lottery.player1Color : lottery.player2Color;
        const oppColor = isP1 ? lottery.player2Color : lottery.player1Color;

        setTimeout(() => {
          setDrawResult({
            myColor,
            opponentColor: oppColor,
            opponentName: isP1 ? 'Mitspieler' : 'Host',
          });
        }, 1600);
      }
    });

    const unsubGameStart = onlineLobbyClient.onGameStarted((lobby) => {
      const currentId = onlineLobbyClient.getCurrentPlayerId();
      if (currentId) {
        // Start countdown to board
        setCountdown(3);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              onStartOnlineGame(lobby, currentId);
              return 0;
            }
            return prev - 1;
          });
        }, 800);
      }
    });

    const unsubError = onlineLobbyClient.onError((err) => {
      setErrorMessage(err);
      setIsLoading(false);
    });

    return () => {
      unsubLobby();
      unsubDraw();
      unsubGameStart();
      unsubError();
    };
  }, [isOpen, onStartOnlineGame]);

  if (!isOpen) return null;

  // Handle Create Lobby
  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const chosenName = playerName.trim() || 'Spieler 1';
    localStorage.setItem('chess_saved_player_name', chosenName);

    try {
      const res = await onlineLobbyClient.createLobby(chosenName);
      setActiveLobby(res.lobby);
      setMyPlayerId(res.playerId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Konnte keine Lobby erstellen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Join Lobby
  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Bitte gib einen 6-stelligen Raum-Code ein.');
      return;
    }

    setIsLoading(true);
    const chosenName = playerName.trim() || 'Spieler 2';
    localStorage.setItem('chess_saved_player_name', chosenName);

    try {
      const res = await onlineLobbyClient.joinLobby(cleanCode, chosenName);
      if (!res.success) {
        setErrorMessage(res.error || 'Fehler beim Beitreten der Lobby.');
      } else if (res.lobby && res.playerId) {
        setActiveLobby(res.lobby);
        setMyPlayerId(res.playerId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verbindung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeLobby?.roomCode) return;
    navigator.clipboard.writeText(activeLobby.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!activeLobby?.roomCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('join', activeLobby.roomCode);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLeaveLobby = () => {
    onlineLobbyClient.leaveLobby();
    setActiveLobby(null);
    setMyPlayerId(null);
    setIsDrawing(false);
    setDrawResult(null);
  };

  const playersList: OnlinePlayer[] = activeLobby
    ? (Object.values(activeLobby.players) as OnlinePlayer[])
    : [];
  const hostPlayer = playersList.find((p) => p.isHost);
  const guestPlayer = playersList.find((p) => !p.isHost);
  const myPlayer = myPlayerId && activeLobby ? activeLobby.players[myPlayerId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Online-Schach Lobby
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Live Multiplayer
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Lade Freunde per Code ein & loset automatisch die Farben aus
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (activeLobby) handleLeaveLobby();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* VIEW 1: NOT IN A ROOM YET (CREATE OR JOIN TABS) */}
          {!activeLobby ? (
            <div className="flex flex-col gap-5">
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-stone-950/60 p-1 border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setTab('create');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    tab === 'create'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lobby erstellen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('join');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    tab === 'join'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Mit Code beitreten</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-bold">Hinweis:</span> {errorMessage}
                </div>
              )}

              {/* TAB: CREATE LOBBY */}
              {tab === 'create' && (
                <form onSubmit={handleCreateLobby} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Dein Spielername
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="z.B. Magnus, Anna oder Großmeister"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-sm text-white placeholder-stone-600 transition"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-stone-300 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <Shuffle className="w-4 h-4" />
                      <span>Faire Zufalls-Auslosung:</span>
                    </div>
                    <p className="text-stone-400 leading-relaxed">
                      Sobald dein Mitspieler dem Raum beitritt, werden Weiß und Schwarz automatisch und völlig unparteiisch ausgelost. Danach startet sofort die Live-Partie!
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Erstelle Lobby...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Lobby generieren & Code erhalten</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB: JOIN LOBBY */}
              {tab === 'join' && (
                <form onSubmit={handleJoinLobby} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      6-stelliger Raum-Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="z.B. K7N9P2"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-base sm:text-lg font-mono tracking-widest text-center text-amber-400 placeholder-stone-600 uppercase transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Dein Spielername
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="z.B. Kasparov oder Gast"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-sm text-white placeholder-stone-600 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !roomCodeInput.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Trete Lobby bei...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Lobby beitreten & Auslosung starten</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* VIEW 2: INSIDE ACTIVE LOBBY */
            <div className="flex flex-col gap-6">
              {/* Big Room Code Presentation */}
              <div className="p-5 rounded-2xl bg-stone-950/80 border border-amber-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Dein Raum-Code für Mitspieler
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white my-1 selection:bg-amber-500">
                  {activeLobby.roomCode}
                </div>
                <p className="text-xs text-stone-400 mb-4">
                  Gib diesen Code an die zweite Person weiter oder kopiere den Direktlink
                </p>

                <div className="flex items-center gap-2 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-xs font-semibold text-stone-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Code kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Code kopieren</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-xs font-semibold text-stone-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Link kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Link kopieren</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 2 Player Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Slot 1: Host */}
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-base">
                      {hostPlayer ? hostPlayer.name.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">
                          {hostPlayer?.name || 'Host'}
                        </span>
                        {hostPlayer?.id === myPlayerId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-300">
                            Du
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>Lobby-Ersteller</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Bereit</span>
                  </div>
                </div>

                {/* Slot 2: Guest / Opponent */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    guestPlayer
                      ? 'bg-stone-950/60 border-stone-800/80'
                      : 'bg-stone-950/30 border-dashed border-stone-800'
                  } flex items-center justify-between`}
                >
                  {guestPlayer ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-base">
                          {guestPlayer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {guestPlayer.name}
                            </span>
                            {guestPlayer.id === myPlayerId && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-300">
                                Du
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-400">Mitspieler</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Verbunden</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center py-2 text-stone-500 text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Warte auf 2. Person...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DRAMATIC COLOR LOTTERY DISPLAY (FARBE AUSLOSEN) */}
              {(isDrawing || activeLobby.status === 'drawing_color') && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-stone-950 border border-amber-500/40 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden"
                >
                  {/* Subtle pulsing background glow */}
                  <div className="absolute inset-0 bg-radial from-amber-500/10 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Shuffle className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Farbauslosung aktiv
                      </span>
                    </div>

                    {/* Animated spinning coin flipping between White & Black */}
                    <div className="w-20 h-20 my-3 flex items-center justify-center relative">
                      <motion.div
                        animate={{ rotateY: [0, 180, 360, 540, 720] }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                        className="w-16 h-16 rounded-full border-2 border-amber-400 flex items-center justify-center shadow-lg bg-stone-900"
                      >
                        {drawResult ? (
                          <PieceIcon
                            type="k"
                            color={drawResult.myColor}
                            className="w-10 h-10 drop-shadow"
                          />
                        ) : (
                          <div className="flex items-center">
                            <PieceIcon type="k" color="w" className="w-7 h-7" />
                            <PieceIcon type="k" color="b" className="w-7 h-7" />
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {drawResult ? (
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <span className="text-xs text-stone-400">Auslosungsergebnis:</span>
                        <div className="text-xl font-black text-white flex items-center gap-2">
                          <span>Du spielst mit</span>
                          <span
                            className={`px-3 py-1 rounded-xl font-black ${
                              drawResult.myColor === 'w'
                                ? 'bg-stone-100 text-stone-950'
                                : 'bg-stone-950 text-white border border-stone-700'
                            }`}
                          >
                            {drawResult.myColor === 'w' ? 'WEISS ⚪' : 'SCHWARZ ⚫'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 mt-2 font-bold animate-pulse">
                          Partie startet in {countdown} Sekunden...
                        </p>
                      </motion.div>
                    ) : (
                      <p className="text-xs text-stone-300">
                        Das Schicksal entscheidet... Wer zieht zuerst?
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Waiting Status text when alone */}
              {!guestPlayer && !isDrawing && (
                <div className="text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Sobald die 2. Person den Code eingibt, werden die Farben ausgelost.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleLeaveLobby}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  Lobby verlassen
                </button>

                {guestPlayer && !isDrawing && activeLobby.status === 'waiting' && (
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger draw manually if needed
                      onlineLobbyClient.connectSocket();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Jetzt auslosen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
