import { Button, Chip, Textarea } from "@heroui/react";
import type { SessionContext, VibeInputMode } from "../types";

type VibeSelectionCardProps = {
  selectedGroupName: string;
  vibeInputMode: VibeInputMode;
  onVibeInputModeChange: (mode: VibeInputMode) => void;
  availableGenreTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  aiMoodInput: string;
  onAiMoodInputChange: (value: string) => void;
  sessionContext: SessionContext;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
  generateLabel: string;
  onGenerate: () => void;
};

export default function VibeSelectionCard({
  selectedGroupName,
  vibeInputMode,
  onVibeInputModeChange,
  availableGenreTags,
  selectedTags,
  onToggleTag,
  aiMoodInput,
  onAiMoodInputChange,
  sessionContext,
  isGenerating,
  isGenerateDisabled,
  generateLabel,
  onGenerate,
}: VibeSelectionCardProps) {
  const selectionSummary =
    vibeInputMode === "ai"
      ? aiMoodInput.trim().length > 0
        ? "Mood ready."
        : "Describe the mood to continue."
      : selectedTags.length === 0
        ? "Choose one or more tags."
        : selectedTags.length === 1
          ? "1 mood selected."
          : `${selectedTags.length} moods selected.`;

  return (
    <section
      className="w-full self-center rounded-xl border border-[#E0B15C]/12 bg-[#1C110F]/58 px-5 py-5 sm:px-6 sm:py-4 lg:max-w-[62rem]"
      aria-labelledby="mood-selection-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="session-title-micro text-xs text-[#D9C7A8]">
            <span className="sm:hidden">
              Before the vote · {selectedGroupName}
            </span>
            <span className="hidden sm:inline">Before the vote</span>
          </p>
          <h2
            id="mood-selection-heading"
            className="app-heading-serif mt-1 text-3xl leading-none text-[#F7EAD2]"
          >
            Set the mood.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#EAD9BC] sm:text-base">
            Choose a few cues, or describe the night you have in mind.
          </p>
        </div>

        <p className="hidden max-w-60 truncate text-sm text-[#BFA986] sm:block sm:pt-1 sm:text-right">
          Session for{" "}
          <span className="font-semibold text-[#EAD9BC]">
            {selectedGroupName}
          </span>
        </p>
      </div>

      <div
        className="mt-4 inline-flex max-w-full gap-6 border-b border-[#E0B15C]/12 sm:mt-3"
        role="group"
        aria-label="Mood selection mode"
      >
        <Button
          size="sm"
          variant="light"
          className={`h-11 min-w-0 rounded-none border-b-2 px-0 text-sm font-semibold data-[hover=true]:!bg-transparent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] sm:h-9 ${
            vibeInputMode === "tags"
              ? "border-[#E0B15C] text-[#F7EAD2]"
              : "border-transparent text-[#EAD9BC] hover:text-[#F7EAD2]"
          }`}
          aria-pressed={vibeInputMode === "tags"}
          onPress={() => onVibeInputModeChange("tags")}
        >
          Choose tags
        </Button>
        <Button
          size="sm"
          variant="light"
          className={`h-11 min-w-0 rounded-none border-b-2 px-0 text-sm font-semibold data-[hover=true]:!bg-transparent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] sm:h-9 ${
            vibeInputMode === "ai"
              ? "border-[#E0B15C] text-[#F7EAD2]"
              : "border-transparent text-[#EAD9BC] hover:text-[#F7EAD2]"
          }`}
          aria-pressed={vibeInputMode === "ai"}
          onPress={() => onVibeInputModeChange("ai")}
        >
          Describe the mood
        </Button>
      </div>

      <div className="mt-5 sm:mt-4">
        {vibeInputMode === "tags" ? (
          availableGenreTags.length > 0 ? (
            <div
              className="flex flex-wrap gap-x-2 gap-y-1.5 sm:gap-2"
              role="group"
              aria-label="Mood tags"
            >
              {availableGenreTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <Button
                    key={tag}
                    size="sm"
                    variant="light"
                    className={`min-h-11 min-w-0 whitespace-normal border px-3 py-1.5 text-sm font-semibold leading-5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] sm:min-h-9 ${
                      selected
                        ? "border-[#E0B15C]/65 bg-[#E0B15C]/16 text-[#F7EAD2]"
                        : "border-[#E0B15C]/12 bg-[#E0B15C]/[0.025] text-[#EAD9BC] hover:border-[#E0B15C]/30 hover:bg-[#E0B15C]/7"
                    }`}
                    aria-pressed={selected}
                    onPress={() => onToggleTag(tag)}
                  >
                    {selected ? (
                      <span aria-hidden="true" className="text-[#F2C16E]">
                        ✓
                      </span>
                    ) : null}
                    {tag}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="border-l-2 border-[#E0B15C]/28 pl-4">
              <p className="text-sm font-semibold text-[#F7EAD2]">
                No mood cues yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-[#EAD9BC]">
                Add a few more titles, or describe the night you have in mind.
              </p>
            </div>
          )
        ) : (
          <Textarea
            label="What are you in the mood for?"
            labelPlacement="outside"
            placeholder="Something tense, atmospheric, and under two hours…"
            value={aiMoodInput}
            onValueChange={onAiMoodInputChange}
            minRows={2}
            variant="bordered"
            classNames={{
              label: "pb-2 text-sm font-semibold !text-[#F7EAD2]",
              input:
                "!text-base !text-[#F7EAD2] placeholder:!text-[#BFA986] caret-[#E0B15C]",
              inputWrapper:
                "min-h-[5.25rem] border-[#E0B15C]/24 !bg-[#22130F]/70 data-[hover=true]:border-[#E0B15C]/40 data-[focus=true]:border-[#E0B15C] data-[focus=true]:ring-1 data-[focus=true]:ring-[#E0B15C]/60 data-[focus=true]:!bg-[#22130F]/70",
            }}
          />
        )}

        {sessionContext.tags.length > 0 ? (
          <div
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Mood cues"
          >
            {sessionContext.tags.map((tag) => (
              <Chip
                key={tag}
                variant="flat"
                classNames={{
                  base: "bg-[#E0B15C]/10",
                  content: "text-[#EAD9BC]",
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-[#E0B15C]/10 pt-4 sm:mt-2.5 sm:flex-row sm:items-center sm:justify-between sm:pt-2.5">
        <p
          className="text-sm text-[#DAC49F]"
          role="status"
          aria-live="polite"
        >
          {selectionSummary}
        </p>
        <Button
          size="lg"
          className="app-primary-button session-deal-button h-11 w-full px-6 sm:w-auto"
          isLoading={isGenerating}
          isDisabled={isGenerateDisabled}
          onPress={onGenerate}
        >
          {generateLabel}
        </Button>
      </div>
    </section>
  );
}
