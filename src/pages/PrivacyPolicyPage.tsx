import { Link } from "react-router-dom";

const LAST_UPDATED = "February 11, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 text-black">
      <main className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-black/70">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-black/80">
            This policy explains how Arbiter collects, uses, and protects your
            information.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Information we collect</h2>
          <p className="text-sm text-black/80">
            We collect account information you provide (such as email, username,
            and display name), app activity (such as groups and watchlist data),
            and technical information required for security and service
            operation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">How we use information</h2>
          <p className="text-sm text-black/80">
            We use information to provide and secure the service, support login
            and account management, personalize your experience, and improve app
            reliability and features.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Sharing and disclosure</h2>
          <p className="text-sm text-black/80">
            We do not sell personal information. We may share data with service
            providers needed to run the app, or when required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Your choices</h2>
          <p className="text-sm text-black/80">
            You can request access, correction, or deletion of your personal
            data. For deletion requests, see our{" "}
            <Link className="font-semibold underline" to="/data-deletion">
              Data Deletion page
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm text-black/80">
            For privacy-related questions, contact:{" "}
            <span className="font-medium">privacy@yourdomain.com</span>
          </p>
        </section>
      </main>
    </div>
  );
}
