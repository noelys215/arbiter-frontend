export type InviteFailureReason =
  | "expired"
  | "revoked"
  | "invalid"
  | "unauthorized"
  | "temporary";

type ApiError = Error & {
  detail?: string;
  status?: number;
};

export type InviteFailurePresentation = {
  eyebrow: string;
  headline: string;
  body: string;
};

export function classifyInviteError(error: Error | null): InviteFailureReason {
  const apiError = error as ApiError | null;
  const detail = apiError?.detail;

  if (detail === "expired_invite") return "expired";
  if (detail === "revoked_invite") return "revoked";
  if (detail === "invalid_invite" || detail === "used_invite") return "invalid";
  if (apiError?.status === 403) return "unauthorized";
  if (apiError?.status === 404 || apiError?.status === 409) return "invalid";
  return "temporary";
}

export function failurePresentation(
  reason: InviteFailureReason,
): InviteFailurePresentation {
  switch (reason) {
    case "expired":
      return {
        eyebrow: "Invitation expired",
        headline: "This invitation has expired.",
        body: "Ask the person who sent it to share a new one.",
      };
    case "revoked":
      return {
        eyebrow: "Invitation unavailable",
        headline: "This invitation is no longer available.",
        body: "The person who sent it may have shared a newer invitation.",
      };
    case "unauthorized":
      return {
        eyebrow: "Invitation unavailable",
        headline: "This invitation is for someone else.",
        body: "Sign in with the account this invitation was sent to.",
      };
    case "invalid":
      return {
        eyebrow: "Invitation unavailable",
        headline: "This invitation can’t be opened.",
        body: "Check the link, or ask the person who sent it for a new invitation.",
      };
    case "temporary":
      return {
        eyebrow: "Invitation unavailable",
        headline: "We couldn’t open this invitation.",
        body: "Please try again in a moment.",
      };
  }
}
