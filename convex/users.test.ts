import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("getCurrentUser", () => {
  it("returns null when unauthenticated", async () => {
    const t = convexTest(schema, modules);

    const user = await t.query(api.users.getCurrentUser);

    expect(user).toBeNull();
  });

  it("returns user data when authenticated", async () => {
    const t = convexTest(schema, modules);

    const userData = {
      name: "Alice",
      email: "alice@test.com",
    };

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", userData);
    });

    const asAlice = t.withIdentity({
      name: userData.name,
      subject: `${userId}|session123`,
    });

    const user = await asAlice.query(api.users.getCurrentUser);

    expect(user).toMatchObject(userData);
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
