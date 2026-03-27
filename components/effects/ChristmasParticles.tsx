'use client';

import { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export function ChristmasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create snowflakes
    const createSnowflakes = () => {
      const flakes: Snowflake[] = [];
      const numberOfFlakes = Math.min(50, Math.floor(window.innerWidth / 30)); // Responsive count
      
      for (let i = 0; i < numberOfFlakes; i++) {
        flakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 2, // 2-5px
          speed: Math.random() * 1 + 0.5, // 0.5-1.5 px per frame - CONSTANT speed
          opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
        });
      }
      
      return flakes;
    };

    snowflakesRef.current = createSnowflakes();

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update each snowflake
      snowflakesRef.current.forEach((flake) => {
        // Draw snowflake
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();

        // Move snowflake DOWN ONLY - simple falling
        flake.y += flake.speed;

        // Reset to top when it goes off screen
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
      });

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

