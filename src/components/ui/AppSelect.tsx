import { Label, ListBox, Select } from "@heroui/react";

export type AppSelectOption = {
  id: string;
  label: string;
};

type AppSelectProps = {
  options: AppSelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  valueClassName?: string;
  listBoxClassName?: string;
  popoverClassName?: string;
  indicatorClassName?: string;
  isDisabled?: boolean;
};

export default function AppSelect({
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  className,
  triggerClassName,
  valueClassName,
  listBoxClassName,
  popoverClassName,
  indicatorClassName,
  isDisabled = false,
}: AppSelectProps) {
  return (
    <Select
      aria-label={ariaLabel}
      selectedKey={value}
      placeholder={placeholder}
      onSelectionChange={(key) => onChange(key == null ? null : String(key))}
      className={className}
      fullWidth
      variant="secondary"
      isDisabled={isDisabled}
    >
      <Label className="sr-only">{ariaLabel}</Label>
      <Select.Trigger className={triggerClassName}>
        <Select.Value className={valueClassName} />
        <Select.Indicator className={indicatorClassName} />
      </Select.Trigger>
      <Select.Popover className={popoverClassName}>
        <ListBox className={listBoxClassName}>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
