import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <img 
          src="/logo.png" 
          alt="EduInclusiva Logo" 
          className="w-full h-full object-contain drop-shadow-xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-display font-black tracking-tight leading-none uppercase text-text-main ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
          }`}>
            EDUINCLUSIVA
          </span>
          <span className={`font-black tracking-[0.2em] uppercase text-primary opacity-80 mt-1 flex items-center gap-2 ${
            size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[10px]' : size === 'lg' ? 'text-[14px]' : 'text-[20px]'
          }`}>
             PRO EDITION
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
