import React from 'react';
import clsx from 'clsx';

export const BrandEmblem = ({ size = 38, className }) => {
  return (
    <div 
      style={{ width: size, height: size }}
      className={clsx(
        "relative rounded-xl flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-105",
        "bg-gradient-to-br from-[#1c1c1c] via-[#121212] to-[#0a0a0a]",
        "border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.06)] group-hover:border-white/40 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]",
        className
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="coreGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* Outer Hexagonal Shield Matrix */}
        <path
          d="M24 4L40 12V26C40 35.5 24 44 24 44C24 44 8 35.5 8 26V12L24 4Z"
          stroke="url(#shieldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#0D0D0D"
        />

        {/* Inner Dynamic Intersecting Logic Nodes */}
        <path
          d="M24 12V24M24 24L33 30M24 24L15 30"
          stroke="url(#coreGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dynamic Center Node */}
        <circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />

        {/* Sub-Orbital Nodes */}
        <circle cx="24" cy="12" r="2" fill="#60A5FA" />
        <circle cx="33" cy="30" r="2" fill="#A855F7" />
        <circle cx="15" cy="30" r="2" fill="#3B82F6" />
      </svg>
    </div>
  );
};

export const BrandLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'full', // 'full' | 'emblem-only' | 'compact'
  subtitle = 'SMART UNDERWRITING',
  className = ''
}) => {
  const emblemSizes = {
    sm: 28,
    md: 36,
    lg: 46
  };

  return (
    <div className={clsx("group inline-flex items-center gap-3 select-none cursor-pointer transition-all", className)}>
      <BrandEmblem size={emblemSizes[size] || 36} />
      
      {variant !== 'emblem-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={clsx(
              "font-extrabold tracking-tight text-white transition-colors group-hover:text-gray-100",
              size === 'sm' && "text-sm",
              size === 'md' && "text-base",
              size === 'lg' && "text-xl"
            )}>
              CREDEX
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
