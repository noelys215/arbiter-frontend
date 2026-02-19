import { Link } from "react-router-dom";

const LAST_UPDATED = "February 11, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#140C0A] px-6 py-12 text-[#F7F1E3]">
      <main className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-[#F5D9A5]">Privacy Policy</h1>
          <p className="text-sm text-[#D9C7A8]">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-[#D9C7A8]">
            This policy explains how Arbiter collects, uses, and protects your
            information.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Information we collect</h2>
          <p className="text-sm text-[#D9C7A8]">
            We collect account information you provide (such as email, username,
            and display name), app activity (such as groups and watchlist data),
            and technical information required for security and service
            operation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">How we use information</h2>
          <p className="text-sm text-[#D9C7A8]">
            We use information to provide and secure the service, support login
            and account management, personalize your experience, and improve app
            reliability and features.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Sharing and disclosure</h2>
          <p className="text-sm text-[#D9C7A8]">
            We do not sell personal information. We may share data with service
            providers needed to run the app, or when required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Your choices</h2>
          <p className="text-sm text-[#D9C7A8]">
            You can request access, correction, or deletion of your personal
            data. For deletion requests, see our{" "}
            <Link className="font-semibold text-[#F5D9A5] underline" to="/data-deletion">
              Data Deletion page
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-[#F5D9A5]">Contact</h2>
          <p className="text-sm text-[#D9C7A8]">
            For privacy-related questions, contact:{" "}
            <span className="font-medium text-[#F7F1E3]">privacy@yourdomain.com</span>
          </p>
        </section>
      </main>
    </div>
  );
}
