import { Button, Spinner } from "@heroui/react";

export function SessionLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#140C0A] text-[#E0B15C]">
      <div className="flex items-center gap-3">
        <Spinner color="warning" size="sm" />
        Loading session setup...
      </div>
    </div>
  );
}

export function SessionUnavailableState({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#140C0A] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[#D77B69]/40 bg-[#22130F] p-6">
        <h1 className="text-2xl text-[#E0B15C]">Session unavailable</h1>
        <p className="text-sm text-[#D9C7A8]">
          A group is required before starting a session.
        </p>
        <Button
          className="w-fit border-[#E0B15C]/50 bg-[#E0B15C] text-[#111111]"
          onPress={onGoHome}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
