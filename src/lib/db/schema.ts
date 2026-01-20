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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const supplierTypeEnum = pgEnum("supplier_type", ["company", "individual"]);
export const purchaseTypeEnum = pgEnum("purchase_type", ["service", "materials", "products", "indirect"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "paid"]);
export const fileTypeEnum = pgEnum("file_type", ["invoice", "receipt", "photo", "document"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "viewer"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("owner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  settings: one(userSettings),
}));

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  defaultCurrency: varchar("default_currency", { length: 3 }).default("EUR").notNull(),
  notificationPreferences: jsonb("notification_preferences"),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
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
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const areasRelations = relations(areas, ({ many }) => ({
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
  description: text("description"),
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
  date: timestamp("date").notNull(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  purchaseType: purchaseTypeEnum("purchase_type").notNull(),
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
  attachments: many(attachments),
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
