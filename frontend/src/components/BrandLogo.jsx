import React from 'react';
import clsx from 'clsx';
import logoImg from '../assets/logo.png';

export const BrandEmblem = ({ size = 36, className = '' }) => {
  return (
    <div 
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={clsx(
        "relative rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 group-hover:scale-105",
        "bg-black border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)] group-hover:border-white/50",
        className
      )}
    >
      <img
        src={logoImg}
        alt="Smart Underwriting Logo"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
};

export const BrandLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'full', // 'full' | 'emblem-only' | 'compact'
  subtitle = 'PLATFORM',
  className = ''
}) => {
  const emblemSizes = {
    sm: 28,
    md: 36,
    lg: 46
  };

  return (
    <div className={clsx("group inline-flex items-center gap-2.5 select-none cursor-pointer transition-all max-w-full overflow-hidden", className)}>
      <BrandEmblem size={emblemSizes[size] || 36} />
      
      {variant !== 'emblem-only' && (
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={clsx(
              "font-extrabold tracking-tight text-white transition-colors group-hover:text-gray-100 whitespace-nowrap",
              size === 'sm' && "text-xs",
              size === 'md' && "text-[13.5px]",
              size === 'lg' && "text-lg"
            )}>
              Smart Underwriting
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-white/10 text-amber-400 border border-amber-400/30 tracking-wider shrink-0">
              BRE
            </span>
          </div>

          {variant === 'full' && (
            <span className="text-[9px] font-bold text-gray-400 tracking-widest mt-1 uppercase font-mono truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
