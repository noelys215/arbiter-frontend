import type { Friend } from "./friends.api";

export type FriendFilter = "all" | "in-group" | "not-in-group";

export function filterFriendsByGroup(
  friends: Friend[],
  memberIds: ReadonlySet<string>,
  filter: FriendFilter,
) {
  if (filter === "all") return friends;
  return friends.filter((friend) =>
    filter === "in-group"
      ? memberIds.has(friend.id)
      : !memberIds.has(friend.id),
  );
}
