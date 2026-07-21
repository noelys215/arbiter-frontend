type LazyLoadingStateProps = {
  label: string;
  overlay?: boolean;
};

export default function LazyLoadingState({
  label,
  overlay = false,
}: LazyLoadingStateProps) {
  return (
    <div
      className={
        overlay
          ? "fixed inset-0 z-50 grid place-items-center bg-[#080403]/72 px-4"
          : "grid min-h-screen place-items-center bg-[#140C0A] px-4"
      }
    >
      <div
        className="flex min-h-11 items-center gap-3 text-sm text-[#EAD9BC]"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-[#E0B15C]/30 border-t-[#E0B15C] motion-reduce:animate-none"
        />
        {label}
      </div>
    </div>
  );
}
