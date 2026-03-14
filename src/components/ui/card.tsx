import { cn } from "../../lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-border-hard bg-bg-raised border-[3px]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-8", className)} {...props} />;
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("bg-border h-0.5 w-full", className)} />;
}
