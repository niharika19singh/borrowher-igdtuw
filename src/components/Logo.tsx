import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pink ribbon/bow logo */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Left loop */}
        <path
          d="M14 20C10 12 4 14 6 22C8 28 14 26 16 22C18 18 16 14 14 20Z"
          fill="#e8a0b0"
          stroke="#c45a7c"
          strokeWidth="1.2"
        />
        {/* Right loop */}
        <path
          d="M34 20C38 12 44 14 42 22C40 28 34 26 32 22C30 18 32 14 34 20Z"
          fill="#e8a0b0"
          stroke="#c45a7c"
          strokeWidth="1.2"
        />
        {/* Center knot */}
        <ellipse cx="24" cy="22" rx="5" ry="4.5" fill="#d97a9a" stroke="#a34463" strokeWidth="1" />
        {/* Left ribbon tail */}
        <path
          d="M19 24C16 30 12 36 10 40C14 38 18 34 20 28"
          fill="#e8a0b0"
          stroke="#c45a7c"
          strokeWidth="1"
        />
        {/* Right ribbon tail */}
        <path
          d="M29 24C32 30 36 36 38 40C34 38 30 34 28 28"
          fill="#e8a0b0"
          stroke="#c45a7c"
          strokeWidth="1"
        />
        {/* Highlight on knot */}
        <ellipse cx="22.5" cy="20.5" rx="1.5" ry="1.2" fill="#f8d0d8" opacity="0.7" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-xl font-semibold text-[#2d1f24] tracking-tight">
            Borrow<span className="text-[#c45a7c]">Her</span>
          </span>
          <span className="text-[10px] text-[#9a7a84] font-medium tracking-wide -mt-0.5">
            The IGDTUW Campus Sharing Economy
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
