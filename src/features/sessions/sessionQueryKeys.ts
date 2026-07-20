export const sessionQueryKeys = {
  completion: (sessionId: string) =>
    ["session-completion", sessionId] as const,
  history: (groupId: string) =>
    ["session-history", groupId] as const,
  moodCues: ["mood-cues"] as const,
};
