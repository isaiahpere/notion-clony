import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * To archive a document that belongs to specific user
 */
export const archive = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not Authenticated");
    }
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) {
      throw new Error("No Existing Documents Found");
    }
    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    // modify parent document
    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    // modify children documents
    recursiveArchive(args.id);

    return document;
  },
});

/**
 * Create a new document in convex DB - documents table
 */
export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not Authenticated");
    }

    const userId = identity.subject;

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    });
    return document; // return document id
  },
});

/**
 * Retrieve all documents for the sidebar
 */
export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not Authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentDocument)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Restore notes from trash
 */
export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("No Existing Documents Found");
    if (existingDocument.userId !== userId) throw new Error("Unauthorized");

    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();
      for (const child of children) {
        await ctx.db.patch(child._id, { isArchived: false });
        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);
      if (parent?.isArchived) {
        options.parentDocument = undefined;
      }
    }

    const modifiedDocument = await ctx.db.patch(args.id, options);

    recursiveRestore(args.id);

    return modifiedDocument;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("NO Existing Documents Found");
    if (existingDocument.userId !== userId) throw new Error("Unauthorized");

    const deletedDocument = await ctx.db.delete(args.id);

    return deletedDocument;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");
    if (document.isPublished && !document.isArchived) return document;

    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;
    if (document.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return document;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;
    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(id);
    if (!existingDocument) throw new Error("No Existing Documents Found");
    if (existingDocument?.userId !== userId) throw new Error("Unauthorized");

    const updatedDocument = await ctx.db.patch(id, rest);

    return updatedDocument;
  },
});

export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("No existing document found");
    if (existingDocument.userId !== userId) throw new Error("Unauthorized");

    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    });
    return document;
  },
});

export const removeCoverImage = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not Authenticated");
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("No Existings Documents Found");
    if (existingDocument.userId !== userId) throw new Error("Unauthorized");

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});
