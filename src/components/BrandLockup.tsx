type BrandLockupProps = {
  className?: string;
  logoClassName?: string;
  titleClassName?: string;
  versionClassName?: string;
  showVersion?: boolean;
  versionText?: string;
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
  versionText = "v1.0",
}: BrandLockupProps) {
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
        <h1 className={cx("text-4xl font-semibold text-[#E0B15C] sm:text-5xl", titleClassName)}>
          Arbiter
        </h1>
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
