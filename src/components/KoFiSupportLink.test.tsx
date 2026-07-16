import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KoFiSupportLink from "./KoFiSupportLink";

describe("KoFiSupportLink", () => {
  it("uses the centralized external destination safely", () => {
    render(
      <KoFiSupportLink label="Support Arbiter on Ko-fi" placement="profile" />,
    );

    const link = screen.getByRole("link", {
      name: "Support Arbiter on Ko-fi - opens in a new tab",
    });
    expect(link).toHaveAttribute("href", "https://ko-fi.com/H4L223A4I2");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
