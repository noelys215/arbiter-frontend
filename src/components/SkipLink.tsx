type SkipLinkProps = {
  targetId?: string;
  label?: string;
};

export default function SkipLink({
  targetId = "main-content",
  label = "Skip to main content",
}: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {label}
    </a>
  );
}
