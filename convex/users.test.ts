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

describe("updateProfile", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.updateProfile, { name: "NewName" })).rejects.toThrow();
  });

  it("rejects calls from soft-deleted users", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Alice",
        email: "alice@testers.com",
        isDeleted: true,
      });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(asAlice.mutation(api.users.updateProfile, { name: "NewName" })).rejects.toThrow();
  });

  it("rejects empty or whitespace-only names", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Alice", email: "alice@testers.com" });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(asAlice.mutation(api.users.updateProfile, { name: "" })).rejects.toThrow(
      "Name cannot be empty",
    );

    await expect(asAlice.mutation(api.users.updateProfile, { name: "   " })).rejects.toThrow(
      "Name cannot be empty",
    );
  });

  it("updates name and the change is retrievable via getCurrentUser", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Alice", email: "alice@testers.com" });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await asAlice.mutation(api.users.updateProfile, { name: "Bob" });

    const user = await asAlice.query(api.users.getCurrentUser);
    expect(user).not.toBeNull();
    expect(user!.name).toBe("Bob");
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
