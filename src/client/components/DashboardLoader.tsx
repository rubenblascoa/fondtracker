import React, { useEffect, useState } from "react";
import { Activity, ShieldCheck, Database, TrendingUp, Lock, Wifi } from "lucide-react";

interface DashboardLoaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

const STEPS = [
  { text: "Conectando con el motor de cotizaciones...", icon: Wifi, pct: 28 },
  { text: "Sincronizando fondos y valor liquidativo...", icon: Database, pct: 56 },
  { text: "Calculando rentabilidad, riesgo y distribución...", icon: TrendingUp, pct: 84 },
  { text: "Verificando cifrado y acceso seguro...", icon: ShieldCheck, pct: 100 },
];

export function DashboardLoader({ onComplete, minDurationMs = 1100 }: DashboardLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    // Step progression animation
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          const next = prev + 1;
          setProgress(STEPS[next].pct);
          return next;
        }
        return prev;
      });
    }, minDurationMs / STEPS.length);

    // Final finish timeout
    const finishTimeout = setTimeout(() => {
      setProgress(100);
      setIsFinishing(true);
      if (onComplete) {
        setTimeout(onComplete, 200);
      }
    }, minDurationMs);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimeout);
    };
  }, [minDurationMs, onComplete]);

  const currentStep = STEPS[stepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-ink-0)] text-white overflow-hidden select-none transition-opacity duration-300 ${isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Animated Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Perspective Grid */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{ 
            backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)', 
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)' 
          }}
        />

        {/* Central Pulsing Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[var(--color-accent)]/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-emerald-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Main Loader Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center space-y-6 animate-fade-in">
        
        {/* Glowing Futuristic Icon with Orbital Rings */}
        <div className="relative flex items-center justify-center w-28 h-28">
          
          {/* Outer Orbital Ring 1 */}
          <div 
            className="absolute inset-0 rounded-full border border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin"
            style={{ animationDuration: '3s' }}
          />

          {/* Outer Orbital Ring 2 (Counter-rotation) */}
          <div 
            className="absolute inset-2 rounded-full border border-dashed border-white/10 border-b-[var(--color-accent)]/60 animate-spin"
            style={{ animationDuration: '6s', animationDirection: 'reverse' }}
          />

          {/* Core Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-ink-1)] border border-[var(--color-accent)]/40 flex items-center justify-center shadow-[0_0_25px_rgba(57,255,136,0.3)]">
            <Activity size={28} className="text-[var(--color-accent)] animate-pulse" />
          </div>

          {/* Corner Radar Blips */}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_#39ff88] animate-ping" />
        </div>

        {/* Brand Name */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-extrabold tracking-wider font-heading text-white">
              Fond<span className="text-[var(--color-accent)] glow">Tracker</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-bold border border-[var(--color-accent)]/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono tracking-tight">
            Gestión Patrimonial &amp; Analítica de Inversión
          </p>
        </div>

        {/* Progress Bar with Glowing Tip */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-1.5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-[var(--color-accent)] to-teal-300 rounded-full transition-all duration-300 ease-out relative shadow-[0_0_12px_rgba(57,255,136,0.5)]"
              style={{ width: `${progress}%` }}
            >
              {/* Highlight Shimmer on tip */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
            </div>
          </div>

          {/* Dynamic Percentage & Step Label */}
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
            <div className="flex items-center gap-1.5 text-gray-300">
              <StepIcon size={12} className="text-[var(--color-accent)] shrink-0 animate-pulse" />
              <span className="truncate max-w-[220px] text-left">{currentStep.text}</span>
            </div>
            <span className="text-[var(--color-accent)] font-bold">{progress}%</span>
          </div>
        </div>

        {/* HUD Telemetry Badges */}
        <div className="grid grid-cols-2 gap-2 w-full pt-4 border-t border-white/5 text-[10px] font-mono text-gray-400">
          <div className="flex items-center justify-center gap-1.5 p-1.5 bg-black/40 border border-white/5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#39ff88]" />
            <span>SISTEMA: EN LÍNEA</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 bg-black/40 border border-white/5 rounded-xl">
            <Lock size={10} className="text-[var(--color-accent)]" />
            <span>CIFRADO: AES-256</span>
          </div>
        </div>

      </div>

      {/* Subtle Bottom Watermark */}
      <div className="absolute bottom-5 text-[10px] font-mono text-gray-600 flex items-center gap-2 pointer-events-none">
        <span>BUN RUNTIME 1.3+</span>
        <span>•</span>
        <span>MERCADO ESPAÑOL &amp; EUROPEO</span>
      </div>

    </div>
  );
}
