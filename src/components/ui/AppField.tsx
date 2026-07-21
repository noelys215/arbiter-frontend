import {
  Description,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import type { ComponentProps } from "react";

export type AppFieldClasses = {
  root?: string;
  label?: string;
  input?: string;
  inputWrapper?: string;
  description?: string;
  error?: string;
};

type SharedFieldProps = {
  label?: string;
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  classes?: AppFieldClasses;
};

type AppTextFieldProps = SharedFieldProps &
  Omit<ComponentProps<typeof Input>, "className" | "onChange"> & {
    className?: string;
    onChange?: ComponentProps<typeof Input>["onChange"];
    onChangeValue?: (value: string) => void;
  };

export function AppTextField({
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  classes,
  className,
  onChange,
  onChangeValue,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...inputProps
}: AppTextFieldProps) {
  return (
    <TextField
      className={[classes?.root, className].filter(Boolean).join(" ")}
      isInvalid={isInvalid}
      isRequired={isRequired}
      fullWidth
      variant="secondary"
      aria-label={!label ? ariaLabel : undefined}
      aria-labelledby={!label ? ariaLabelledBy : undefined}
    >
      {label ? <Label className={classes?.label}>{label}</Label> : null}
      <Input
        {...inputProps}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={["border", classes?.inputWrapper, classes?.input].filter(Boolean).join(" ")}
        onChange={(event) => {
          onChange?.(event);
          onChangeValue?.(event.target.value);
        }}
      />
      {description ? <Description className={classes?.description}>{description}</Description> : null}
      {isInvalid && errorMessage ? <FieldError className={classes?.error}>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

type AppTextAreaProps = SharedFieldProps &
  Omit<ComponentProps<typeof TextArea>, "className" | "onChange"> & {
    className?: string;
    onChange?: ComponentProps<typeof TextArea>["onChange"];
    onChangeValue?: (value: string) => void;
  };

export function AppTextArea({
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  classes,
  className,
  onChange,
  onChangeValue,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...textAreaProps
}: AppTextAreaProps) {
  return (
    <TextField
      className={[classes?.root, className].filter(Boolean).join(" ")}
      isInvalid={isInvalid}
      isRequired={isRequired}
      fullWidth
      variant="secondary"
      aria-label={!label ? ariaLabel : undefined}
      aria-labelledby={!label ? ariaLabelledBy : undefined}
    >
      {label ? <Label className={classes?.label}>{label}</Label> : null}
      <TextArea
        {...textAreaProps}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={["border", classes?.inputWrapper, classes?.input].filter(Boolean).join(" ")}
        onChange={(event) => {
          onChange?.(event);
          onChangeValue?.(event.target.value);
        }}
      />
      {description ? <Description className={classes?.description}>{description}</Description> : null}
      {isInvalid && errorMessage ? <FieldError className={classes?.error}>{errorMessage}</FieldError> : null}
    </TextField>
  );
}
