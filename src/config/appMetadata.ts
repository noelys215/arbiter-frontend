export const APP_VERSION = "1.2.0";

const isEnabled = (value: unknown) => value === "true";

export const feedbackAvailability = {
  public: import.meta.env.DEV || isEnabled(import.meta.env.VITE_PUBLIC_FEEDBACK_ENABLED),
  account:
    import.meta.env.DEV || isEnabled(import.meta.env.VITE_ACCOUNT_FEEDBACK_ENABLED),
} as const;
