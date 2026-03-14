import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const monoLabelVariants = cva("font-mono uppercase", {
  variants: {
    size: {
      xs: "text-[10px]",
      sm: "text-[12px]",
      md: "text-[13px]",
    },
    tone: {
      dim: "text-text-dim",
      muted: "text-text-muted",
      accent: "text-accent",
      success: "text-success",
    },
    tracking: {
      normal: "tracking-[0.05em]",
      wide: "tracking-[0.15em]",
      wider: "tracking-[0.2em]",
      widest: "tracking-[0.3em]",
    },
    weight: {
      normal: "font-normal",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "dim",
    tracking: "wide",
    weight: "normal",
  },
});

export type MonoLabelProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof monoLabelVariants>;

export function MonoLabel({ className, size, tone, tracking, weight, ...props }: MonoLabelProps) {
  return (
    <span
      className={cn(monoLabelVariants({ size, tone, tracking, weight, className }))}
      {...props}
    />
  );
}
