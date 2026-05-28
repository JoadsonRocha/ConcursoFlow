import React from 'react';

export const SIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    {...props}
  >
    <defs>
      {/* Dark glass screen gradient */}
      <linearGradient id="bot-screen" x1="20" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      {/* Metallic blue body gradient */}
      <linearGradient id="bot-body" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>

      {/* Amber highlight gradient */}
      <linearGradient id="bot-amber" x1="40" y1="0" x2="60" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      {/* Eye glow filter */}
      <filter id="eye-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      <filter id="bot-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
      </filter>
    </defs>

    <g filter="url(#bot-shadow)">
      {/* 1. Antenna Connection */}
      <rect x="47" y="10" width="6" height="15" rx="3" fill="url(#bot-body)" />
      
      {/* 2. Glow LED on top of Antenna */}
      <circle cx="50" cy="10" r="6" fill="url(#bot-amber)" filter="url(#eye-glow)" />

      {/* 3. Side Headphone Ears (Left & Right) */}
      <rect x="10" y="45" width="8" height="24" rx="4" fill="url(#bot-body)" />
      <circle cx="14" cy="57" r="2" fill="#FBBF24" />

      <rect x="82" y="45" width="8" height="24" rx="4" fill="url(#bot-body)" />
      <circle cx="86" cy="57" r="2" fill="#FBBF24" />

      {/* 4. Main Outer Robot Head (Helmet Shape) */}
      <rect x="16" y="22" width="68" height="62" rx="20" fill="url(#bot-body)" stroke="#111827" strokeWidth="2" />
      
      {/* Neck Connector */}
      <path d="M 38 84 L 62 84 L 58 92 L 42 92 Z" fill="#1E293B" stroke="#111827" strokeWidth="2" />

      {/* 5. Glass Faceplate Screen */}
      <rect x="22" y="28" width="56" height="50" rx="14" fill="url(#bot-screen)" stroke="#334155" strokeWidth="1.5" />

      {/* 6. Friendly Glow Eyes (Tutor/Mentor Expression) */}
      <path d="M 32 46 C 32 41, 44 41, 44 46" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" filter="url(#eye-glow)" />
      <path d="M 56 46 C 56 41, 68 41, 68 46" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" filter="url(#eye-glow)" />

      {/* Glowing cheeks / micro-dots */}
      <circle cx="28" cy="56" r="2.5" fill="#F59E0B" opacity="0.8" />
      <circle cx="72" cy="56" r="2.5" fill="#F59E0B" opacity="0.8" />

      {/* 7. Interactive Neural Mouth Waveform / Smile */}
      <path d="M 40 62 Q 50 70 60 62" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#eye-glow)" />
    </g>
  </svg>
);
