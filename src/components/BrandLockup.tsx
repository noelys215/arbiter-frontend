import { APP_VERSION } from "../config/appMetadata";

type BrandLockupProps = {
  className?: string;
  logoClassName?: string;
  titleClassName?: string;
  versionClassName?: string;
  showVersion?: boolean;
  versionText?: string;
  titleAs?: "h1" | "span";
};

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function BrandLockup({
  className,
  logoClassName,
  titleClassName,
  versionClassName,
  showVersion = true,
  versionText = `v${APP_VERSION}`,
  titleAs = "h1",
}: BrandLockupProps) {
  const Title = titleAs;
  return (
    <div className={cx("flex items-center", className)}>
      <img
        src="/arbiter.png"
        alt=""
        aria-hidden="true"
        className={cx(
          "h-11 w-11 rounded-sm object-contain sm:h-20 sm:w-20",
          logoClassName,
        )}
      />
      <div className="flex items-baseline gap-2">
        <Title
          className={cx(
            "app-heading-serif text-4xl font-semibold text-[#E0B15C] sm:text-5xl",
            titleClassName,
          )}
        >
          Arbiter
        </Title>
        {showVersion ? (
          <span
            className={cx(
              "text-xs font-medium uppercase tracking-[0.14em] text-[#E0B15C]/75 sm:text-sm",
              versionClassName,
            )}
          >
            {versionText}
          </span>
        ) : null}
      </div>
    </div>
  );
}
