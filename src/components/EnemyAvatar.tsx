import React from 'react';
import { motion } from 'motion/react';

interface EnemyAvatarProps {
  avatarKey?: string;
  avatar?: string;
  className?: string;
  mood?: 'neutral' | 'confident' | 'alarmed' | 'defeated' | 'thinking';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const EnemyAvatar: React.FC<EnemyAvatarProps> = ({
  avatarKey,
  avatar,
  className = '',
  mood = 'neutral',
  size = 'md',
}) => {
  const key = avatarKey || avatar || 'felix';

  const getMoodTransform = () => {
    switch (mood) {
      case 'alarmed':
        return { rotate: [-2, 2, -2], transition: { repeat: Infinity, duration: 0.4 } };
      case 'thinking':
        return { y: [0, -2, 0], transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } };
      case 'confident':
        return { scale: 1.05, y: -2 };
      case 'defeated':
        return { rotate: 5, y: 3, opacity: 0.75 };
      default:
        return { y: [0, -1, 0], transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } };
    }
  };

  const sizeClass = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  const finalClass = className || sizeClass;

  switch (key) {
    case 'lukas':
    case 'goblin':
      return (
        <motion.div
          animate={getMoodTransform()}
          className={`relative rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 border border-emerald-500/40 p-1.5 shadow-md shadow-emerald-950/50 ${finalClass}`}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Heraldic Shield background */}
            <path d="M12 10 L52 10 L52 38 C52 48 32 58 32 58 C32 58 12 48 12 38 Z" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            {/* Junior Chess Club Pawn Badge */}
            <circle cx="32" cy="22" r="7" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" />
            <path d="M26 31 C26 27 38 27 38 31 L40 45 L24 45 Z" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5" />
            <rect x="22" y="44" width="20" height="5" rx="2" fill="#047857" stroke="#34d399" strokeWidth="1" />
            {/* Laurel Branch Accent */}
            <path d="M18 36 Q15 44 24 50" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 36 Q49 44 40 50" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            {/* Sparkle */}
            <circle cx="32" cy="21" r="1.5" fill="#ffffff" />
          </svg>
        </motion.div>
      );

    case 'felix':
    case 'knight':
      return (
        <motion.div
          animate={getMoodTransform()}
          className={`relative rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 border border-amber-500/40 p-1.5 shadow-md shadow-amber-950/50 ${finalClass}`}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Tournament Crest Shield */}
            <path d="M12 8 L52 8 L52 36 C52 48 32 58 32 58 C32 58 12 48 12 36 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Knight Silhouette with Staunton curve */}
            <path
              d="M32 15 C30 14 26 16 25 18 C24 20 23 23 25 24 C27 25 30 24 32 23 C29 27 26 32 26 38 L40 38 C41 33 42 27 40 21 C39 17 36 15 32 15 Z"
              fill="#fed7aa"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            {/* Golden Star & Muzzle */}
            <circle cx="28" cy="21" r="1.5" fill="#451a03" />
            <path d="M22 44 L42 44 L44 49 L20 49 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
            <circle cx="32" cy="46.5" r="1.5" fill="#451a03" />
          </svg>
        </motion.div>
      );

    case 'elena':
    case 'countess':
      return (
        <motion.div
          animate={getMoodTransform()}
          className={`relative rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-stone-900 to-stone-950 border border-purple-500/40 p-1.5 shadow-md shadow-purple-950/50 ${finalClass}`}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Regal Shield */}
            <path d="M12 8 L52 8 L52 36 C52 48 32 58 32 58 C32 58 12 48 12 36 Z" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5" />
            {/* Elegant Queen Coronet */}
            <path d="M18 36 L22 24 L28 32 L32 18 L36 32 L42 24 L46 36 Z" fill="#e9d5ff" stroke="#9333ea" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Jewels on Queen Crown */}
            <circle cx="22" cy="23" r="1.8" fill="#facc15" />
            <circle cx="32" cy="17" r="2.2" fill="#facc15" />
            <circle cx="42" cy="23" r="1.8" fill="#facc15" />
            {/* Crown Base */}
            <rect x="18" y="36" width="28" height="6" rx="2" fill="#7e22ce" stroke="#e9d5ff" strokeWidth="1" />
            <circle cx="32" cy="39" r="1.5" fill="#facc15" />
          </svg>
        </motion.div>
      );

    case 'viktor':
    case 'necromancer':
      return (
        <motion.div
          animate={getMoodTransform()}
          className={`relative rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-950 via-stone-900 to-stone-950 border border-rose-500/40 p-1.5 shadow-md shadow-rose-950/50 ${finalClass}`}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Master Tournament Shield */}
            <path d="M12 8 L52 8 L52 36 C52 48 32 58 32 58 C32 58 12 48 12 36 Z" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Master Castle Rook Crest */}
            <path d="M22 20 L22 26 L26 26 L26 22 L30 22 L30 26 L34 26 L34 22 L38 22 L38 26 L42 26 L42 20 Z" fill="#fecdd3" stroke="#e11d48" strokeWidth="1.2" />
            <path d="M24 26 L40 26 L38 42 L26 42 Z" fill="#fda4af" stroke="#be123c" strokeWidth="1.2" />
            <rect x="22" y="42" width="20" height="6" rx="2" fill="#9f1239" stroke="#f43f5e" strokeWidth="1.2" />
            {/* Master Star of Honor */}
            <circle cx="32" cy="34" r="3" fill="#facc15" stroke="#e11d48" strokeWidth="1" />
          </svg>
        </motion.div>
      );

    case 'alexander':
    case 'cyber':
    default:
      return (
        <motion.div
          animate={getMoodTransform()}
          className={`relative rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-950 via-stone-900 to-stone-950 border border-cyan-500/40 p-1.5 shadow-md shadow-cyan-950/50 ${finalClass}`}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Grandmaster Platinum Shield */}
            <path d="M12 8 L52 8 L52 36 C52 48 32 58 32 58 C32 58 12 48 12 36 Z" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Grandmaster Imperial Crown */}
            <path d="M20 38 L22 22 L28 30 L32 16 L36 30 L42 22 L44 38 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="32" cy="14" r="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            {/* Base Pedestal with GM Diamond */}
            <rect x="18" y="38" width="28" height="6" rx="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
            <polygon points="32,39 35,41 32,43 29,41" fill="#facc15" />
            {/* Laurel Wreath */}
            <path d="M16 32 Q14 44 24 50" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d="M48 32 Q50 44 40 50" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      );
  }
};
