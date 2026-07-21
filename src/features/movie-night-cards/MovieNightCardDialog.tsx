import { Button, Disclosure, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import AppModal, {
  AppModalBody,
  AppModalFooter,
  AppModalHeader,
  AppModalHeading,
} from "../../components/ui/AppModal";
import {
  AppCheckbox,
  AppRadio,
  AppRadioGroup,
} from "../../components/ui/AppSelection";
import type { CompletedSession } from "../sessions/sessions.api";
import { getCriteria, getWinner } from "../sessions/historyPresentation";
import { getMoodCues } from "../sessions/moodCues.api";
import { sessionQueryKeys } from "../sessions/sessionQueryKeys";
import { getMovieNightArtwork } from "../movies/movies.api";
import {
  analyzeArtworkDataUrl,
  selectArtworkKind,
  type ArtworkKind,
} from "./artworkAnalysis";
import { loadCardDisplayFont } from "./cardFonts";
import {
  CARD_DIMENSIONS,
  CARD_TEMPLATES,
  cardSummary,
  createSafeCardPayload,
  normalizeCardTemplate,
  type CardFormat,
  type CardOptions,
  type CardTemplate,
  type SafeCardPayload,
} from "./cardModel";
import CardTemplateThumbnail from "./CardTemplateThumbnail";

type MovieNightCardDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  night: CompletedSession;
};

type ExportResult = {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
};

const PREFERENCES_KEY = "arbiter:movie-night-card-preferences";

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}") as {
      format?: string;
      template?: string;
    };
    return {
      format: value.format === "portrait" ? "portrait" : "square",
      template: normalizeCardTemplate(value.template),
    } satisfies { format: CardFormat; template: CardTemplate };
  } catch {
    return {
      format: "square",
      template: "cinematic-poster",
    } satisfies { format: CardFormat; template: CardTemplate };
  }
}

