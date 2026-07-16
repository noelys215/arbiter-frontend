import type { ReactNode, Ref } from "react";
import { Link } from "react-router-dom";
import SkipLink from "../../components/SkipLink";

type InviteShellProps = {
  identity: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  headline: string;
  body: string;
  actions?: ReactNode;
  status?: ReactNode;
};

export default function InviteShell({
  identity,
  headingRef,
  headline,
  body,
  actions,
  status,
}: InviteShellProps) {
  return (
    <div className="invite-page">
      <SkipLink />
      <header className="invite-header">
        <Link to="/" className="invite-brand" aria-label="Arbiter home">
          <img src="/arbiter.png" alt="" aria-hidden="true" />
          <span>Arbiter</span>
        </Link>
      </header>
      <main id="main-content" tabIndex={-1} className="invite-main">
        <section className="invite-surface" aria-labelledby="invite-title">
          <div className="invite-grid">
            <div className="invite-identity-column">{identity}</div>
            <div className="invite-statement">
              <h1
                ref={headingRef}
                id="invite-title"
                tabIndex={-1}
                className="invite-title"
              >
                {headline}
              </h1>
              <p className="invite-body">{body}</p>
              {status ? <div className="invite-status">{status}</div> : null}
              {actions ? <div className="invite-actions">{actions}</div> : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
