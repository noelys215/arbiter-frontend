import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Spinner,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { CompletedSession } from "../sessions/sessions.api";
import { getCriteria, getWinner } from "../sessions/historyPresentation";
import { getMoodCues } from "../sessions/moodCues.api";
import { sessionQueryKeys } from "../sessions/sessionQueryKeys";
import { getMovieNightArtwork } from "../movies/movies.api";
import {
  renderMovieNightCard,
  type CardFormat,
  type CardTemplate,
} from "./cardRenderer";

type MovieNightCardDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  night: CompletedSession;
};

export default function MovieNightCardDialog({
  isOpen,
  onOpenChange,
  night,
}: MovieNightCardDialogProps) {
  const [format, setFormat] = useState<CardFormat>("square");
  const [template, setTemplate] = useState<CardTemplate>("editorial");
  const [includeGroupName, setIncludeGroupName] = useState(false);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ blob: Blob; filename: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cuesQuery = useQuery({
    queryKey: sessionQueryKeys.moodCues,
    queryFn: getMoodCues,
    staleTime: Infinity,
  });
  const winner = getWinner(night);
  const artworkQuery = useQuery({
    queryKey: ["movie-night-card-artwork", night.group_id, winner?.id ?? null],
    queryFn: () => getMovieNightArtwork(night.group_id, winner!.id),
    enabled: isOpen && Boolean(winner?.poster_path),
    staleTime: Infinity,
    retry: 1,
  });
  const criteria = getCriteria(night);
  const moodLabels = useMemo(() => {
    const byId = new Map((cuesQuery.data ?? []).map((cue) => [cue.id, cue.label]));
    return (criteria.mood_cues ?? []).map((id) => byId.get(id)).filter((label): label is string => Boolean(label));
  }, [criteria.mood_cues, cuesQuery.data]);

  useEffect(() => {
    if (!isOpen || artworkQuery.isFetching) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await renderMovieNightCard(
          { night, moodLabels, artworkDataUrl: artworkQuery.data ?? null },
          { format, template, includeGroupName, includeMood, includeAttribution },
        );
        if (!active) return;
        const nextUrl = URL.createObjectURL(result.blob);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        setGenerated({ blob: result.blob, filename: result.filename });
      } catch {
        if (active) setError("We couldn’t prepare this card. Try another format or try again.");
      } finally {
        if (active) setIsGenerating(false);
      }
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [artworkQuery.data, artworkQuery.isFetching, format, includeAttribution, includeGroupName, includeMood, isOpen, moodLabels, night, template]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const download = () => {
    if (!generated) return;
    const url = URL.createObjectURL(generated.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generated.filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const share = async () => {
    if (!generated) return;
    const file = new File([generated.blob], generated.filename, { type: "image/png" });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      download();
      return;
    }
    try {
      await navigator.share({ files: [file], title: "Our Arbiter movie night" });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError("Sharing isn’t available right now. You can save the card instead.");
    }
  };

  const radioClassNames = {
    base: "m-0 inline-flex min-h-11 max-w-none items-center rounded-md border border-[#E0B15C]/18 px-3 py-2 data-[selected=true]:border-[#E0B15C]/55 data-[selected=true]:bg-[#E0B15C]/10",
    label: "text-sm text-[#EAD9BC]",
    control: "border-[#E0B15C]/55 after:bg-[#E0B15C]",
  };
  const isPreparing = isGenerating || artworkQuery.isFetching;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-[#080403]/72",
        base: "max-h-[calc(100dvh-1rem)] border border-[#E0B15C]/20 bg-[#1C110F] text-[#F7EAD2] sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg",
        closeButton: "m-2 h-11 w-11 text-[#F7EAD2] hover:bg-[#E0B15C]/10",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex-col gap-1 px-5 pb-2 pt-6 sm:px-7">
              <h2 className="app-heading-serif text-3xl text-[#F7EAD2]">Create a movie night card</h2>
              <p className="text-sm font-normal text-[#D8C5A5]">A private keepsake, ready to save or share.</p>
            </ModalHeader>
            <ModalBody className="grid min-h-0 items-start gap-5 overflow-y-auto px-5 py-3 sm:px-7 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-7">
              <div className="flex h-[min(20rem,42dvh)] min-h-[16rem] items-center justify-center rounded-md border border-[#E0B15C]/14 bg-[#100806] p-3 sm:h-[min(24rem,44dvh)] xl:h-[min(34rem,60dvh)] xl:min-h-[22rem] xl:p-4" aria-label="Movie night card preview">
                {isPreparing ? <Spinner color="warning" label="Preparing card" /> : previewUrl ? (
                  <img src={previewUrl} alt="Preview of the shareable movie night card" className={`h-full max-h-full max-w-full object-contain ${format === "square" ? "aspect-square" : "aspect-[9/16]"}`} />
                ) : null}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:block xl:space-y-7">
                <RadioGroup label="Format" value={format} onValueChange={(value) => setFormat(value as CardFormat)} orientation="horizontal" classNames={{ label: "text-sm font-semibold text-[#F7EAD2]", wrapper: "gap-2" }}>
                  <Radio value="square" classNames={radioClassNames}>Square</Radio>
                  <Radio value="portrait" classNames={radioClassNames}>Portrait</Radio>
                </RadioGroup>
                <RadioGroup label="Style" value={template} onValueChange={(value) => setTemplate(value as CardTemplate)} classNames={{ label: "text-sm font-semibold text-[#F7EAD2]", wrapper: "gap-2" }}>
                  <Radio value="editorial" classNames={radioClassNames}>Editorial poster</Radio>
                  <Radio value="programme" classNames={radioClassNames}>Minimal programme</Radio>
                </RadioGroup>
                <div className="space-y-3 sm:col-span-2 xl:col-span-1" aria-labelledby="card-privacy-heading">
                  <h3 id="card-privacy-heading" className="text-sm font-semibold text-[#F7EAD2]">Include on the card</h3>
                  <div className="flex flex-col items-start gap-2">
                    <Checkbox isSelected={includeGroupName} onValueChange={setIncludeGroupName} classNames={{ label: "text-sm text-[#EAD9BC]", wrapper: "after:bg-[#E0B15C]" }}>Group name</Checkbox>
                    <Checkbox isSelected={includeMood} onValueChange={setIncludeMood} isDisabled={moodLabels.length === 0} classNames={{ label: "text-sm text-[#EAD9BC]", wrapper: "after:bg-[#E0B15C]" }}>Tonight’s mood</Checkbox>
                    <Checkbox isSelected={includeAttribution} onValueChange={setIncludeAttribution} classNames={{ label: "text-sm text-[#EAD9BC]", wrapper: "after:bg-[#E0B15C]" }}>Arbiter attribution</Checkbox>
                  </div>
                  <p className="text-xs leading-5 text-[#CDB58E]">Participant names, avatars, votes, and private links are never included.</p>
                </div>
              </div>
              {error ? <p className="lg:col-span-2 text-sm text-[#F0A494]" role="alert">{error}</p> : null}
            </ModalBody>
            <ModalFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#E0B15C]/12 px-5 py-3 sm:flex sm:px-7 sm:py-4">
              <Button variant="light" className="app-secondary-button order-3 col-span-2 h-11 sm:order-none sm:mr-auto" onPress={onClose}>Close</Button>
              <Button variant="bordered" className="h-11 border-[#E0B15C]/38 text-[#EAD9BC]" onPress={download} isDisabled={!generated || isPreparing}>Save image</Button>
              <Button className="app-primary-button h-11" onPress={() => void share()} isDisabled={!generated || isPreparing}>{"share" in navigator ? "Share card" : "Save card"}</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
