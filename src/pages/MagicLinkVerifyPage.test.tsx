import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import MagicLinkVerifyPage from "./MagicLinkVerifyPage";

const verifyMagicLink = vi.fn();

vi.mock("../features/auth/auth.api", () => ({
  verifyMagicLink: (grant: string) => verifyMagicLink(grant),
}));

vi.mock("../features/auth/authHandoff", () => ({
  broadcastAuthSuccess: vi.fn(),
}));

beforeEach(() => {
  verifyMagicLink.mockReset();
  window.history.replaceState(
    null,
    "",
    "/auth/magic-link/verify#grant=private-grant-value-that-is-long-enough",
  );
});

test("removes the grant from the URL before submitting it in the request body", async () => {
  verifyMagicLink.mockRejectedValue(new Error("invalid"));
  render(
    <MemoryRouter>
      <MagicLinkVerifyPage />
    </MemoryRouter>,
  );

  expect(window.location.hash).toBe("");
  await waitFor(() =>
    expect(verifyMagicLink).toHaveBeenCalledWith(
      "private-grant-value-that-is-long-enough",
    ),
  );
  expect(
    await screen.findByRole("heading", { name: "This link cannot be used" }),
  ).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("private-grant-value");
});
