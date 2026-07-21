import type { ReactNode } from "react";

type AppAvatarGroupProps = {
  children: ReactNode;
  total?: number;
  max?: number;
  isBordered?: boolean;
  renderCount?: (count: number) => ReactNode;
  className?: string;
  "aria-label"?: string;
};

export default function AppAvatarGroup({
  children,
  total,
  max,
  isBordered = false,
  renderCount,
  className,
  "aria-label": ariaLabel,
}: AppAvatarGroupProps) {
  const hiddenCount = total && max ? Math.max(total - max, 0) : 0;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={[
        "flex items-center -space-x-2",
        isBordered ? "[&>*]:ring-2 [&>*]:ring-[#1C110F]" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
      {hiddenCount > 0 && renderCount ? renderCount(hiddenCount) : null}
    </div>
  );
}
