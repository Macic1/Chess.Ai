import React from 'react';
import { PieceType, PlayerColor, PlayerPieceCustomization, PieceStyleId, PieceGlowEffect } from '../types';
import { PIECE_STYLES } from '../data/pieceStyles';

export interface PieceIconProps {
  type: PieceType;
  color: PlayerColor;
  className?: string;
  customization?: PlayerPieceCustomization;
  styleId?: PieceStyleId;
  glow?: PieceGlowEffect;
  primaryColor?: string;
  accentColor?: string;
}

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  color,
  className = 'w-10 h-10',
  customization,
  styleId: propStyleId,
  glow: propGlow,
  primaryColor: propPrimary,
  accentColor: propAccent,
}) => {
  const isWhite = color === 'w';
  const styleId: PieceStyleId = customization?.styleId || propStyleId || 'classic';
  const glow: PieceGlowEffect = customization?.glow || propGlow || 'none';

  // Look up default colors for this style
  const meta = PIECE_STYLES.find((s) => s.id === styleId) || PIECE_STYLES[0];

  const defaultFill = isWhite ? meta.defaultWhiteFill : meta.defaultBlackFill;
  const defaultStroke = isWhite ? meta.defaultWhiteStroke : meta.defaultBlackStroke;

  const fill = customization?.primaryColor || propPrimary || defaultFill;
  const stroke = customization?.accentColor || propAccent || defaultStroke;

  // Detail / inner contour color
  const detail = isWhite
    ? styleId === 'cyber'
      ? '#22d3ee'
      : styleId === 'royal'
      ? '#ca8a04'
      : stroke
    : styleId === 'cyber'
    ? '#f43f5e'
    : styleId === 'royal'
    ? '#fef08a'
    : styleId === 'shadow'
    ? '#ef4444'
    : styleId === 'wood'
    ? '#d4a373'
    : '#eceff1';

  // Compute glow filter style
  const glowFilter = React.useMemo(() => {
    switch (glow) {
      case 'gold':
        return 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.75))';
      case 'cyan':
        return 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.75))';
      case 'ruby':
        return 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.75))';
      case 'purple':
        return 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.75))';
      case 'subtle':
        return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))';
      case 'none':
      default:
        return undefined;
    }
  }, [glow]);

  // Distinctive style accents
  const isRoyal = styleId === 'royal';
  const isCyber = styleId === 'cyber';
  const isCrystal = styleId === 'crystal';
  const isShadow = styleId === 'shadow';

  if (isWhite) {
    // WHITE PIECES
    switch (type) {
      case 'p':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-p-${styleId}`}
          >
            <path
              d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {isRoyal && (
              <circle cx="22.5" cy="13" r="1.5" fill="#ca8a04" />
            )}
            {isCyber && (
              <line x1="22.5" y1="20" x2="22.5" y2="35" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
            )}
            {isCrystal && (
              <path d="M 20,11 L 22.5,13 L 25,11" stroke="#38bdf8" strokeWidth="1" fill="none" />
            )}
          </svg>
        );

      case 'n':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-n-${styleId}`}
          >
            <g
              fill="none"
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 22,10 C 32.5,11 38.5,18 36,39 L 9,39 C 9,31 16,29 16,23 C 16,21 15,19 14,17 C 13,15 11,14 11,11 C 11,9 13,8 15,8 C 16.5,8 18,9 18,10 C 19.5,9.5 21,9.5 22,10 z"
                fill={fill}
                stroke={stroke}
              />
              <path
                d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.96,30.06 9.58,27.96 11,28 C 12,28 11.19,29.23 15,27 C 16,26.5 16.72,25.61 17,25 C 17.5,23.9 17,23.6 16,22.5 C 14.79,21.17 14.56,20.08 15,19.5 C 15.6,18.7 16.9,19.7 17,20.5 C 17.45,24.08 21.29,23.64 22,22.5 C 22.38,21.89 21.5,21 21,20.5 C 20.17,19.67 20.34,18.8 21,18.5 C 21.5,18.3 22.3,18.8 23,19.5 z"
                fill={fill}
                stroke={stroke}
              />
              <path d="M 24.5,10.5 C 25,12 26.5,13 28,13" stroke={detail} />
              <path d="M 28,15.5 C 29,17 30.5,17.5 32,17" stroke={detail} />
              <circle cx="9.5" cy="25.5" r="0.75" fill={stroke} />
              <circle cx="14.5" cy="14.5" r="1.2" fill={isCyber ? '#06b6d4' : isRoyal ? '#eab308' : stroke} />
              <path d="M 13,19 C 14,21 16.5,21.5 18,20" stroke={detail} strokeWidth="1.2" />
            </g>
          </svg>
        );

      case 'b':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-b-${styleId}`}
          >
            <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <g fill={fill} strokeLinecap="butt">
                <path d="m 9,36 c 3.39,-0.47 6.55,-1.93 9,-4 1.76,-1.48 2.88,-3.63 3,-6 -1.25,-0.63 -2.48,-1.49 -3.5,-2.5 C 16.32,22.31 15.5,20.73 15,19 c -0.19,-0.66 -0.19,-1.34 0,-2 0.39,-1.33 1.5,-2.32 2.86,-2.6 1.48,-0.3 3.01,0.2 4.14,1.25 1.41,1.31 2.3,3.08 2.5,5 0.72,-0.2 1.45,-0.37 2.2,-0.5 2.14,-0.37 4.31,0.07 6.13,1.25 1.78,1.15 3.04,2.94 3.5,5 0.56,2.49 -0.1,5.13 -1.75,7.1 -1.41,1.68 -3.42,2.77 -5.58,3 -2.33,0.25 -4.68,-0.45 -6.5,-1.9 -1.02,0.92 -2.18,1.68 -3.5,2.25 -2.59,1.12 -5.46,1.48 -8.25,1.15 z" />
                <path d="M 9,36 C 12.39,35.53 15.55,34.07 18,32 C 17.5,24.5 14,25.5 14,20 C 14,17.5 16,15 18,13 C 17,11.5 17,9.5 18.5,8 C 20,6.5 23.5,6 24.5,8 C 26,9.5 26,11.5 25,13 C 27,15 29,17.5 29,20 C 29,25.5 25.5,24.5 25,32 C 27.45,34.07 30.61,35.53 34,36 Z" />
              </g>
              <circle cx="22.5" cy="6" r="1.8" fill={isRoyal ? '#eab308' : isCyber ? '#06b6d4' : fill} />
              <path d="M 17.5,26 C 20,27 23,27 25.5,26" stroke={detail} />
              <path d="M 20.5,11.5 L 22.5,13.5 L 24.5,11.5" stroke={detail} />
              <path d="M 12,39 L 33,39" stroke={detail} />
            </g>
          </svg>
        );

      case 'r':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-r-${styleId}`}
          >
            <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{ strokeLinecap: 'butt' }} />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{ strokeLinecap: 'butt' }} />
              <path
                d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
                style={{ strokeLinecap: 'butt' }}
              />
              <path d="M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" />
              <path d="M 14,16 L 31,16" fill="none" stroke={detail} strokeWidth="1" />
              <path d="M 14,29.5 L 31,29.5" fill="none" stroke={detail} strokeWidth="1" />
              <path d="M 14,24 L 31,24" fill="none" stroke={detail} strokeWidth="1" />
            </g>
          </svg>
        );

      case 'q':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-q-${styleId}`}
          >
            <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38.5 L 35,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke={detail} />
              <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke={detail} />
              <circle cx="6" cy="12" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#06b6d4' : fill} />
              <circle cx="14" cy="9" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#06b6d4' : fill} />
              <circle cx="22.5" cy="8" r="2" fill={isRoyal ? '#ca8a04' : isCyber ? '#22d3ee' : fill} />
              <circle cx="31" cy="9" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#06b6d4' : fill} />
              <circle cx="39" cy="12" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#06b6d4' : fill} />
            </g>
          </svg>
        );

      case 'k':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-w-k-${styleId}`}
          >
            <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" stroke={isRoyal ? '#ca8a04' : stroke} strokeWidth="1.8" />
              <path
                d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z"
                fill={fill}
              />
              <path
                d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,28.5 38.5,24 38.5,20 C 38.5,15.5 35.5,13.5 32,15.5 C 28.5,17.5 27,21 22.5,21 C 18,21 16.5,17.5 13,15.5 C 9.5,13.5 6.5,15.5 6.5,20 C 6.5,24 8.5,28.5 11.5,37 z"
                fill={fill}
              />
              <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke={detail} />
              <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke={detail} />
              <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke={detail} />
            </g>
          </svg>
        );
    }
  } else {
    // BLACK PIECES
    switch (type) {
      case 'p':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-p-${styleId}`}
          >
            <path
              d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Specular highlight */}
            <path
              d="m 22.5,10.5 c -1.38,0 -2.5,1.12 -2.5,2.5 0,0.5 0.16,0.96 0.44,1.34 0.95,0.76 1.76,1.74 2.06,2.66 0.3,-0.92 1.11,-1.9 2.06,-2.66 0.28,-0.38 0.44,-0.84 0.44,-1.34 0,-1.38 -1.12,-2.5 -2.5,-2.5 z"
              fill={detail}
              opacity={isShadow ? 0.8 : 0.4}
            />
          </svg>
        );

      case 'n':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-n-${styleId}`}
          >
            <g
              fill="none"
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 22,10 C 32.5,11 38.5,18 36,39 L 9,39 C 9,31 16,29 16,23 C 16,21 15,19 14,17 C 13,15 11,14 11,11 C 11,9 13,8 15,8 C 16.5,8 18,9 18,10 C 19.5,9.5 21,9.5 22,10 z"
                fill={fill}
                stroke={stroke}
              />
              <path
                d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.96,30.06 9.58,27.96 11,28 C 12,28 11.19,29.23 15,27 C 16,26.5 16.72,25.61 17,25 C 17.5,23.9 17,23.6 16,22.5 C 14.79,21.17 14.56,20.08 15,19.5 C 15.6,18.7 16.9,19.7 17,20.5 C 17.45,24.08 21.29,23.64 22,22.5 C 22.38,21.89 21.5,21 21,20.5 C 20.17,19.67 20.34,18.8 21,18.5 C 21.5,18.3 22.3,18.8 23,19.5 z"
                fill={fill}
                stroke={detail}
                strokeWidth="1.2"
              />
              <path d="M 24.5,10.5 C 25,12 26.5,13 28,13" stroke={detail} strokeWidth="1.2" />
              <path d="M 28,15.5 C 29,17 30.5,17.5 32,17" stroke={detail} strokeWidth="1.2" />
              <circle cx="9.5" cy="25.5" r="0.75" fill={detail} />
              <circle cx="14.5" cy="14.5" r="1.2" fill={isShadow ? '#ef4444' : isCyber ? '#ec4899' : detail} />
              <path d="M 13,19 C 14,21 16.5,21.5 18,20" stroke={detail} strokeWidth="1.2" />
            </g>
          </svg>
        );

      case 'b':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-b-${styleId}`}
          >
            <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <g fill={fill} strokeLinecap="butt">
                <path d="M 9,36 C 12.39,35.53 15.55,34.07 18,32 C 17.5,24.5 14,25.5 14,20 C 14,17.5 16,15 18,13 C 17,11.5 17,9.5 18.5,8 C 20,6.5 23.5,6 24.5,8 C 26,9.5 26,11.5 25,13 C 27,15 29,17.5 29,20 C 29,25.5 25.5,24.5 25,32 C 27.45,34.07 30.61,35.53 34,36 Z" />
              </g>
              <circle cx="22.5" cy="6" r="1.8" fill={fill} stroke={detail} />
              <path d="M 17.5,26 C 20,27 23,27 25.5,26" stroke={detail} />
              <path d="M 20.5,11.5 L 22.5,13.5 L 24.5,11.5" stroke={detail} />
              <path d="M 12,39 L 33,39" stroke={detail} />
            </g>
          </svg>
        );

      case 'r':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-r-${styleId}`}
          >
            <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{ strokeLinecap: 'butt' }} />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{ strokeLinecap: 'butt' }} />
              <path
                d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
                style={{ strokeLinecap: 'butt' }}
              />
              <path d="M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" />
              <path d="M 14,16 L 31,16" stroke={detail} fill="none" strokeWidth="1" />
              <path d="M 14,29.5 L 31,29.5" stroke={detail} fill="none" strokeWidth="1" />
              <path d="M 14,24 L 31,24" stroke={detail} fill="none" strokeWidth="1" />
            </g>
          </svg>
        );

      case 'q':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-q-${styleId}`}
          >
            <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38.5 L 35,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30" stroke={detail} fill="none" />
              <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke={detail} fill="none" />
              <circle cx="6" cy="12" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#ec4899' : fill} />
              <circle cx="14" cy="9" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#ec4899' : fill} />
              <circle cx="22.5" cy="8" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#ec4899' : fill} />
              <circle cx="31" cy="9" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#ec4899' : fill} />
              <circle cx="39" cy="12" r="2" fill={isRoyal ? '#eab308' : isCyber ? '#ec4899' : fill} />
            </g>
          </svg>
        );

      case 'k':
        return (
          <svg
            viewBox="0 0 45 45"
            className={className}
            style={{ filter: glowFilter }}
            id={`piece-b-k-${styleId}`}
          >
            <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" stroke={isRoyal ? '#eab308' : detail} strokeWidth="1.8" />
              <path
                d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z"
                fill={fill}
              />
              <path
                d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,28.5 38.5,24 38.5,20 C 38.5,15.5 35.5,13.5 32,15.5 C 28.5,17.5 27,21 22.5,21 C 18,21 16.5,17.5 13,15.5 C 9.5,13.5 6.5,15.5 6.5,20 C 6.5,24 8.5,28.5 11.5,37 z"
                fill={fill}
              />
              <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke={detail} />
              <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke={detail} />
              <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke={detail} />
            </g>
          </svg>
        );
    }
  }

  return null;
};
