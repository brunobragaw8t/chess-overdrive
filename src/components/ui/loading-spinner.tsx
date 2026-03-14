import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label = "LOADING", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col items-center justify-center gap-4", className)}>
      <div className="border-border-hard border-t-accent size-10 animate-spin border-[3px]" />

      <p className="text-text-dim font-mono text-xs tracking-[0.3em] uppercase">
        {label}
        <span className="animate-blink-cursor inline-block">&#x2588;</span>
      </p>
    </div>
  );
}
