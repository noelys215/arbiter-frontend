import { Link } from "react-router-dom";

const LAST_UPDATED = "February 11, 2026";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 text-black">
      <main className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">User Data Deletion</h1>
          <p className="text-sm text-black/70">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-black/80">
            This page explains how to request deletion of your Arbiter account
            and associated data.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">How to request deletion</h2>
          <p className="text-sm text-black/80">
            Send an email to{" "}
            <span className="font-medium">privacy@yourdomain.com</span> with the
            subject line <span className="font-medium">Data Deletion Request</span>
            . Include the email address associated with your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">What we delete</h2>
          <p className="text-sm text-black/80">
            After verification, we delete your account profile and associated app
            content where feasible, except information required to comply with
            legal obligations, fraud prevention, or security requirements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Timing</h2>
          <p className="text-sm text-black/80">
            We aim to process deletion requests within 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Questions</h2>
          <p className="text-sm text-black/80">
            See our{" "}
            <Link className="font-semibold underline" to="/privacy">
              Privacy Policy
            </Link>{" "}
            or contact <span className="font-medium">privacy@yourdomain.com</span>.
          </p>
        </section>
      </main>
    </div>
  );
}
