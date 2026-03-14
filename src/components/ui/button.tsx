import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "focus-visible:outline-accent-pale inline-flex items-center justify-center gap-3 font-mono text-[13px] font-bold tracking-[0.15em] uppercase transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-accent text-text hover:bg-accent border-[3px] bg-transparent hover:-translate-y-0.5 hover:text-white hover:shadow-[0_0_20px_rgba(134,59,255,0.4),0_0_40px_rgba(134,59,255,0.15)] active:translate-y-0",
        ghost:
          "border-border-hard text-text-muted hover:border-accent hover:text-accent border-2 bg-transparent",
        danger:
          "border-border-hard text-text-muted hover:border-danger hover:text-danger border-2 bg-transparent",
      },
      size: {
        default: "px-8 py-4",
        sm: "px-5 py-2 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
