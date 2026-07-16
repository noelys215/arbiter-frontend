import { publicLinks } from "../config/publicLinks";

type KoFiSupportLinkProps = {
  label?: string;
  placement?: "footer" | "profile";
};

export default function KoFiSupportLink({
  label = "Support Arbiter",
  placement = "footer",
}: KoFiSupportLinkProps) {
  if (!publicLinks.koFi) return null;

  return (
    <a
      href={publicLinks.koFi}
      target="_blank"
      rel="noopener noreferrer"
      className={`kofi-support-link kofi-support-link-${placement}`}
      aria-label={`${label} - opens in a new tab`}
    >
      {label}
    </a>
  );
}
