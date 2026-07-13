import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { invitation, member, organization, user } from "./auth";

// ─── Business Tables ─────────────────────────────────────

export const customer = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("customer_org_idx").on(table.organizationId)],
);

export const order = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull(),
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    label: text("label"),
    problemDescription: text("problem_description").notNull(),
    estimatedCost: numeric("estimated_cost"),
    finalCost: numeric("final_cost"),
    eta: timestamp("eta"),
    etaValue: integer("eta_value"),
    priority: text("priority").default("normal").notNull(),
    currency: text("currency").default("IDR").notNull(),
    internalNotes: text("internal_notes"),
    metadata: jsonb("metadata"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("order_org_idx").on(table.organizationId),
    index("order_customer_idx").on(table.customerId),
    uniqueIndex("order_org_number_uidx").on(table.organizationId, table.orderNumber),
  ],
);

export const orderStatusTemplate = pgTable(
  "order_status_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value").notNull(),
    icon: text("icon"),
    description: text("description"),
    hexColor: text("hex_color"),
    sequence: integer("sequence").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("status_template_org_idx").on(table.organizationId),
    uniqueIndex("status_template_org_value_uidx").on(
      table.organizationId,
      table.value,
    ),
  ],
);

export const orderEvent = pgTable(
  "order_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value").notNull(),
    icon: text("icon"),
    description: text("description"),
    hexColor: text("hex_color"),
    note: text("note"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    attachments: jsonb("attachments"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_event_order_idx").on(table.orderId)],
);

export const attachment = pgTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => order.id, {
      onDelete: "cascade",
    }),
    url: text("url").notNull(),
    filename: text("filename"),
    mimeType: text("mime_type"),
    size: integer("size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("attachment_org_idx").on(table.organizationId)],
);

export const notification = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    orderId: text("order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    type: text("type"),
    channel: text("channel"),
    payload: jsonb("payload"),
    read: boolean("read").default(false).notNull(),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("notification_org_idx").on(table.organizationId)],
);

// ─── Business Relations ──────────────────────────────────

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  customers: many(customer),
  orders: many(order),
  statusTemplates: many(orderStatusTemplate),
  attachments: many(attachment),
  notifications: many(notification),
}));

export const customerRelations = relations(customer, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customer.organizationId],
    references: [organization.id],
  }),
  orders: many(order),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  customer: one(customer, {
    fields: [order.customerId],
    references: [customer.id],
  }),
  events: many(orderEvent),
  attachments: many(attachment),
  notifications: many(notification),
}));

export const orderStatusTemplateRelations = relations(
  orderStatusTemplate,
  ({ one }) => ({
    organization: one(organization, {
      fields: [orderStatusTemplate.organizationId],
      references: [organization.id],
    }),
  }),
);

export const orderEventRelations = relations(orderEvent, ({ one }) => ({
  order: one(order, {
    fields: [orderEvent.orderId],
    references: [order.id],
  }),
  user: one(user, {
    fields: [orderEvent.createdBy],
    references: [user.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  organization: one(organization, {
    fields: [attachment.organizationId],
    references: [organization.id],
  }),
  order: one(order, {
    fields: [attachment.orderId],
    references: [order.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  organization: one(organization, {
    fields: [notification.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  order: one(order, {
    fields: [notification.orderId],
    references: [order.id],
  }),
}));
