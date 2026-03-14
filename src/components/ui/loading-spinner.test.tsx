import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingSpinner } from "./loading-spinner";

afterEach(cleanup);

describe("LoadingSpinner", () => {
  it("renders with default LOADING label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("LOADING")).toBeDefined();
  });

  it("renders with a custom label", () => {
    render(<LoadingSpinner label="AUTHENTICATING" />);
    expect(screen.getByText("AUTHENTICATING")).toBeDefined();
  });
});
