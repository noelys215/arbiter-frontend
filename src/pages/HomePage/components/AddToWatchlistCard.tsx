import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Spinner,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { addTmdbToWatchlist } from "../../../features/watchlist/watchlist.api";
import type { TmdbSearchResult } from "../../../features/watchlist/watchlist.api";
import type { InputClassNames } from "../types";

type AddToWatchlistCardProps = {
  selectedGroupId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  tmdbResults: TmdbSearchResult[];
  isSearching: boolean;
  onClearSearch: () => void;
  onOpenManual: () => void;
  isManualDisabled: boolean;
  inputClassNames: InputClassNames;
  renderPoster: (posterPath?: string | null, altText?: string) => ReactNode;
};

export default function AddToWatchlistCard({
  selectedGroupId,
  search,
  onSearchChange,
  tmdbResults,
  isSearching,
  onClearSearch,
  onOpenManual,
  isManualDisabled,
  inputClassNames,
  renderPoster,
}: AddToWatchlistCardProps) {
  const queryClient = useQueryClient();
  const addTmdbMutation = useMutation({
    mutationFn: (item: TmdbSearchResult) =>
      addTmdbToWatchlist(selectedGroupId ?? "", item),
    onSuccess: () => {
      onClearSearch();
      queryClient.invalidateQueries({
        queryKey: ["watchlist", selectedGroupId],
      });
    },
  });

  return (
    <Card className="border border-[#D4AF37]/20 bg-[#0F0F10]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-white">Add to Watchlist</h2>
          <p className="text-sm text-[#A0A0A0]">Search TMDB or add manually.</p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="space-y-2">
          <Input
            label="Search TMDB"
            placeholder="Search movies or TV shows"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            variant="bordered"
            classNames={inputClassNames}
          />
          {isSearching ? (
            <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
              <Spinner size="sm" color="warning" /> Searching...
            </div>
          ) : null}
          {tmdbResults.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-[#D4AF37]/10 bg-black/40 p-2">
              {tmdbResults.map((item) => (
                <button
                  key={`${item.tmdb_id}-${item.media_type}`}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
                  onClick={() => {
                    if (!selectedGroupId) return;
                    addTmdbMutation.mutate(item);
                  }}
                >
                  {renderPoster(item.poster_path ?? null, item.title)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#A0A0A0]">
                      {item.media_type.toUpperCase()}{" "}
                      {item.year ? `• ${item.year}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-[#D4AF37]">Add</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="bordered"
            className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            onPress={onOpenManual}
            isDisabled={isManualDisabled}
          >
            Add manually
          </Button>
          {addTmdbMutation.isError ? (
            <p className="text-sm text-[#7B1E2B]">
              Unable to add to watchlist.
            </p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
