import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MovieNightCardDialog from "./MovieNightCardDialog";
import { cardTestNight } from "./cardTestFixtures";

const mocks = vi.hoisted(() => ({
  exportMovieNightCard: vi.fn(),
  getMovieNightArtwork: vi.fn(),
}));

vi.mock("../movies/movies.api", () => ({
  getMovieNightArtwork: mocks.getMovieNightArtwork,
}));
vi.mock("../sessions/moodCues.api", () => ({
  getMoodCues: vi.fn(async () => [
    { id: "easygoing", label: "Easygoing", category: "energy" },
  ]),
}));
vi.mock("./cardFonts", () => ({
  loadCardDisplayFont: vi.fn(async () => null),
}));
vi.mock("./cardExport", () => ({
  exportMovieNightCard: mocks.exportMovieNightCard,
}));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MovieNightCardDialog
        isOpen
        onOpenChange={vi.fn()}
        night={cardTestNight}
      />
    </QueryClientProvider>,
  );
}

describe("MovieNightCardDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.getMovieNightArtwork.mockReset();
    mocks.getMovieNightArtwork.mockRejectedValue(new Error("missing"));
    mocks.exportMovieNightCard.mockReset();
    mocks.exportMovieNightCard.mockResolvedValue({
      blob: new Blob(["png"], { type: "image/png" }),
      filename: "arbiter-film-2026-07-20-square.png",
      width: 1080,
      height: 1080,
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:card-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
  });

  it("provides semantic format and template selection with an accessible summary", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Create a movie night card" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Square/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Cinematic Poster/ }),
    ).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Portrait/ }));
    await user.click(
      screen.getByRole("radio", { name: /Editorial Programme/ }),
    );
    expect(screen.getByRole("radio", { name: /Portrait/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Editorial Programme/ }),
    ).toBeChecked();
    expect(
      screen.getByText(/Portrait Editorial Programme for A Beautiful Film/),
    ).toBeInTheDocument();
  });

  it("keeps optional private context behind Card details", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.queryByRole("checkbox", { name: "Group name" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Card details" }));
    const groupName = screen.getByRole("checkbox", { name: "Group name" });
    expect(groupName).not.toBeChecked();
    await user.click(groupName);
    expect(groupName).toBeChecked();
    expect(
      screen.getByText("Names, votes, and private links are never included."),
    ).toBeInTheDocument();
  });

  it("downloads when native file sharing is unavailable", async () => {
    renderDialog();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share" })).toBeEnabled(),
    );
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(mocks.exportMovieNightCard).toHaveBeenCalledOnce());
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("treats native share cancellation as a quiet outcome", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Canceled", "AbortError"));
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn(() => true),
    });
    renderDialog();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
