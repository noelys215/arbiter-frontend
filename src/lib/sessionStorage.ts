export const GROUP_STORAGE_KEY = "arbiter:lastGroupId";
export const ACTIVE_SESSION_STORAGE_PREFIX = "arbiter:active-session:";
export const CARD_INDEX_STORAGE_PREFIX = "arbiter:session-card-index:";
export const SESSION_CONTEXT_STORAGE_PREFIX = "arbiter:session-context:";
export const DEAL_SUBMITTED_STORAGE_PREFIX =
  "arbiter:session-deal-submitted:";
const LEGACY_DEAL_SUBMITTED_STORAGE_PREFIX = "arbiter:deal-submitted:";

const SESSION_CONTEXT_STORAGE_PREFIXES = [
  ACTIVE_SESSION_STORAGE_PREFIX,
  CARD_INDEX_STORAGE_PREFIX,
  SESSION_CONTEXT_STORAGE_PREFIX,
  DEAL_SUBMITTED_STORAGE_PREFIX,
  LEGACY_DEAL_SUBMITTED_STORAGE_PREFIX,
] as const;

export function clearArbiterSessionContextStorage(storage: Storage) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (
      key &&
      (key === GROUP_STORAGE_KEY ||
        SESSION_CONTEXT_STORAGE_PREFIXES.some((prefix) =>
          key.startsWith(prefix),
        ))
    ) {
      storage.removeItem(key);
    }
  }
}
