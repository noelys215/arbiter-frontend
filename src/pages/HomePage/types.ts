export type ConfirmAction = {
  type: "unfriend" | "block" | "leave" | "delete" | "transfer";
  id: string;
  label: string;
};

export type InputClassNames = {
  label: string;
  input: string;
  inputWrapper: string;
};

export type WatchlistMeta = {
  name: string;
  poster: string | null;
  editorialLine: string | null;
};

export type OnOpenChange = (isOpen: boolean) => void;
