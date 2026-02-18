import { Button, Spinner } from "@heroui/react";

export function SessionLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#D4AF37]">
      <div className="flex items-center gap-3">
        <Spinner color="warning" size="sm" />
        Loading session setup...
      </div>
    </div>
  );
}

export function SessionUnavailableState({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#070707] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[#7B1E2B]/40 bg-[#0F0F10] p-6">
        <h1 className="text-2xl text-[#D4AF37]">Session unavailable</h1>
        <p className="text-sm text-[#A0A0A0]">
          A group is required before starting a session.
        </p>
        <Button
          className="w-fit border-[#D4AF37]/50 bg-[#D4AF37] text-[#111111]"
          onPress={onGoHome}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
