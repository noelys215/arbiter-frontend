import { Button } from "@heroui/react";
import { AppTextArea } from "../../../components/ui/AppField";
import type { MoodCue } from "../../../features/sessions/moodCues.api";

const CATEGORY_LABELS: Record<MoodCue["category"], string> = {
  energy: "Energy",
  effect: "How it should leave you",
  occasion: "The occasion",
  taste: "Taste",
};

type VibeSelectionCardProps = {
  selectedGroupName: string;
  moodCues: MoodCue[];
  moodCuesLoading: boolean;
  selectedMoodCueIds: string[];
  onToggleMoodCue: (cueId: string) => void;
  availableGenreTags: string[];
  selectedGenreTags: string[];
  onToggleGenre: (tag: string) => void;
  maxRuntime: number | null;
  onMaxRuntimeChange: (minutes: number | null) => void;
  customMoodText: string;
  onCustomMoodTextChange: (value: string) => void;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
  generateLabel: string;
  onGenerate: () => void;
};

export default function VibeSelectionCard({
  selectedGroupName,
  moodCues,
  moodCuesLoading,
  selectedMoodCueIds,
  onToggleMoodCue,
  availableGenreTags,
  selectedGenreTags,
  onToggleGenre,
  maxRuntime,
  onMaxRuntimeChange,
  customMoodText,
  onCustomMoodTextChange,
  isGenerating,
  isGenerateDisabled,
  generateLabel,
  onGenerate,
}: VibeSelectionCardProps) {
  const groupedCues = moodCues.reduce<Partial<Record<MoodCue["category"], MoodCue[]>>>(
    (groups, cue) => {
      (groups[cue.category] ??= []).push(cue);
      return groups;
    },
    {},
  );
  const selectedCount = selectedMoodCueIds.length;
  const renderCueGroup = (category: MoodCue["category"]) => {
    const cues = groupedCues[category] ?? [];
    if (cues.length === 0) return null;
    return (
      <fieldset key={category}>
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-[#CDB58E]">
          {CATEGORY_LABELS[category]}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {cues.map((cue) => {
            const selected = selectedMoodCueIds.includes(cue.id);
            const limitReached = selectedCount >= 3 && !selected;
            return (
              <Button
                key={cue.id}
                size="sm"
                variant="tertiary"
                className={`min-h-11 min-w-0 whitespace-normal border px-3 py-1.5 text-left text-sm font-semibold leading-5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] ${
                  selected
                    ? "border-[#E0B15C]/65 bg-[#E0B15C]/16 text-[#F7EAD2]"
                    : "border-[#E0B15C]/10 bg-[#E0B15C]/[0.02] text-[#EAD9BC] hover:border-[#E0B15C]/28 hover:bg-[#E0B15C]/7"
                }`}
                aria-pressed={selected}
                isDisabled={limitReached}
                aria-label={`${cue.label}. ${cue.description}`}
                onPress={() => onToggleMoodCue(cue.id)}
              >
                {selected ? <span aria-hidden="true" className="text-[#F2C16E]">✓</span> : null}
                {cue.label}
              </Button>
            );
          })}
        </div>
      </fieldset>
    );
  };
  const selectionSummary =
    selectedCount === 0
      ? "Choose up to three cues, then add any details that matter."
      : selectedCount === 1
        ? "1 feeling selected."
        : `${selectedCount} feelings selected.`;

  return (
    <section
      className="w-full self-center rounded-xl border border-[#E0B15C]/12 bg-[#1C110F]/58 px-5 py-6 sm:px-7 lg:max-w-[62rem]"
      aria-labelledby="mood-selection-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="session-title-micro text-xs text-[#D9C7A8]">
            <span className="sm:hidden">Before the vote · {selectedGroupName}</span>
            <span className="hidden sm:inline">Before the vote</span>
          </p>
          <h2 id="mood-selection-heading" className="app-heading-serif mt-1 text-3xl leading-none text-[#F7EAD2] sm:text-4xl">
            What should tonight feel like?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#EAD9BC] sm:text-base">
            Pick the feeling first. Genres and runtime can stay in the background.
          </p>
        </div>
        <p className="hidden max-w-60 truncate pt-1 text-right text-sm text-[#BFA986] sm:block">
          Session for <span className="font-semibold text-[#EAD9BC]">{selectedGroupName}</span>
        </p>
      </div>

      <div className="mt-7" aria-busy={moodCuesLoading}>
        {moodCuesLoading ? (
          <p className="text-sm text-[#D9C7A8]" role="status">Opening tonight’s choices…</p>
        ) : (
          <div>
            <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
              {renderCueGroup("energy")}
              {renderCueGroup("effect")}
            </div>
            <details className="group mt-5 border-t border-[#E0B15C]/10 pt-3">
              <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-semibold text-[#EAD9BC] outline-none transition-colors hover:text-[#F7EAD2] focus-visible:ring-3 focus-visible:ring-[#F2C16E] [&::-webkit-details-marker]:hidden">
                <span>More feelings and occasions</span>
                <span
                  aria-hidden="true"
                  className="relative flex h-9 w-9 shrink-0 rotate-0 items-center justify-center rounded-full border border-[#E0B15C]/25 text-[#E0B15C] transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-open:rotate-45 group-open:border-[#E0B15C]/50 group-open:bg-[#E0B15C]/8 motion-reduce:duration-0"
                >
                  <span className="absolute h-px w-4 rounded-full bg-current" />
                  <span className="absolute h-4 w-px rounded-full bg-current" />
                </span>
              </summary>
              <div className="grid gap-x-8 gap-y-7 pb-2 pt-4 md:grid-cols-2">
                {renderCueGroup("occasion")}
                {renderCueGroup("taste")}
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-[#E0B15C]/10 pt-6">
        <AppTextArea
          label="A note for tonight (optional)"
          placeholder="Something romantic but not cheesy."
          description="A short note for your group. It won’t be interpreted by AI."
          value={customMoodText}
          onChangeValue={onCustomMoodTextChange}
          maxLength={240}
          rows={2}
          classes={{
            label: "pb-2 text-sm font-semibold !text-[#F7EAD2]",
            description: "text-[#CDB58E]",
            input: "!text-base !text-[#F7EAD2] placeholder:!text-[#BFA986] caret-[#E0B15C]",
            inputWrapper: "min-h-[5rem] border-[#E0B15C]/24 !bg-[#22130F]/70 hover:border-[#E0B15C]/40 focus:border-[#E0B15C] focus:ring-1 focus:ring-[#E0B15C]/60 focus:!bg-[#22130F]/70",
          }}
        />
        <p className="mt-1 text-right text-xs text-[#CDB58E]">{customMoodText.length} / 240</p>
      </div>

      <details className="group mt-5 border-t border-[#E0B15C]/10 pt-5">
        <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-semibold text-[#EAD9BC] outline-none transition-colors hover:text-[#F7EAD2] focus-visible:ring-3 focus-visible:ring-[#F2C16E] [&::-webkit-details-marker]:hidden">
          <span>Genre and runtime preferences</span>
          <span
            aria-hidden="true"
            className="relative flex h-9 w-9 shrink-0 rotate-0 items-center justify-center rounded-full border border-[#E0B15C]/25 text-[#E0B15C] transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-open:rotate-45 group-open:border-[#E0B15C]/50 group-open:bg-[#E0B15C]/8 motion-reduce:duration-0"
          >
            <span className="absolute h-px w-4 rounded-full bg-current" />
            <span className="absolute h-4 w-px rounded-full bg-current" />
          </span>
        </summary>
        <div className="pb-2 pt-4">
          {availableGenreTags.length > 0 ? (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-[#CDB58E]">Genres</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableGenreTags.map((tag) => {
                  const selected = selectedGenreTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      size="sm"
                      variant="tertiary"
                      className={`min-h-11 min-w-0 border px-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] ${selected ? "border-[#E0B15C]/55 bg-[#E0B15C]/12 text-[#F7EAD2]" : "border-[#E0B15C]/10 text-[#EAD9BC]"}`}
                      aria-pressed={selected}
                      onPress={() => onToggleGenre(tag)}
                    >
                      {selected ? <span aria-hidden="true">✓</span> : null}{tag}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <fieldset className="mt-6">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-[#CDB58E]">Maximum runtime</legend>
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label="Maximum runtime"
            >
              {[
                { value: null, label: "Any length" },
                { value: 30, label: "30 minutes" },
                { value: 90, label: "90 minutes" },
                { value: 120, label: "Two hours" },
              ].map((option) => (
                <Button
                  key={option.label}
                  size="sm"
                  variant="tertiary"
                  aria-pressed={maxRuntime === option.value}
                  className={`min-h-11 min-w-0 border px-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E] ${maxRuntime === option.value ? "border-[#E0B15C]/55 bg-[#E0B15C]/12 text-[#F7EAD2]" : "border-[#E0B15C]/10 text-[#EAD9BC]"}`}
                  onPress={() => onMaxRuntimeChange(option.value)}
                >
                  {maxRuntime === option.value ? <span aria-hidden="true">✓</span> : null}{option.label}
                </Button>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="mt-5 flex flex-col gap-4 border-t border-[#E0B15C]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#DAC49F]" role="status" aria-live="polite">{selectionSummary}</p>
        <Button size="lg" className="app-primary-button session-deal-button h-11 w-full px-6 sm:w-auto" isPending={isGenerating} isDisabled={isGenerateDisabled} onPress={onGenerate}>
          {generateLabel}
        </Button>
      </div>
    </section>
  );
}
