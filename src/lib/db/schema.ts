import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const supplierTypeEnum = pgEnum("supplier_type", ["company", "individual"]);
export const purchaseTypeEnum = pgEnum("purchase_type", ["service", "materials", "products", "indirect"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "paid"]);
export const fileTypeEnum = pgEnum("file_type", ["invoice", "receipt", "photo", "document"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "editor", "viewer"]);

// House document type enum for categorizing house-level documents
export const houseDocumentTypeEnum = pgEnum("house_document_type", [
  "purchase_agreement",
  "utility_contract",
  "insurance",
  "building_permit",
  "tax_document",
  "warranty",
  "manual",
  "other"
]);

// Expense category enum for categorizing purchases by work type
// Note: This enum is deprecated. Categories are now stored in expense_categories table.
// The enum is kept for backward compatibility during migration.
export const expenseCategoryEnum = pgEnum("expense_category", [
  "lighting",
  "flooring",
  "painting",
  "plumbing",
  "electrical",
  "hvac",
  "carpentry",
  "windows_doors",
  "roofing",
  "landscaping",
  "appliances",
  "furniture",
  "fixtures",
  "labor",
  "permits_fees",
  "other"
]);

// Expense categories table - user-manageable categories
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  iconName: varchar("icon_name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  bgColor: varchar("bg_color", { length: 50 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Homes table - main entity containing areas, rooms, purchases
export const homes = pgTable("homes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  nameLt: varchar("name_lt", { length: 255 }),
  address: text("address"),
  purchaseDate: date("purchase_date"),
  coverImageUrl: text("cover_image_url"),
  description: text("description"),
  descriptionLt: text("description_lt"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const homesRelations = relations(homes, ({ many }) => ({
  images: many(homeImages),
  areas: many(areas),
  purchases: many(purchases),
}));

// Home images table - photo gallery for homes
export const homeImages = pgTable("home_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  homeId: uuid("home_id")
    .references(() => homes.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const homeImagesRelations = relations(homeImages, ({ one }) => ({
  home: one(homes, {
    fields: [homeImages.homeId],
    references: [homes.id],
  }),
}));

// Tags table - for categorizing purchase line items
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 50 }).default("bg-gray-100 text-gray-800"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  lineItemTags: many(purchaseLineItemTags),
}));

// Junction table for line item tags
export const purchaseLineItemTags = pgTable("purchase_line_item_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  lineItemId: uuid("line_item_id")
    .references(() => purchaseLineItems.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  uniqueLineItemTag: unique().on(table.lineItemId, table.tagId),
}));

export const purchaseLineItemTagsRelations = relations(purchaseLineItemTags, ({ one }) => ({
  lineItem: one(purchaseLineItems, {
    fields: [purchaseLineItemTags.lineItemId],
    references: [purchaseLineItems.id],
  }),
  tag: one(tags, {
    fields: [purchaseLineItemTags.tagId],
    references: [tags.id],
  }),
}));

