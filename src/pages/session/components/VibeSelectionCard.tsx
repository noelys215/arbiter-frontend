import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Textarea,
} from "@heroui/react";
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
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <CardHeader className="flex flex-col items-start gap-3">
        <div>
          <p className="session-title-micro text-xs text-[#E0B15C]/70">
            Select a Vibe
          </p>
          <h2 className="text-2xl text-[#F5D9A5]">
            Curate the mood before the deal
          </h2>
          <p className="mt-1 text-sm text-[#D9C7A8]">
            Tags are generated from TMDB genres and runtime buckets currently in{" "}
            {selectedGroupName}&apos;s watchlist. Use tags or AI mood text to
            build the deck.
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
                ? "bg-[#E0B15C] text-[#161616]"
                : "border-[#E0B15C]/35 text-[#E0B15C]"
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
                ? "bg-[#E0B15C] text-[#161616]"
                : "border-[#E0B15C]/35 text-[#E0B15C]"
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
                        ? "bg-[#E0B15C] text-[#161616]"
                        : "border-[#E0B15C]/35 text-[#E0B15C]"
                    }
                    onPress={() => onToggleTag(tag)}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#E0B15C]/20 bg-black/30 p-4">
              <p className="text-sm text-[#E0B15C]">
                No vibe tags available yet
              </p>
              <p className="mt-1 text-xs text-[#D9C7A8]">
                Add more TMDB titles with genre/runtime metadata, or use AI mood
                input to infer a match.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-[#E0B15C]/20 bg-black/40 p-4">
            <p className="text-sm text-[#E0B15C]">Arbiter AI Mood Input</p>
            <p className="mt-1 text-xs text-[#D9C7A8]">
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
                label: "text-[#E0B15C]/80",
                input:
                  "!text-[#F5F5F5] placeholder:text-white/35 caret-[#E0B15C]",
                inputWrapper:
                  "!bg-[#1A100E] !text-[#F5F5F5] border-[#E0B15C]/20 data-[hover=true]:border-[#E0B15C]/45 data-[focus=true]:!bg-[#1A100E] data-[focus-visible=true]:!bg-[#1A100E] data-[focus=true]:border-[#E0B15C]/55",
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
                  base: "border-[#E0B15C]/40",
                  content: "text-[#E0B15C]",
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-widest text-[#D9C7A8]">
            {selectedTags.length} selected · {availableGenreTags.length}{" "}
            available · {sessionContext.tags.length} AI inferred
          </div>
          <Button
            size="lg"
            className="session-title-micro border border-[#E0B15C]/50 bg-[#E0B15C] text-[#111111]"
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
