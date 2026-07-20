import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VibeSelectionCard from "./VibeSelectionCard";

const cues = [
  { id: "easygoing", label: "Easygoing", description: "Easy", category: "energy", display_order: 1 },
  { id: "high-energy", label: "High energy", description: "Fast", category: "energy", display_order: 2 },
  { id: "date-night", label: "Date night", description: "Romantic", category: "occasion", display_order: 3 },
  { id: "mind-bending", label: "Mind-bending", description: "Strange", category: "taste", display_order: 4 },
] as const;

describe("VibeSelectionCard", () => {
  it("exposes selected cue state and prevents a fourth selection", () => {
    const onToggleMoodCue = vi.fn();
    render(
      <VibeSelectionCard
        selectedGroupName="Match Club"
        moodCues={[...cues]}
        moodCuesLoading={false}
        selectedMoodCueIds={["easygoing", "high-energy", "date-night"]}
        onToggleMoodCue={onToggleMoodCue}
        availableGenreTags={["Comedy"]}
        selectedGenreTags={[]}
        onToggleGenre={vi.fn()}
        maxRuntime={null}
        onMaxRuntimeChange={vi.fn()}
        customMoodText=""
        onCustomMoodTextChange={vi.fn()}
        isGenerating={false}
        isGenerateDisabled={false}
        generateLabel="Deal the deck"
        onGenerate={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Easygoing/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByText("More feelings and occasions"));
    expect(screen.getByRole("button", { name: /Mind-bending/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Easygoing/ }));
    expect(onToggleMoodCue).toHaveBeenCalledWith("easygoing");
  });
});
