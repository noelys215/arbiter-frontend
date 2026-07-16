import { apiJson, jsonBody } from "../../lib/api";

export type FeedbackType = "feedback" | "bug" | "feature";
export type FeedbackSource = "landing_footer" | "account_profile";

export type FeedbackDiagnostics = {
  route: string;
  browser: string;
  operating_system: string;
  viewport_width: number;
  viewport_height: number;
  app_version: string;
  submitted_at: string;
  source: FeedbackSource;
  selected_group_id?: string;
  online?: boolean;
};

export type FeedbackRequest = {
  submission_id: string;
  type: FeedbackType;
  message: string;
  allow_contact: boolean;
  contact_email?: string;
  include_diagnostics: boolean;
  diagnostics?: FeedbackDiagnostics;
  website: string;
};

export function submitFeedback(payload: FeedbackRequest) {
  return apiJson<{ ok: true }>("/feedback", {
    method: "POST",
    ...jsonBody(payload),
  });
}
