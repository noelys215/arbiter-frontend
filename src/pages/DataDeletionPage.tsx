import SkipLink from "../components/SkipLink";
import { DataDeletionContent } from "./legalContent";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#140C0A] px-6 py-12 text-[#F7F1E3]">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl"
      >
        <DataDeletionContent />
      </main>
    </div>
  );
}
