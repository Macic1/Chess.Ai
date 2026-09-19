import React, { useState } from 'react';
import {
  OnlineLobbyData,
  OnlinePlayer,
  PlayerColor,
  CapturedPieces as CapturedPiecesType,
} from '../types';
import { PieceIcon } from './PieceIcon';
import {
  Globe,
  Copy,
  Check,
  Flag,
  Handshake,
  RotateCcw,
  MessageSquare,
  Send,
  Sparkles,
  AlertCircle,
  Clock,
  Shield,
  Trophy,
} from 'lucide-react';

interface OnlineMatchProfileProps {
  lobby: OnlineLobbyData;
  myPlayerId: string;
  myColor: PlayerColor;
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onRequestRematch: () => void;
  onSendChat: (text: string) => void;
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
  }>;
  onLeaveMatch: () => void;
}

export const OnlineMatchProfile: React.FC<OnlineMatchProfileProps> = ({
  lobby,
  myPlayerId,
  myColor,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onRequestRematch,
  onSendChat,
  chatMessages,
  onLeaveMatch,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [confirmResign, setConfirmResign] = useState<boolean>(false);

  const myPlayer = lobby.players[myPlayerId];
  const opponent = (Object.values(lobby.players) as OnlinePlayer[]).find((p) => p.id !== myPlayerId);
  const opponentColor: PlayerColor = myColor === 'w' ? 'b' : 'w';

  const isMyTurn = lobby.turn === myColor;
  const isDrawOfferedToMe = Boolean(
    lobby.drawOfferedBy && lobby.drawOfferedBy !== myPlayerId
  );
  const didIOfferDraw = lobby.drawOfferedBy === myPlayerId;
  const didIRequestRematch = lobby.rematchRequestedBy?.includes(myPlayerId);

  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const whiteList = lobby.capturedPieces?.w || [];
  const blackList = lobby.capturedPieces?.b || [];
  const whiteCapturedPoints = whiteList.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackCapturedPoints = blackList.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const myAdvantage =
    myColor === 'w'
      ? whiteCapturedPoints - blackCapturedPoints
      : blackCapturedPoints - whiteCapturedPoints;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobby.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const sendQuickReaction = (text: string) => {
    onSendChat(text);
  };

  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 text-stone-100">
      {/* Top Bar: Room Code & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Lobby-Code:
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 font-mono font-bold text-xs transition cursor-pointer"
                title="Code kopieren"
              >
                <span>{lobby.roomCode}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Turn status pill */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
              isMyTurn
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMyTurn ? 'bg-stone-950' : 'bg-amber-400 animate-ping'
              }`}
            ></span>
            <span>{isMyTurn ? 'Du bist am Zug!' : 'Gegner ist am Zug...'}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer relative"
            title="Chat & Reaktionen"
          >
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 1 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-stone-900"></span>
            )}
          </button>
        </div>
      </div>

      {/* Opponent & My Player Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opponent Card */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base shadow-inner ${
                opponentColor === 'w'
                  ? 'bg-stone-100 text-stone-950 border-stone-300'
                  : 'bg-stone-950 text-white border-stone-700'
              }`}
            >
              <PieceIcon type="k" color={opponentColor} className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">
                  {opponent?.name || 'Gegner'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-400 font-medium">
                  {opponentColor === 'w' ? 'Weiß' : 'Schwarz'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    opponent?.connected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span>{opponent?.connected ? 'Online' : 'Verbindung getrennt'}</span>
              </div>
            </div>
          </div>

          {/* Opponent captured pieces */}
          <div className="flex items-center -space-x-1 max-w-[100px] overflow-hidden">
            {(opponentColor === 'w' ? whiteList : blackList).map((p, i) => (
              <PieceIcon
                key={i}
                type={p}
                color={opponentColor === 'w' ? 'b' : 'w'}
                className="w-4 h-4 shrink-0"
              />
            ))}
          </div>
        </div>

        {/* My Player Card */}
        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base shadow-inner ${
                myColor === 'w'
                  ? 'bg-stone-100 text-stone-950 border-stone-300'
                  : 'bg-stone-950 text-white border-stone-700'
              }`}
            >
              <PieceIcon type="k" color={myColor} className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-amber-300">
                  {myPlayer?.name || 'Du'} (Du)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {myColor === 'w' ? 'Weiß' : 'Schwarz'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span>Material: </span>
                <span
                  className={`font-mono font-bold ${
                    myAdvantage > 0
                      ? 'text-emerald-400'
                      : myAdvantage < 0
                      ? 'text-rose-400'
                      : 'text-stone-400'
                  }`}
                >
                  {myAdvantage > 0 ? `+${myAdvantage}` : myAdvantage}
                </span>
              </div>
            </div>
          </div>

          {/* My captured pieces */}
          <div className="flex items-center -space-x-1 max-w-[100px] overflow-hidden">
            {(myColor === 'w' ? whiteList : blackList).map((p, i) => (
              <PieceIcon
                key={i}
                type={p}
                color={myColor === 'w' ? 'b' : 'w'}
                className="w-4 h-4 shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* DRAW OFFER NOTICE BANNER */}
      {isDrawOfferedToMe && lobby.status === 'playing' && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Remis-Angebot:</strong> Dein Gegner bietet ein Unentschieden an!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAcceptDraw}
              className="px-3 py-1 rounded-xl bg-emerald-500 text-stone-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
            >
              Annehmen
            </button>
            <button
              type="button"
              onClick={onDeclineDraw}
              className="px-3 py-1 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 transition cursor-pointer"
            >
              Ablehnen
            </button>
          </div>
        </div>
      )}

      {/* CHAT & QUICK REACTIONS DRAWER */}
      {isChatOpen && (
        <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col gap-2.5">
          {/* Quick Reaction Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-stone-400 font-semibold mr-1">Reaktionen:</span>
            {[
              'Guter Zug! 👏',
              'Schach! ⚔️',
              'Puh, knapp! 😅',
              'Danke fürs Spiel! 🤝',
              'Viel Erfolg! 🍀',
            ].map((reaction, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendQuickReaction(reaction)}
                className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-[11px] text-stone-300 hover:text-white transition cursor-pointer"
              >
                {reaction}
              </button>
            ))}
          </div>

          {/* Chat message stream */}
          <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1 py-1 border-t border-stone-800/60">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs flex items-start gap-1.5 ${
                  msg.isSystem ? 'text-amber-400/80 italic text-[11px]' : 'text-stone-200'
                }`}
              >
                {!msg.isSystem && (
                  <span className="font-bold text-stone-400 shrink-0">
                    {msg.senderId === myPlayerId ? 'Du' : msg.senderName}:
                  </span>
                )}
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={80}
              placeholder="Nachricht schreiben..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs text-white placeholder-stone-600"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Action Controls Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
        <div className="flex items-center gap-2">
          {/* Resign Button */}
          {lobby.status === 'playing' && (
            <>
              {confirmResign ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-rose-400 font-bold">Wirklich aufgeben?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResign();
                      setConfirmResign(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Ja, aufgeben
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResign(false)}
                    className="px-2 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmResign(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-500/20 hover:text-rose-300 text-stone-400 text-xs font-semibold transition cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Aufgeben</span>
                </button>
              )}
            </>
          )}

          {/* Draw offer button */}
          {lobby.status === 'playing' && !isDrawOfferedToMe && (
            <button
              type="button"
              onClick={onOfferDraw}
              disabled={didIOfferDraw}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                didIOfferDraw
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{didIOfferDraw ? 'Remis angeboten...' : 'Remis anbieten'}</span>
            </button>
          )}

          {/* Rematch Button when game over */}
          {lobby.status === 'game_over' && (
            <button
              type="button"
              onClick={onRequestRematch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                didIRequestRematch
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{didIRequestRematch ? 'Warte auf Gegner...' : 'Revanche fordern'}</span>
            </button>
          )}
        </div>

        {/* Leave Match */}
        <button
          type="button"
          onClick={onLeaveMatch}
          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition cursor-pointer"
        >
          Partie verlassen
        </button>
      </div>
    </div>
  );
};
