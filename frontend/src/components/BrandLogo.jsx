import React from 'react';
import clsx from 'clsx';
import logoImg from '../assets/logo.png';

export const BrandEmblem = ({ size = 40, className = '' }) => {
  return (
    <div 
      style={{ width: size, height: size }}
      className={clsx(
        "relative rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105",
        "bg-black border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.08)] group-hover:border-white/50 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]",
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
    sm: 30,
    md: 40,
    lg: 52
  };

  return (
    <div className={clsx("group inline-flex items-center gap-3 select-none cursor-pointer transition-all", className)}>
      <BrandEmblem size={emblemSizes[size] || 40} />
      
      {variant !== 'emblem-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={clsx(
              "font-extrabold tracking-tight text-white transition-colors group-hover:text-gray-100",
              size === 'sm' && "text-sm",
              size === 'md' && "text-base",
              size === 'lg' && "text-xl"
            )}>
              Smart Underwriting
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-amber-400 border border-amber-400/30 tracking-wider">
              BRE
            </span>
          </div>

          {variant === 'full' && (
            <span className="text-[9px] font-bold text-gray-400 tracking-wider mt-1 uppercase font-mono">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
