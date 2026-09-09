import { useEffect, useState } from "react";

type CountUpProps = {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
  className?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CountUp({
  value,
  format,
  durationMs = 1000,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(() =>
    prefersReducedMotion() ? value : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <strong className={className}>{format(display)}</strong>;
}