// App Users table - links Neon Auth users to app-specific roles
// Neon Auth stores users in neon_auth.users_sync, this table adds app-specific data
export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  neonAuthId: varchar("neon_auth_id", { length: 255 }).notNull().unique(), // ID from Neon Auth
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: userRoleEnum("role").default("viewer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appUsersRelations = relations(appUsers, ({ one }) => ({
  settings: one(userSettings),
}));

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  defaultCurrency: varchar("default_currency", { length: 3 }).default("EUR").notNull(),
  notificationPreferences: jsonb("notification_preferences"),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(appUsers, {
    fields: [userSettings.userId],
    references: [appUsers.id],
  }),
}));

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: supplierTypeEnum("type").notNull(),
  companyName: varchar("company_name", { length: 255 }),
  companyAddress: text("company_address"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  rating: integer("rating"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

// Areas table
export const areas = pgTable("areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  homeId: uuid("home_id").references(() => homes.id),
  name: varchar("name", { length: 255 }).notNull(),
  nameLt: varchar("name_lt", { length: 255 }),
  description: text("description"),
  descriptionLt: text("description_lt"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const areasRelations = relations(areas, ({ one, many }) => ({
  home: one(homes, {
    fields: [areas.homeId],
    references: [homes.id],
  }),
  rooms: many(rooms),
  purchases: many(purchases),
}));

// Rooms table
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaId: uuid("area_id")
    .references(() => areas.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameLt: varchar("name_lt", { length: 255 }),
  description: text("description"),
  descriptionLt: text("description_lt"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  area: one(areas, {
    fields: [rooms.areaId],
    references: [areas.id],
  }),
  purchases: many(purchases),
  attachments: many(attachments),
}));

// Purchases table
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  homeId: uuid("home_id").references(() => homes.id),
  date: timestamp("date").notNull(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  purchaseType: purchaseTypeEnum("purchase_type").notNull(),
  // Changed from enum to varchar to support user-defined categories
  expenseCategory: varchar("expense_category", { length: 100 }),
  roomId: uuid("room_id").references(() => rooms.id),
  areaId: uuid("area_id").references(() => areas.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paymentDueDate: timestamp("payment_due_date"),
  notes: text("notes"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  home: one(homes, {
    fields: [purchases.homeId],
    references: [homes.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  room: one(rooms, {
    fields: [purchases.roomId],
    references: [rooms.id],
  }),
  area: one(areas, {
    fields: [purchases.areaId],
    references: [areas.id],
  }),
  lineItems: many(purchaseLineItems),
  attachments: many(attachments),
}));

// Purchase line items table
export const purchaseLineItems = pgTable("purchase_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .references(() => purchases.id, { onDelete: "cascade" })
    .notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  areaId: uuid("area_id").references(() => areas.id),
  roomId: uuid("room_id").references(() => rooms.id),
  warrantyMonths: integer("warranty_months"),
  warrantyExpiresAt: timestamp("warranty_expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseLineItemsRelations = relations(purchaseLineItems, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [purchaseLineItems.purchaseId],
    references: [purchases.id],
  }),
  area: one(areas, {
    fields: [purchaseLineItems.areaId],
    references: [areas.id],
  }),
  room: one(rooms, {
    fields: [purchaseLineItems.roomId],
    references: [rooms.id],
  }),
  attachments: many(attachments),
  lineItemTags: many(purchaseLineItemTags),
}));

// Attachments table
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id").references(() => purchases.id, { onDelete: "cascade" }),
  lineItemId: uuid("line_item_id").references(() => purchaseLineItems.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  aiExtractedData: jsonb("ai_extracted_data"),
  // House document specific fields
  houseDocumentType: houseDocumentTypeEnum("house_document_type"),
  documentTitle: varchar("document_title", { length: 255 }),
  documentDescription: text("document_description"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  purchase: one(purchases, {
    fields: [attachments.purchaseId],
    references: [purchases.id],
  }),
  lineItem: one(purchaseLineItems, {
    fields: [attachments.lineItemId],
    references: [purchaseLineItems.id],
  }),
  room: one(rooms, {
    fields: [attachments.roomId],
    references: [rooms.id],
  }),
}));

// Note: Authentication is now handled by Neon Auth in the neon_auth schema.
// The users table below is retained for app-specific user data.
// Neon Auth stores user data in neon_auth.users_sync which can be joined with this table.

// Type exports
export type AppUser = typeof appUsers.$inferSelect;
export type NewAppUser = typeof appUsers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type PurchaseLineItem = typeof purchaseLineItems.$inferSelect;
export type NewPurchaseLineItem = typeof purchaseLineItems.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type ExpenseCategoryRecord = typeof expenseCategories.$inferSelect;
export type NewExpenseCategoryRecord = typeof expenseCategories.$inferInsert;
export type Home = typeof homes.$inferSelect;
export type NewHome = typeof homes.$inferInsert;
export type HomeImage = typeof homeImages.$inferSelect;
export type NewHomeImage = typeof homeImages.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type PurchaseLineItemTag = typeof purchaseLineItemTags.$inferSelect;
export type NewPurchaseLineItemTag = typeof purchaseLineItemTags.$inferInsert;
