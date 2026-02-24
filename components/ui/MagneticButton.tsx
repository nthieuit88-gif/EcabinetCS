import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
  as?: 'button' | 'a';
  href?: string;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  as = 'button',
  href,
  ...props 
}) => {
  const btnRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoverPosition, setHoverPosition] = useState({ x: '50%', y: '50%' });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!btnRef.current) return;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const dx = (x / width - 0.5) * 2; // -1 to 1
    const dy = (y / height - 0.5) * 2; // -1 to 1

    setPosition({ x: dx * 10, y: dy * 10 }); // Strength = 10px
    setHoverPosition({ x: `${(x / width) * 100}%`, y: `${(y / height) * 100}%` });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles = "relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-sm transition-transform duration-100 ease-linear select-none outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20";
  
  const variants = {
    primary: "text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-[0_18px_50px_rgba(37,99,235,0.18),0_10px_32px_rgba(14,165,164,0.18)] hover:after:opacity-100 after:absolute after:inset-0 after:rounded-2xl after:bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,255,255,0.35),transparent_60%)] after:opacity-0 after:transition-opacity after:duration-300",
    ghost: "bg-white/70 border border-slate-900/10 text-slate-800 hover:bg-white/95"
  };

  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    '--mx': hoverPosition.x,
    '--my': hoverPosition.y,
  } as React.CSSProperties;

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (as === 'a') {
    return (
      <a
        ref={btnRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={combinedClassName}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={btnRef as React.RefObject<HTMLButtonElement>}
      className={combinedClassName}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default MagneticButton;