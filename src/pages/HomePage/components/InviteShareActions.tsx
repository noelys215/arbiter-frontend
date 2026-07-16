import { Button } from "@heroui/react";
import { useState } from "react";

type InviteShareActionsProps = {
  path: string;
  code: string;
  title: string;
  text: string;
};

export default function InviteShareActions({
  path,
  code,
  title,
  text,
}: InviteShareActionsProps) {
  const [feedback, setFeedback] = useState("");
  const link = `${window.location.origin}${path}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setFeedback("Invite link copied.");
    } catch {
      setFeedback("Couldn’t copy the link. Select and copy it manually.");
    }
  };

  const share = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, text, url: link });
      setFeedback("Invite shared.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyLink();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="app-primary-button" onPress={() => void share()}>
          Share invite
        </Button>
        <Button className="app-outline-button" variant="bordered" onPress={() => void copyLink()}>
          Copy link
        </Button>
      </div>
      <details className="text-sm app-text-secondary">
        <summary className="cursor-pointer py-2 font-medium text-[#EAD9BC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2C16E]">
          Use the invite code instead
        </summary>
        <p className="mt-2 font-mono text-[#F5D9A5]" aria-label={`Invite code ${code}`}>
          {code}
        </p>
      </details>
      <p className="min-h-5 text-sm app-text-metadata" aria-live="polite">
        {feedback}
      </p>
    </div>
  );
}
