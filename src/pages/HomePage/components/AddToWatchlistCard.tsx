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
        queryKey: ["watchlist-library", selectedGroupId],
      });
      queryClient.invalidateQueries({
        queryKey: ["watchlist", selectedGroupId],
      });
    },
  });

  return (
    <Card className="border border-[#E0B15C]/20 bg-[#22130F]">
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-white">Add to Watchlist</h2>
          <p className="text-sm text-[#D9C7A8]">Search or add manually.</p>
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
            <div className="flex items-center gap-2 text-sm text-[#D9C7A8]">
              <Spinner size="sm" color="warning" /> Searching...
            </div>
          ) : null}
          {tmdbResults.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-[#E0B15C]/10 bg-black/40 p-2">
              {tmdbResults.map((item) => (
                <button
                  key={`${item.tmdb_id}-${item.media_type}`}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-[#E0B15C]/30 hover:bg-[#E0B15C]/5"
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
                    <p className="text-xs text-[#D9C7A8]">
                      {item.media_type.toUpperCase()}{" "}
                      {item.year ? `• ${item.year}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-[#E0B15C]">Add</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="bordered"
            className="border-[#E0B15C]/50 text-[#E0B15C] hover:bg-[#E0B15C]/10 uppercase"
            onPress={onOpenManual}
            isDisabled={isManualDisabled}
          >
            Add manually
          </Button>
          {addTmdbMutation.isError ? (
            <p className="text-sm text-[#D77B69]">
              Unable to add to watchlist.
            </p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
