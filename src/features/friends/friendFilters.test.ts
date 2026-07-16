import { describe, expect, it } from "vitest";
import type { Friend } from "./friends.api";
import { filterFriendsByGroup } from "./friendFilters";

const friends = [
  { id: "a", display_name: "A", username: "a" },
  { id: "b", display_name: "B", username: "b" },
] as Friend[];

describe("filterFriendsByGroup", () => {
  it("keeps the account-level list intact for All", () => {
    expect(filterFriendsByGroup(friends, new Set(["a"]), "all")).toEqual(friends);
  });

  it("derives current-group filters without changing friendship data", () => {
    expect(filterFriendsByGroup(friends, new Set(["a"]), "in-group").map((friend) => friend.id)).toEqual(["a"]);
    expect(filterFriendsByGroup(friends, new Set(["a"]), "not-in-group").map((friend) => friend.id)).toEqual(["b"]);
    expect(friends).toHaveLength(2);
  });
});
