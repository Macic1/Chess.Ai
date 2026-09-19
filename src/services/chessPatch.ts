import { Chess } from 'chess.js';

// Extend chess.js engine to support multiple kings variant
let isPatched = false;

export function applyMultiKingChessPatch(): void {
  if (isPatched) return;
  isPatched = true;

  const proto = Chess.prototype as any;

  // 1. Patch _put so additional kings can be placed on the board without rejection
  const origPut = proto._put;
  proto._put = function ({ type, color }: { type: string; color: 'w' | 'b' }, square: string) {
    if (type === 'k' && this._kings && this._kings[color] !== -1) {
      const saved = this._kings[color];
      this._kings[color] = -1;
      const res = origPut.call(this, { type, color }, square);
      this._kings[color] = saved; // Keep valid primary king index
      return res;
    }
    return origPut.call(this, { type, color }, square);
  };

  // 2. Patch load to skip strict single-king validation but keep board setup
  const origLoad = proto.load;
  proto.load = function (fen: string, options: any = {}) {
    return origLoad.call(this, fen, { ...options, skipValidation: true });
  };

  // 3. Patch _isKingAttacked so check applies if ANY king of that color is attacked
  proto._isKingAttacked = function (color: 'w' | 'b') {
    const oppColor = color === 'w' ? 'b' : 'w';
    if (!this._board) return false;
    for (let i = 0; i < 128; i++) {
      if (i & 0x88) continue;
      const piece = this._board[i];
      if (piece && piece.type === 'k' && piece.color === color) {
        if (this._attacked(oppColor, i)) {
          return true;
        }
      }
    }
    return false;
  };

  // 4. Patch remove so that removing/capturing a king reassigns _kings to another king if available
  const origRemove = proto.remove;
  proto.remove = function (square: string) {
    const piece = origRemove.call(this, square);
    if (piece && piece.type === 'k' && this._kings[piece.color] === -1 && this._board) {
      for (let i = 0; i < 128; i++) {
        if (i & 0x88) continue;
        const p = this._board[i];
        if (p && p.type === 'k' && p.color === piece.color) {
          this._kings[piece.color] = i;
          break;
        }
      }
    }
    return piece;
  };
}

// Auto-run patch upon module evaluation
applyMultiKingChessPatch();
