import { Link } from "react-router-dom";

const LAST_UPDATED = "February 11, 2026";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#140C0A] px-6 py-12 text-[#F7F1E3]">
      <main className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-[#F5D9A5]">User Data Deletion</h1>
          <p className="text-sm text-[#D9C7A8]">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-[#D9C7A8]">
            This page explains how to request deletion of your Arbiter account
            and associated data.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">How to request deletion</h2>
          <p className="text-sm text-[#D9C7A8]">
            Send an email to{" "}
            <span className="font-medium text-[#F7F1E3]">privacy@yourdomain.com</span> with the
            subject line <span className="font-medium text-[#F7F1E3]">Data Deletion Request</span>
            . Include the email address associated with your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">What we delete</h2>
          <p className="text-sm text-[#D9C7A8]">
            After verification, we delete your account profile and associated app
            content where feasible, except information required to comply with
            legal obligations, fraud prevention, or security requirements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Timing</h2>
          <p className="text-sm text-[#D9C7A8]">
            We aim to process deletion requests within 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Questions</h2>
          <p className="text-sm text-[#D9C7A8]">
            See our{" "}
            <Link className="font-semibold text-[#F5D9A5] underline" to="/privacy">
              Privacy Policy
            </Link>{" "}
            or contact <span className="font-medium text-[#F7F1E3]">privacy@yourdomain.com</span>.
          </p>
        </section>
      </main>
    </div>
  );
}
