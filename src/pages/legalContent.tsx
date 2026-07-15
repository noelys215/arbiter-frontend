import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export const LEGAL_LAST_UPDATED = "February 11, 2026";
export const PRIVACY_EMAIL = "privacy@arbitertv.com";

type LegalContentProps = {
  linkMode?: "modal" | "route";
  onOpenDataDeletion?: () => void;
  onOpenPrivacy?: () => void;
};

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-[#F5D9A5]">{title}</h2>
      <div className="text-sm leading-7 text-[#D9C7A8]">{children}</div>
    </section>
  );
}

export function PrivacyPolicyContent({
  linkMode = "route",
  onOpenDataDeletion,
}: LegalContentProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#F5D9A5]">Privacy Policy</h1>
        <p className="text-sm text-[#D9C7A8]">Last updated: {LEGAL_LAST_UPDATED}</p>
        <p className="text-sm leading-7 text-[#D9C7A8]">
          This policy explains how Arbiter collects, uses, and protects your
          information.
        </p>
      </header>

      <LegalSection title="Information we collect">
        <p>
          We collect account information you provide, such as email, username,
          and display name, app activity such as groups and watchlist data, and
          technical information required for security and service operation.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use information to provide and secure the service, support login and
          account management, personalize your experience, and improve app
          reliability and features.
        </p>
      </LegalSection>

      <LegalSection title="Sharing and disclosure">
        <p>
          We do not sell personal information. We may share data with service
          providers needed to run the app, or when required by law.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can request access, correction, or deletion of your personal data.
          For deletion requests, see our{" "}
          {linkMode === "modal" ? (
            <button
              type="button"
              className="font-semibold text-[#F5D9A5] underline underline-offset-4"
              onClick={onOpenDataDeletion}
            >
              Data Deletion policy
            </button>
          ) : (
            <Link className="font-semibold text-[#F5D9A5] underline" to="/data-deletion">
              Data Deletion page
            </Link>
          )}
          .
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy-related questions, contact:{" "}
          <a className="font-medium text-[#F7F1E3] underline" href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>
        </p>
      </LegalSection>
    </div>
  );
}

export function DataDeletionContent({
  linkMode = "route",
  onOpenPrivacy,
}: LegalContentProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#F5D9A5]">User Data Deletion</h1>
        <p className="text-sm text-[#D9C7A8]">Last updated: {LEGAL_LAST_UPDATED}</p>
        <p className="text-sm leading-7 text-[#D9C7A8]">
          This page explains how to request deletion of your Arbiter account and
          associated data.
        </p>
      </header>

      <LegalSection title="How to request deletion">
        <p>
          Send an email to{" "}
          <a className="font-medium text-[#F7F1E3] underline" href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>{" "}
          with the subject line{" "}
          <span className="font-medium text-[#F7F1E3]">Data Deletion Request</span>.
          Include the email address associated with your account.
        </p>
      </LegalSection>

      <LegalSection title="What we delete">
        <p>
          After verification, we delete your account profile and associated app
          content where feasible, except information required to comply with
          legal obligations, fraud prevention, or security requirements.
        </p>
      </LegalSection>

      <LegalSection title="Timing">
        <p>We aim to process deletion requests within 30 days.</p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          See our{" "}
          {linkMode === "modal" ? (
            <button
              type="button"
              className="font-semibold text-[#F5D9A5] underline underline-offset-4"
              onClick={onOpenPrivacy}
            >
              Privacy Policy
            </button>
          ) : (
            <Link className="font-semibold text-[#F5D9A5] underline" to="/privacy">
              Privacy Policy
            </Link>
          )}{" "}
          or contact{" "}
          <a className="font-medium text-[#F7F1E3] underline" href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </div>
  );
}
