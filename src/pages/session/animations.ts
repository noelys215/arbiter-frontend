export type DeckPhase =
  | "idle"
  | "dealing"
  | "shuffling"
  | "ready"
  | "revealingWinner";

type SetDeckPhase = (phase: DeckPhase) => void;
type SetShuffleSeed = (updater: (value: number) => number) => void;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

type PlayDeckShuffleOptions = {
  setDeckPhase: SetDeckPhase;
  setShuffleSeed: SetShuffleSeed;
  phase: "shuffling" | "revealingWinner";
  durationMs?: number;
  beatMs?: number;
};

export async function playDeckShuffleAnimation({
  setDeckPhase,
  setShuffleSeed,
  phase,
  durationMs = 900,
  beatMs = 95,
}: PlayDeckShuffleOptions) {
  setDeckPhase(phase);
  const totalBeats = Math.max(1, Math.floor(durationMs / beatMs));

  for (let beat = 0; beat < totalBeats; beat += 1) {
    setShuffleSeed((value) => value + 1);
    await sleep(beatMs);
  }
}

type RevealWinnerOptions = {
  winnerWatchlistItemId: string;
  setDeckPhase: SetDeckPhase;
  setShuffleSeed: SetShuffleSeed;
  setWinnerWatchlistItemId: (id: string) => void;
  durationMs?: number;
};

export async function revealWinnerAfterShuffle({
  winnerWatchlistItemId,
  setDeckPhase,
  setShuffleSeed,
  setWinnerWatchlistItemId,
  durationMs = 1100,
}: RevealWinnerOptions) {
  await playDeckShuffleAnimation({
    setDeckPhase,
    setShuffleSeed,
    phase: "revealingWinner",
    durationMs,
  });

  setWinnerWatchlistItemId(winnerWatchlistItemId);
  setDeckPhase("ready");
}
