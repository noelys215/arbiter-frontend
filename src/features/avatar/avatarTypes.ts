export type AvatarSource = "provider" | "generated" | "initials";

export type AvatarUser = {
  id?: string | null;
  email?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  avatar_source?: AvatarSource | null;
  avatar_style?: string | null;
  avatar_seed?: string | null;
};

export type AvatarGenerator = "dicebear" | "boring";

export type AvatarStyleConfig = {
  value: string;
  collection: "editorial" | "character" | "sketchbook" | "portrait" | "abstract";
  generator: AvatarGenerator;
  label: string;
  variant?: "beam" | "bauhaus" | "marble";
};
