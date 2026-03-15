import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const avatarSizeVariants = cva("border-border-hard bg-bg overflow-hidden border-[3px]", {
  variants: {
    size: {
      sm: "h-10 w-10",
      md: "h-16 w-16",
      lg: "h-24 w-24",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const fallbackTextVariants = cva("font-display text-text-dim font-bold", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-xl",
      lg: "text-3xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const cornerBase = "border-accent absolute";

const cornerTLVariants = cva(`${cornerBase} border-t-2 border-l-2`, {
  variants: {
    size: {
      sm: "-top-0.75 -left-0.75 h-1 w-1",
      md: "-top-0.75 -left-0.75 h-1.5 w-1.5",
      lg: "-top-1 -left-1 h-2 w-2",
    },
  },
  defaultVariants: { size: "md" },
});

const cornerTRVariants = cva(`${cornerBase} border-t-2 border-r-2`, {
  variants: {
    size: {
      sm: "-top-0.75 -right-0.75 h-1 w-1",
      md: "-top-0.75 -right-0.75 h-1.5 w-1.5",
      lg: "-top-1 -right-1 h-2 w-2",
    },
  },
  defaultVariants: { size: "md" },
});

const cornerBLVariants = cva(`${cornerBase} border-b-2 border-l-2`, {
  variants: {
    size: {
      sm: "-bottom-0.75 -left-0.75 h-1 w-1",
      md: "-bottom-0.75 -left-0.75 h-1.5 w-1.5",
      lg: "-bottom-1 -left-1 h-2 w-2",
    },
  },
  defaultVariants: { size: "md" },
});

const cornerBRVariants = cva(`${cornerBase} border-r-2 border-b-2`, {
  variants: {
    size: {
      sm: "-right-0.75 -bottom-0.75 h-1 w-1",
      md: "-right-0.75 -bottom-0.75 h-1.5 w-1.5",
      lg: "-right-1 -bottom-1 h-2 w-2",
    },
  },
  defaultVariants: { size: "md" },
});

export type UserAvatarProps = VariantProps<typeof avatarSizeVariants> & {
  avatarUrl?: string | null;
  name?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function UserAvatar({ size = "md", avatarUrl, name, className, children }: UserAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={avatarSizeVariants({ size })}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="bg-bg-inset flex h-full w-full items-center justify-center">
            <span className={fallbackTextVariants({ size })}>
              {name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
        )}

        {children}
      </div>

      <div className={cornerTLVariants({ size })} />
      <div className={cornerTRVariants({ size })} />
      <div className={cornerBLVariants({ size })} />
      <div className={cornerBRVariants({ size })} />
    </div>
  );
}
