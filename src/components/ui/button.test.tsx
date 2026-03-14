import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("renders children as text content", () => {
    render(<Button>SIGN IN</Button>);
    expect(screen.getByRole("button", { name: "SIGN IN" })).toBeDefined();
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>CLICK ME</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        DISABLED
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("merges custom className with variant classes", () => {
    render(<Button className="mt-10">STYLED</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("mt-10");
    // Should still have base CVA classes
    expect(button.className).toContain("inline-flex");
  });
});
