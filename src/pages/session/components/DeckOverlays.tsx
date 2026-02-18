import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import type { DeckPhase } from "../animations";

export function DeckPlaceholderStack({
  deckPhase,
  shuffleSeed,
}: {
  deckPhase: DeckPhase;
  shuffleSeed: number;
}) {
  return [0, 1, 2, 3, 4].map((idx) => {
    const centerOffset = idx - 2;
    const dealing = deckPhase === "dealing";
    const shuffling = deckPhase === "shuffling" || deckPhase === "revealingWinner";

    const baseX = centerOffset * (dealing ? 28 : 18);
    const baseY = centerOffset * 2;
    const baseRotate = centerOffset * (dealing ? 6 : 4);

    const wobbleX = shuffling ? ((shuffleSeed + idx) % 2 === 0 ? 6 : -6) : 0;
    const wobbleRotate = shuffling ? (((shuffleSeed + idx) % 3) - 1) * 3 : 0;

    return (
      <motion.div
        key={`placeholder-${idx}`}
        className={`session-deck-card-size session-placeholder-back absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
          dealing ? "session-placeholder-dealing" : ""
        }`}
        animate={{
          x: baseX + wobbleX,
          y: baseY,
          rotate: baseRotate + wobbleRotate,
          opacity: 0.5 + idx * 0.1,
          scale: 1 - idx * 0.02,
        }}
        transition={{ duration: 0.36, ease: "easeInOut" }}
      />
    );
  });
}

export function WaitingForOthersCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
        <p className="session-title-micro text-xs text-[#D4AF37]/70">Session Sync</p>
        <h4 className="mt-3 text-xl text-[#F2E2AE]">Waiting for others...</h4>
        <p className="mt-2 text-sm text-[#CFCFCF]">
          Your deck is in. We&apos;ll merge both users&apos; decks once everyone
          clicks Continue.
        </p>
        <p className="mt-5 text-xs uppercase tracking-[0.12em] text-[#A0A0A0]">
          Waiting For All Confirmations
        </p>
      </div>
    </motion.div>
  );
}

export function TieBreakCard({ isGroupLeader }: { isGroupLeader: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/30"
    >
      <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
        <p className="session-title-micro text-xs text-[#D4AF37]/70">Tie-Break</p>
        <h4 className="mt-3 text-xl text-[#F2E2AE]">No distinct winner yet</h4>
        {isGroupLeader ? (
          <p className="mt-2 text-sm text-[#CFCFCF]">
            You&apos;re the group leader. Use shuffle to auto-pick the winner.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#CFCFCF]">
            Waiting for the group leader to run the tie-break shuffle.
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function LeaderEndedCard({ onGoHome }: { onGoHome: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="session-deck-card-size session-waiting-card rounded-2xl p-6 text-center">
        <p className="session-title-micro text-xs text-[#D4AF37]/70">Session Ended</p>
        <h4 className="mt-3 text-xl text-[#F2E2AE]">Leader has ended the session</h4>
        <p className="mt-2 text-sm text-[#CFCFCF]">
          Return to home to start or join a new session.
        </p>
        <Button
          size="sm"
          className="mt-5 border border-[#D4AF37]/55 bg-[#D4AF37] text-[#171717]"
          onPress={onGoHome}
        >
          Back to Home
        </Button>
      </div>
    </motion.div>
  );
}
