import type { CardTemplate } from "./cardModel";

export default function CardTemplateThumbnail({
  template,
}: {
  template: CardTemplate;
}) {
  if (template === "cinematic-poster") {
    return (
      <span
        aria-hidden="true"
        className="relative block aspect-[4/3] overflow-hidden bg-[#100907]"
      >
        <span className="absolute inset-y-0 right-0 w-[62%] bg-[#5E3A2A]" />
        <span className="absolute inset-y-0 left-[38%] w-[38%] bg-linear-to-r from-[#100907] to-transparent" />
        <span className="absolute left-3 top-3 h-1 w-9 bg-[#E0B15C]/70" />
        <span className="absolute bottom-6 left-3 h-2 w-16 bg-[#F7EAD2]" />
        <span className="absolute bottom-3 left-3 h-1 w-10 bg-[#D1B78F]/65" />
      </span>
    );
  }
  if (template === "editorial-programme") {
    return (
      <span
        aria-hidden="true"
        className="relative block aspect-[4/3] overflow-hidden bg-[#18100E] p-3"
      >
        <span className="block h-px bg-[#E0B15C]/55" />
        <span className="mt-3 block h-2 w-[76%] bg-[#F7EAD2]" />
        <span className="mt-1 block h-2 w-[56%] bg-[#F7EAD2]" />
        <span className="absolute inset-x-3 bottom-3 h-[28%] bg-[#5E3A2A]" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative block aspect-[4/3] overflow-hidden bg-[#1C110F] p-3"
    >
      <span className="block h-px bg-[#E0B15C]/55" />
      <span className="mt-3 grid grid-cols-[30%_1fr] gap-3">
        <span className="h-14 bg-[#5E3A2A]" />
        <span className="space-y-2 pt-1">
          <span className="block h-2 bg-[#F7EAD2]" />
          <span className="block h-1 w-3/4 bg-[#D1B78F]/70" />
          <span className="block h-px bg-[#E0B15C]/35" />
        </span>
      </span>
    </span>
  );
}

