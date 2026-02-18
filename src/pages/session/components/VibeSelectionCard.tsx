import { Button, Card, CardBody, CardHeader, Chip, Textarea } from "@heroui/react";
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
  return (
    <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
      <CardHeader className="flex flex-col items-start gap-3">
        <div>
          <p className="session-title-micro text-xs text-[#D4AF37]/70">
            Select a Vibe
          </p>
          <h2 className="text-2xl text-[#F2E2AE]">
            Curate the mood before the deal
          </h2>
          <p className="mt-1 text-sm text-[#A0A0A0]">
            Tags are generated from TMDB genres currently in {selectedGroupName}
            &apos;s watchlist. Use tags or AI mood text to build the deck.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={vibeInputMode === "tags" ? "solid" : "bordered"}
            className={
              vibeInputMode === "tags"
                ? "bg-[#D4AF37] text-[#161616]"
                : "border-[#D4AF37]/35 text-[#D4AF37]"
            }
            onPress={() => onVibeInputModeChange("tags")}
          >
            Use Tags
          </Button>
          <Button
            size="sm"
            variant={vibeInputMode === "ai" ? "solid" : "bordered"}
            className={
              vibeInputMode === "ai"
                ? "bg-[#D4AF37] text-[#161616]"
                : "border-[#D4AF37]/35 text-[#D4AF37]"
            }
            onPress={() => onVibeInputModeChange("ai")}
          >
            Use AI Mood
          </Button>
        </div>

        {vibeInputMode === "tags" ? (
          availableGenreTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableGenreTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <Button
                    key={tag}
                    size="sm"
                    variant={selected ? "solid" : "bordered"}
                    className={
                      selected
                        ? "bg-[#D4AF37] text-[#161616]"
                        : "border-[#D4AF37]/35 text-[#D4AF37]"
                    }
                    onPress={() => onToggleTag(tag)}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#D4AF37]/20 bg-black/30 p-4">
              <p className="text-sm text-[#D4AF37]">
                No TMDB genre tags available yet
              </p>
              <p className="mt-1 text-xs text-[#A0A0A0]">
                Add more TMDB titles to the watchlist, or use AI mood input to
                infer a genre match.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-[#D4AF37]/20 bg-black/40 p-4">
            <p className="text-sm text-[#D4AF37]">Arbiter AI Mood Input</p>
            <p className="mt-1 text-xs text-[#A0A0A0]">
              Describe your mood. Arbiter uses backend OpenAI parsing to infer
              tags and build your deck.
            </p>
            <Textarea
              aria-label="Describe your mood"
              placeholder='Example: "Cozy sci-fi with emotional stakes, nothing too long."'
              value={aiMoodInput}
              onValueChange={onAiMoodInputChange}
              minRows={3}
              className="mt-3"
              classNames={{
                label: "text-[#D4AF37]/80",
                input:
                  "!text-[#F5F5F5] placeholder:text-white/35 caret-[#D4AF37]",
                inputWrapper:
                  "!bg-[#090909] !text-[#F5F5F5] border-[#D4AF37]/20 data-[hover=true]:border-[#D4AF37]/45 data-[focus=true]:!bg-[#090909] data-[focus-visible=true]:!bg-[#090909] data-[focus=true]:border-[#D4AF37]/55",
              }}
            />
          </div>
        )}

        {sessionContext.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sessionContext.tags.map((tag) => (
              <Chip
                key={tag}
                variant="bordered"
                classNames={{
                  base: "border-[#D4AF37]/40",
                  content: "text-[#D4AF37]",
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-[0.1em] text-[#A0A0A0]">
            {selectedTags.length} selected · {availableGenreTags.length}{" "}
            available · {sessionContext.tags.length} AI inferred
          </div>
          <Button
            size="lg"
            className="session-title-micro border border-[#D4AF37]/50 bg-[#D4AF37] text-[#111111]"
            isLoading={isGenerating}
            isDisabled={isGenerateDisabled}
            onPress={onGenerate}
          >
            {generateLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
