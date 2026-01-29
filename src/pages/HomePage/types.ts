export type ConfirmAction = {
  type: "unfriend" | "leave" | "delete";
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
  year: number | null;
  poster: string | null;
};

export type OnOpenChange = (isOpen: boolean) => void;