function triggerDownload(result: ExportResult) {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function FormatGlyph({ format }: { format: CardFormat }) {
  return (
    <span
      aria-hidden="true"
      className={`block border border-[#E0B15C]/55 bg-[#100806] ${
        format === "square" ? "h-7 w-7" : "h-8 w-[18px]"
      }`}
    />
  );
}

export default function MovieNightCardDialog({
  isOpen,
  onOpenChange,
  night,
}: MovieNightCardDialogProps) {
  const initialPreferences = useMemo(readPreferences, []);
  const [format, setFormat] = useState<CardFormat>(initialPreferences.format);
  const [template, setTemplate] = useState<CardTemplate>(
    initialPreferences.template,
  );
  const [includeGroupName, setIncludeGroupName] = useState(false);
  const [includeMood, setIncludeMood] = useState(true);
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [activeAction, setActiveAction] = useState<
    "download" | "share" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const exportCache = useRef<{ key: string; result: ExportResult } | null>(null);
  const reduceMotion = useReducedMotion();
  const winner = getWinner(night);
  const criteria = getCriteria(night);

  const cuesQuery = useQuery({
    queryKey: sessionQueryKeys.moodCues,
    queryFn: getMoodCues,
    staleTime: Infinity,
  });
  const fontQuery = useQuery({
    queryKey: ["movie-night-card-display-font"],
    queryFn: loadCardDisplayFont,
    enabled: isOpen,
    staleTime: Infinity,
  });
  const moodLabels = useMemo(() => {
    const byId = new Map(
      (cuesQuery.data ?? []).map((cue) => [cue.id, cue.label]),
    );
    return (criteria.mood_cues ?? [])
      .map((id) => byId.get(id))
      .filter((label): label is string => Boolean(label));
  }, [criteria.mood_cues, cuesQuery.data]);

  const preferredArtworkKind = useMemo(
    () =>
      winner
        ? selectArtworkKind({
            template,
            format,
            hasPoster: Boolean(winner.poster_path),
            canRequestBackdrop: Boolean(
              winner.backdrop_path ||
                (winner.source === "tmdb" && winner.source_id),
            ),
            titleLength: winner.title.length,
          })
        : null,
    [format, template, winner],
  );
  const artworkQuery = useQuery({
    queryKey: [
      "movie-night-card-artwork",
      night.group_id,
      winner?.id ?? null,
      preferredArtworkKind,
    ],
    queryFn: async () => {
      if (!winner || !preferredArtworkKind) return null;
      try {
        return {
          dataUrl: await getMovieNightArtwork(
            night.group_id,
            winner.id,
            preferredArtworkKind,
          ),
          kind: preferredArtworkKind,
        };
      } catch {
        if (preferredArtworkKind === "backdrop" && winner.poster_path) {
          return {
            dataUrl: await getMovieNightArtwork(
              night.group_id,
              winner.id,
              "poster",
            ),
            kind: "poster" as ArtworkKind,
          };
        }
        return null;
      }
    },
    enabled: isOpen && Boolean(winner && preferredArtworkKind),
    staleTime: Infinity,
    retry: 1,
  });
  const artworkAnalysisQuery = useQuery({
    queryKey: [
      "movie-night-card-artwork-analysis",
      night.group_id,
      winner?.id ?? null,
      artworkQuery.data?.kind ?? null,
    ],
    queryFn: () => analyzeArtworkDataUrl(artworkQuery.data!.dataUrl),
    enabled: Boolean(artworkQuery.data?.dataUrl),
    staleTime: Infinity,
  });

  const options = useMemo<CardOptions>(
    () => ({
      format,
      template,
      includeGroupName,
      includeMood,
      includeAttribution,
    }),
    [format, includeAttribution, includeGroupName, includeMood, template],
  );
  const payload = useMemo<SafeCardPayload | null>(() => {
    if (!winner) return null;
    return createSafeCardPayload(
      {
        night,
        moodLabels,
        artworkDataUrl: artworkQuery.data?.dataUrl ?? null,
        artworkKind: artworkQuery.data?.kind ?? null,
        artworkAnalysis: artworkAnalysisQuery.data ?? null,
      },
      options,
    );
  }, [
    artworkAnalysisQuery.data,
    artworkQuery.data,
    moodLabels,
    night,
    options,
    winner,
  ]);

  useEffect(() => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ format, template }),
    );
  }, [format, template]);

  useEffect(() => {
    if (!isOpen || !payload || fontQuery.isFetching) return;
    let active = true;
    setIsComposing(true);
    setError(null);
    void import("./cardRenderer")
      .then(({ buildMovieNightCardSvg }) => {
        if (!active) return;
        const svg = buildMovieNightCardSvg(payload, options, {
          displayFontDataUrl: fontQuery.data,
        });
        const nextUrl = URL.createObjectURL(
          new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        );
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
        exportCache.current = null;
      })
      .catch(() => {
        if (active) setError("We couldn’t prepare this card. Try another style.");
      })
      .finally(() => {
        if (active) setIsComposing(false);
      });
    return () => {
      active = false;
    };
  }, [fontQuery.data, fontQuery.isFetching, isOpen, options, payload]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const generationKey = [
    previewUrl ?? "no-preview",
    format,
    template,
    includeGroupName,
    includeMood,
    includeAttribution,
  ].join(":");
  const ensureExport = async () => {
    if (!payload || !previewUrl) {
      throw new Error("The card is still being prepared.");
    }
    if (exportCache.current?.key === generationKey) {
      return exportCache.current.result;
    }
    const { exportMovieNightCard } = await import("./cardExport");
    const result = await exportMovieNightCard(payload, options, fontQuery.data);
    exportCache.current = { key: generationKey, result };
    return result;
  };

  const download = async () => {
    if (activeAction) return;
    setActiveAction("download");
    setError(null);
    setStatus("Preparing your download…");
    try {
      const result = await ensureExport();
      triggerDownload(result);
      setStatus("Card downloaded.");
    } catch {
      setError("We couldn’t download this card. Please try again.");
      setStatus(null);
    } finally {
      setActiveAction(null);
    }
  };

  const share = async () => {
    if (activeAction) return;
    setActiveAction("share");
    setError(null);
    setStatus("Preparing your card to share…");
    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }
      const result = await ensureExport();
      const file = new File([result.blob], result.filename, {
        type: "image/png",
      });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        triggerDownload(result);
        setStatus("Sharing isn’t supported here, so the card was downloaded.");
        return;
      }
      await navigator.share({
        files: [file],
        title: "An Arbiter movie night",
        text: "We chose this together.",
      });
      setStatus("Card shared.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        setStatus(null);
        return;
      }
      setError("We couldn’t share this card. You can download it instead.");
      setStatus(null);
    } finally {
      setActiveAction(null);
    }
  };

  const isPreviewBusy = isComposing || fontQuery.isFetching;
  const summary = payload ? cardSummary(payload, options) : "Movie night card";
  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      ariaLabel="Create a movie night card"
      ariaDescribedBy="movie-card-description"
      size="lg"
      placement="auto"
      classes={{
        backdrop: "bg-[#080403]/76",
        container: "max-sm:p-0",
        dialog:
          "h-[100dvh] max-h-[100dvh] !max-w-[74rem] border border-[#E0B15C]/20 bg-[#1A100E] text-[#F7EAD2] max-sm:rounded-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg",
        closeButton:
          "m-2 h-11 w-11 text-[#F7EAD2] hover:bg-[#E0B15C]/10 focus-visible:ring-3 focus-visible:ring-[#F2C16E]",
      }}
    >
      {(onClose) => (
        <>
          <AppModalHeader className="flex-col items-start gap-0.5 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
            <AppModalHeading className="app-heading-serif pr-12 text-3xl leading-tight text-[#F7EAD2] sm:text-4xl">
              Create a movie night card
            </AppModalHeading>
            <p
              id="movie-card-description"
              className="text-sm font-normal text-[#D8C5A5]"
            >
              A keepsake from tonight’s choice.
            </p>
          </AppModalHeader>

          <AppModalBody className="grid min-h-0 gap-5 overflow-y-auto px-5 py-3 sm:px-7 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-7">
            <section
              className="flex min-h-[19rem] items-center justify-center border border-[#E0B15C]/12 bg-[#0D0807] p-3 sm:min-h-[26rem] xl:sticky xl:top-0 xl:h-[min(40rem,68dvh)] xl:p-5"
              aria-label="Movie night card preview"
            >
              {isPreviewBusy ? (
                <span className="flex items-center gap-3" role="status">
                  <Spinner color="warning" size="sm" />
                  <span className="text-sm text-[#D8C5A5]">
                    Composing your card…
                  </span>
                </span>
              ) : previewUrl ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={previewUrl}
                    src={previewUrl}
                    alt=""
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                    transition={{ duration: reduceMotion ? 0 : 0.24 }}
                    className={`max-h-full max-w-full object-contain shadow-[0_22px_60px_rgb(0_0_0/0.28)] ${
                      format === "square" ? "aspect-square" : "aspect-[9/16]"
                    }`}
                  />
                </AnimatePresence>
              ) : (
                <p className="text-sm text-[#D8C5A5]" role="status">
                  Preparing the preview…
                </p>
              )}
            </section>

            <div className="space-y-6 pb-2">
              <AppRadioGroup
                name="card-format"
                label="Format"
                value={format}
                onChange={(value) => setFormat(value as CardFormat)}
                orientation="horizontal"
                className="grid grid-cols-2 gap-2"
                labelClassName="col-span-2 text-sm font-semibold text-[#F7EAD2]"
              >
                {(["square", "portrait"] as const).map((value) => {
                  const dimensions = CARD_DIMENSIONS[value];
                  return (
                    <AppRadio
                      key={value}
                      value={value}
                      className="group min-h-16 max-w-none rounded-md border border-[#E0B15C]/18 bg-[#140C0A] p-0 outline-none transition data-[focus-visible=true]:ring-3 data-[focus-visible=true]:ring-[#F2C16E] data-[selected=true]:border-[#E0B15C]/70 data-[selected=true]:bg-[#E0B15C]/10"
                      labelClassName="flex w-full items-center gap-3 px-3 py-2"
                      controlClassName="sr-only"
                    >
                      <FormatGlyph format={value} />
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-semibold text-[#F7EAD2]">
                          {value === "square" ? "Square" : "Portrait"}
                        </span>
                        <span className="block text-[0.7rem] text-[#CDB58E]">
                          {dimensions.width} × {dimensions.height}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="ml-auto text-[#E0B15C] opacity-0 group-data-[selected=true]:opacity-100"
                      >
                        ✓
                      </span>
                    </AppRadio>
                  );
                })}
              </AppRadioGroup>

              <AppRadioGroup
                name="card-template"
                label="Style"
                value={template}
                onChange={(value) =>
                  setTemplate(normalizeCardTemplate(value))
                }
                className="gap-2"
                labelClassName="text-sm font-semibold text-[#F7EAD2]"
              >
                {CARD_TEMPLATES.map((item) => (
                  <AppRadio
                    key={item.value}
                    value={item.value}
                    className="group max-w-none overflow-hidden rounded-md border border-[#E0B15C]/18 bg-[#140C0A] p-0 outline-none transition data-[focus-visible=true]:ring-3 data-[focus-visible=true]:ring-[#F2C16E] data-[selected=true]:border-[#E0B15C]/70 data-[selected=true]:bg-[#E0B15C]/8"
                    labelClassName="grid w-full grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 p-2"
                    controlClassName="sr-only"
                  >
                    <CardTemplateThumbnail template={item.value} />
                    <span className="min-w-0 text-left">
                      <span className="flex items-center gap-2 text-sm font-semibold text-[#F7EAD2]">
                        {item.label}
                        <span
                          aria-hidden="true"
                          className="text-[#E0B15C] opacity-0 group-data-[selected=true]:opacity-100"
                        >
                          ✓
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-[#CDB58E]">
                        {item.description}
                      </span>
                    </span>
                  </AppRadio>
                ))}
              </AppRadioGroup>

              <Disclosure className="border-y border-[#E0B15C]/12 py-1">
                <Disclosure.Heading>
                  <Disclosure.Trigger className="flex min-h-11 w-full items-center justify-between rounded-sm px-1 text-sm font-semibold text-[#F7EAD2] outline-none focus-visible:ring-3 focus-visible:ring-[#F2C16E]">
                    Card details
                    <Disclosure.Indicator className="h-4 w-4 text-[#E0B15C]" />
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="space-y-3 px-1 pb-4 pt-2">
                    <AppCheckbox
                      selected={includeGroupName}
                      onChange={setIncludeGroupName}
                      className="min-h-11"
                      labelClassName="text-sm text-[#EAD9BC]"
                      controlClassName="after:bg-[#E0B15C]"
                    >
                      Group name
                    </AppCheckbox>
                    <AppCheckbox
                      selected={includeMood}
                      onChange={setIncludeMood}
                      isDisabled={moodLabels.length === 0}
                      className="min-h-11"
                      labelClassName="text-sm text-[#EAD9BC]"
                      controlClassName="after:bg-[#E0B15C]"
                    >
                      Tonight’s mood
                    </AppCheckbox>
                    <AppCheckbox
                      selected={includeAttribution}
                      onChange={setIncludeAttribution}
                      className="min-h-11"
                      labelClassName="text-sm text-[#EAD9BC]"
                      controlClassName="after:bg-[#E0B15C]"
                    >
                      Arbiter attribution
                    </AppCheckbox>
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>

              <p className="text-xs leading-5 text-[#CDB58E]">
                Names, votes, and private links are never included.
              </p>
              <p className="sr-only" aria-live="polite">
                {summary}
              </p>
            </div>

            {error ? (
              <p
                className="text-sm text-[#F0A494] xl:col-span-2"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <p className="sr-only" role="status" aria-live="polite">
              {status}
            </p>
          </AppModalBody>

          <AppModalFooter className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-[#E0B15C]/12 bg-[#1A100E] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex sm:px-7 sm:py-4">
            <Button
              variant="tertiary"
              className="app-secondary-button h-11 px-3 sm:mr-auto"
              onPress={onClose}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              className="app-outline-button h-11"
              onPress={() => void download()}
              isDisabled={!previewUrl || isPreviewBusy || Boolean(activeAction)}
              isPending={activeAction === "download"}
            >
              {activeAction === "download" ? "Preparing…" : "Download"}
            </Button>
            <Button
              className="app-primary-button h-11"
              onPress={() => void share()}
              isDisabled={!previewUrl || isPreviewBusy || Boolean(activeAction)}
              isPending={activeAction === "share"}
            >
              {activeAction === "share" ? "Preparing…" : "Share"}
            </Button>
          </AppModalFooter>
        </>
      )}
    </AppModal>
  );
}
