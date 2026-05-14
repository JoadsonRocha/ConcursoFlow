import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-16',
    xl: 'h-24'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
          <defs>
            <linearGradient id="logoGradientTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D81F3" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="logoGradientBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#040919" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Stylized S - Isometric blocks */}
          {/* Top Block */}
          <path 
            d="M20 35 L50 20 L85 30 L85 50 L50 65 L20 50 Z" 
            fill="url(#logoGradientTop)" 
            className="filter drop-shadow-md"
          />
          {/* Bottom Block */}
          <path 
            d="M15 50 L50 35 L80 50 L80 70 L50 85 L15 70 Z" 
            fill="url(#logoGradientBottom)" 
            className="filter drop-shadow-md"
          />
          
          {/* Highlight shapes for 3D effect */}
          <path d="M20 35 L50 20 L85 30 L55 42 Z" fill="white" fillOpacity="0.2" />
          <path d="M15 50 L50 35 L80 50 L50 62 Z" fill="white" fillOpacity="0.2" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-display font-black tracking-tight leading-none uppercase text-text-main ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
          }`}>
            Stratis
          </span>
          <span className={`font-black tracking-[0.2em] uppercase text-primary opacity-80 mt-1 flex items-center gap-2 ${
            size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[10px]' : size === 'lg' ? 'text-[14px]' : 'text-[20px]'
          }`}>
             Planner
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
