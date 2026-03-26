'use client';

import { useEffect, useRef } from 'react';

export function FallingSnow() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create snowflakes - reduced for subtlety
    const snowflakes = ['❄️', '❅', '❆'];
    const numberOfSnowflakes = 8; // Reduced for minimal visual interference

    for (let i = 0; i < numberOfSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'falling-snow';
      snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
      
      // Random properties
      const size = Math.random() * 15 + 10; // 10-25px (smaller)
      const startPosition = Math.random() * 100;
      const duration = Math.random() * 4 + 6; // 6-10s (slower)
      const delay = Math.random() * 8; // Longer delay spread
      const drift = Math.random() * 100 - 50; // -50 to 50px drift
      
      snowflake.style.cssText = `
        left: ${startPosition}%;
        font-size: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        --drift: ${drift}px;
        opacity: ${Math.random() * 0.4 + 0.3}; // More subtle opacity
      `;
      
      container.appendChild(snowflake);
    }

    // Cleanup on unmount
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
      aria-hidden="true"
    />
  );
}

