import { Checkbox, Label, Radio, RadioGroup } from "@heroui/react";
import type { ReactNode } from "react";

type AppRadioGroupProps = {
  children: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  labelClassName?: string;
};

export function AppRadioGroup({
  children,
  label,
  value,
  onChange,
  name,
  orientation,
  className,
  labelClassName,
}: AppRadioGroupProps) {
  return (
    <RadioGroup
      name={name}
      value={value}
      onChange={onChange}
      orientation={orientation}
      className={className}
      variant="secondary"
    >
      <Label className={labelClassName}>{label}</Label>
      {children}
    </RadioGroup>
  );
}

type AppRadioProps = {
  value: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  controlClassName?: string;
};

export function AppRadio({
  value,
  children,
  className,
  labelClassName,
  controlClassName,
}: AppRadioProps) {
  return (
    <Radio value={value} className={className}>
      <Radio.Content className={labelClassName}>
        <Radio.Control className={controlClassName}>
          <Radio.Indicator />
        </Radio.Control>
        {children}
      </Radio.Content>
    </Radio>
  );
}

type AppCheckboxProps = {
  children: ReactNode;
  selected: boolean;
  onChange: (selected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
  labelClassName?: string;
  controlClassName?: string;
  "aria-describedby"?: string;
};

export function AppCheckbox({
  children,
  selected,
  onChange,
  isDisabled,
  className,
  labelClassName,
  controlClassName,
  "aria-describedby": ariaDescribedBy,
}: AppCheckboxProps) {
  return (
    <Checkbox
      isSelected={selected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={className}
      aria-describedby={ariaDescribedBy}
      variant="secondary"
    >
      <Checkbox.Content className={labelClassName}>
        <Checkbox.Control className={controlClassName}>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {children}
      </Checkbox.Content>
    </Checkbox>
  );
}
