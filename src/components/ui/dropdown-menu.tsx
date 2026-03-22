import { cva, type VariantProps } from "class-variance-authority";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

const dropdownItemVariants = cva(
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-mono text-[11px] font-bold tracking-[0.15em] uppercase transition-colors duration-100",
  {
    variants: {
      variant: {
        default: "text-text-muted hover:bg-accent/10 hover:text-text",
        danger: "text-text-muted hover:bg-danger/10 hover:text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type DropdownItem = VariantProps<typeof dropdownItemVariants> & {
  label: string;
  onClick: () => void;
};

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
}

export function DropdownMenu({ trigger, items, align = "end" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={toggle} className="cursor-pointer" aria-haspopup="true">
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "border-border-hard bg-bg-raised animate-stamp absolute top-full z-50 mt-2 min-w-50 border-2 shadow-[0_0_0_1px_var(--color-bg),0_4px_24px_rgba(0,0,0,0.6)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <div className="bg-accent h-0.5 w-full" />

          <div className="py-1">
            {items.map((item, i) => (
              <>
                {i > 0 && <div className="border-border mx-3 my-1 border-t" />}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    item.onClick();
                  }}
                  className={dropdownItemVariants({ variant: item.variant })}
                >
                  {item.label}
                </button>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
