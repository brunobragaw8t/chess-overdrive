import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
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

describe("generateAvatarUploadUrl", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.generateAvatarUploadUrl)).rejects.toThrow();
  });
});

describe("saveAvatar", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    const storageId = "kg2b0p1cxs0cmf1t4fgrdg1m0h72gn3w" as Id<"_storage">;
    await expect(t.mutation(api.users.saveAvatar, { storageId })).rejects.toThrow();
  });

  it("stores avatar ID and getCurrentUser returns user with avatarUrl", async () => {
    const t = convexTest(schema, modules);

    const storageId = await t.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["fake-image"], { type: "image/png" }));
    });

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Alice", email: "alice@testers.com" });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await asAlice.mutation(api.users.saveAvatar, { storageId });

    const user = await asAlice.query(api.users.getCurrentUser);
    expect(user).not.toBeNull();
    expect(user!.avatarUrl).toBeTypeOf("string");
    expect(user!.avatarUrl).toContain("http");
  });
});

describe("deleteAccount", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.deleteAccount)).rejects.toThrow();
  });

  it("deletes the user document and all auth records from the database", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Alice", email: "alice@testers.com" });
    });

    const { accountId, sessionId } = await t.run(async (ctx) => {
      const accountId = await ctx.db.insert("authAccounts", {
        userId,
        provider: "google",
        providerAccountId: "google-123",
      });

      const sessionId = await ctx.db.insert("authSessions", {
        userId,
        expirationTime: Date.now() + 1000 * 60 * 60,
      });

      await ctx.db.insert("authRefreshTokens", {
        sessionId,
        expirationTime: Date.now() + 1000 * 60 * 60,
      });

      await ctx.db.insert("authVerificationCodes", {
        accountId,
        provider: "google",
        code: "123456",
        expirationTime: Date.now() + 1000 * 60 * 60,
      });

      return { accountId, sessionId };
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await asAlice.mutation(api.users.deleteAccount);

    await t.run(async (ctx) => {
      expect(await ctx.db.get(userId)).toBeNull();
      expect(await ctx.db.get(accountId)).toBeNull();
      expect(await ctx.db.get(sessionId)).toBeNull();

      const remainingRefreshTokens = await ctx.db.query("authRefreshTokens").collect();
      expect(remainingRefreshTokens).toHaveLength(0);

      const remainingVerificationCodes = await ctx.db.query("authVerificationCodes").collect();
      expect(remainingVerificationCodes).toHaveLength(0);
    });
  });

  it("makes getCurrentUser return null for deleted user", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { name: "Alice", email: "alice@testers.com" });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await asAlice.mutation(api.users.deleteAccount);

    const result = await asAlice.query(api.users.getCurrentUser);
    expect(result).toBeNull();
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
