'use client';

import React, { useRef, useEffect, useState } from 'react';
import { audioSynth } from './AudioSynth';

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  phase: number;
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);
  const [warpMode, setWarpMode] = useState<'MESH' | 'TOPOLOGY' | 'QUANTUM'>('TOPOLOGY');
  const [euler, setEuler] = useState({ thetaX: 0, thetaY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let isHovered = false;

    // Grid nodes
    let points: Point[] = [];
    const cols = 14;
    const rows = 14;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Re-generate nodes
      points = [];
      const stepX = width / (cols - 1);
      const stepY = height / (rows - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = c * stepX;
          const oy = r * stepY;
          points.push({
            x: ox,
            y: oy,
            originX: ox,
            originY: oy,
            vx: 0,
            vy: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking relative to canvas
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovered = mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height;

      // Calculate tilt angles for HUD
      const normX = (mouseX / width) * 2 - 1;
      const normY = (mouseY / height) * 2 - 1;
      setEuler({
        thetaX: parseFloat((normY * 24.5).toFixed(1)),
        thetaY: parseFloat((normX * 36.2).toFixed(1)),
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Click wave blast
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      audioSynth.playTick(1600, 0.08);

      points.forEach((p) => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          const force = (1 - dist / 220) * 45;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;
        }
      });
    };

    canvas.addEventListener('click', handleClick);

    let frameCount = 0;
    let lastFpsTime = performance.now();
    let time = 0;

    const render = (now: number) => {
      time += 0.02;
      frameCount++;

      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background coordinates grid
      ctx.strokeStyle = 'rgba(245, 245, 243, 0.03)';
      ctx.lineWidth = 1;
      const gridGap = 40;
      for (let x = 0; x < width; x += gridGap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw points
      points.forEach((p) => {
        // Natural topological undulation
        const wave = Math.sin(time + p.phase + p.originX * 0.01) * 6;
        const targetX = p.originX + Math.cos(time * 0.7 + p.phase) * 3;
        const targetY = p.originY + wave;

        // Pointer repulsion physics
        if (isHovered) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxRadius = 140;

          if (dist < maxRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (1 - dist / maxRadius) * 22;
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
          }
        }

        // Spring dampening
        p.vx += (targetX - p.x) * 0.06;
        p.vy += (targetY - p.y) * 0.06;
        p.vx *= 0.84;
        p.vy *= 0.84;

        p.x += p.vx;
        p.y += p.vy;
      });

      // Render interconnecting lattice lines
      ctx.lineWidth = 0.8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const p = points[i];

          // Horizontal wireframe link
          if (c < cols - 1) {
            const rightP = points[i + 1];
            ctx.strokeStyle = 'rgba(245, 245, 243, 0.09)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(rightP.x, rightP.y);
            ctx.stroke();
          }

          // Vertical wireframe link
          if (r < rows - 1) {
            const bottomP = points[i + cols];
            ctx.strokeStyle = 'rgba(245, 245, 243, 0.09)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(bottomP.x, bottomP.y);
            ctx.stroke();
          }

          // Diagonal wireframe link for quantum / mesh mode
          if (warpMode !== 'TOPOLOGY' && c < cols - 1 && r < rows - 1) {
            const diagP = points[i + cols + 1];
            ctx.strokeStyle = 'rgba(255, 62, 0, 0.08)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(diagP.x, diagP.y);
            ctx.stroke();
          }

          // Vertex nodes
          const isDisturbed = Math.abs(p.vx) + Math.abs(p.vy) > 0.8;
          ctx.fillStyle = isDisturbed ? '#FF3E00' : 'rgba(245, 245, 243, 0.4)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, isDisturbed ? 2.5 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pointer highlight crosshair
      if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 62, 0, 0.5)';
        ctx.lineWidth = 1;

        // Pointer circle
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 28, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(mouseX - 38, mouseY);
        ctx.lineTo(mouseX + 38, mouseY);
        ctx.moveTo(mouseX, mouseY - 38);
        ctx.lineTo(mouseX, mouseY + 38);
        ctx.stroke();

        ctx.fillStyle = '#FF3E00';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [warpMode]);

  const cycleMode = () => {
    audioSynth.playTick(1800, 0.05);
    setWarpMode((prev) => (prev === 'TOPOLOGY' ? 'MESH' : prev === 'MESH' ? 'QUANTUM' : 'TOPOLOGY'));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[460px] lg:h-[580px] border border-[#F5F5F3]/15 bg-[#0D0D0D] overflow-hidden group select-none"
    >
      {}
      <div className="absolute top-2 left-2 z-20 text-[10px] font-mono text-[#FF3E00] leading-none">+</div>
      <div className="absolute top-2 right-2 z-20 text-[10px] font-mono text-[#FF3E00] leading-none">+</div>
      <div className="absolute bottom-2 left-2 z-20 text-[10px] font-mono text-[#FF3E00] leading-none">+</div>
      <div className="absolute bottom-2 right-2 z-20 text-[10px] font-mono text-[#FF3E00] leading-none">+</div>

      {}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono text-[10px] uppercase tracking-wider text-[#F5F5F3]/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-pulse" />
          <span>WEBGL / 3D TOPOLOGY</span>
          <span className="text-[#F5F5F3]/20">|</span>
          <span className="hidden sm:inline">NODES: 196</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF3E00]">{fps} FPS</span>
          <span className="text-[#F5F5F3]/20">|</span>
          <span>GPU ACCEL</span>
        </div>
      </div>

      {}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair transition-opacity duration-300"
      />

      {}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between font-mono text-[10px] uppercase text-[#F5F5F3]/60">
        <div className="hidden sm:flex items-center gap-3 tracking-wider">
          <span>θX: {euler.thetaX > 0 ? `+${euler.thetaX}` : euler.thetaX}°</span>
          <span>θY: {euler.thetaY > 0 ? `+${euler.thetaY}` : euler.thetaY}°</span>
          <span className="text-[#F5F5F3]/20">|</span>
          <span className="text-[#FF3E00]">INTERACTIVE FIELD</span>
        </div>

        {}
        <button
          onClick={cycleMode}
          className="pointer-events-auto px-2.5 py-1 border border-[#F5F5F3]/20 bg-[#0D0D0D]/80 hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors rounded text-[9px] tracking-widest uppercase flex items-center gap-1.5"
        >
          <span>MODE:</span>
          <span className="font-bold text-[#F5F5F3]">{warpMode}</span>
          <span className="text-[#FF3E00]">↻</span>
        </button>
      </div>

      {}
      <div className="absolute right-2 bottom-12 rotate-90 origin-bottom-right font-mono text-[8px] uppercase tracking-widest text-[#F5F5F3]/10 pointer-events-none">
        0x8F94 // VECTOR FIELD KINETICS
      </div>
    </div>
  );
}
