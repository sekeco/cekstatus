import { db } from "../../db";
import { orderStatusTemplate } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { CreateStatusInput, UpdateStatusInput } from "./model";
import { createId } from "@paralleldrive/cuid2";

type StatusRow = typeof orderStatusTemplate.$inferSelect;

function serialize(row: StatusRow) {
  return {
    ...row,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
  };
}

export class StatusTemplateService {
  /**
   * List all status templates for an organization, ordered by sequence.
   */
  async list(organizationId: string) {
    const rows = await db
      .select()
      .from(orderStatusTemplate)
      .where(eq(orderStatusTemplate.organizationId, organizationId))
      .orderBy(asc(orderStatusTemplate.sequence));
    return rows.map(serialize);
  }

  /**
   * Get a single status template by ID.
   */
  async getById(organizationId: string, id: string) {
    const [row] = await db
      .select()
      .from(orderStatusTemplate)
      .where(
        and(
          eq(orderStatusTemplate.id, id),
          eq(orderStatusTemplate.organizationId, organizationId),
        ),
      );
    return row ? serialize(row) : null;
  }

  /**
   * Create a new status template.
   */
  async create(organizationId: string, input: CreateStatusInput) {
    // Determine sequence: if not provided, put at the end
    let seq = input.sequence;
    if (seq === undefined) {
      const lastSeq = await this.getMaxSequence(organizationId);
      seq = lastSeq + 1;
    }

    const id = createId();

    await db.insert(orderStatusTemplate).values({
      id,
      organizationId,
      label: input.label,
      value: input.value,
      icon: input.icon ?? null,
      description: input.description ?? null,
      hexColor: input.hexColor ?? null,
      sequence: seq,
    });

    return this.getById(organizationId, id);
  }

  /**
   * Update an existing status template.
   */
  async update(
    organizationId: string,
    id: string,
    input: UpdateStatusInput,
  ) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return null;

    await db
      .update(orderStatusTemplate)
      .set({
        ...(input.label !== undefined && { label: input.label }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.hexColor !== undefined && { hexColor: input.hexColor }),
        ...(input.sequence !== undefined && { sequence: input.sequence }),
      })
      .where(eq(orderStatusTemplate.id, id));

    return this.getById(organizationId, id);
  }

  /**
   * Delete a status template. Only possible if no orders are currently using it.
   */
  async delete(organizationId: string, id: string) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return false;

    await db
      .delete(orderStatusTemplate)
      .where(
        and(
          eq(orderStatusTemplate.id, id),
          eq(orderStatusTemplate.organizationId, organizationId),
        ),
      );

    return true;
  }

  /**
   * Seed default status templates based on business type.
   */
  async seedDefaults(organizationId: string, businessType: string) {
    const templates = getTemplateForBusinessType(businessType);
    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i];
      await db.insert(orderStatusTemplate).values({
        id: createId(),
        organizationId,
        label: tpl.label,
        value: tpl.value,
        icon: tpl.icon ?? null,
        description: tpl.description ?? null,
        hexColor: tpl.hexColor ?? null,
        sequence: i,
      });
    }
  }

  private async getMaxSequence(organizationId: string): Promise<number> {
    const rows = await db
      .select({ maxSeq: orderStatusTemplate.sequence })
      .from(orderStatusTemplate)
      .where(eq(orderStatusTemplate.organizationId, organizationId));

    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => r.maxSeq ?? 0), 0);
  }
}

// ─── Default Templates ──────────────────────────────────

interface DefaultTemplate {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  hexColor?: string;
}

const TEMPLATES: Record<string, DefaultTemplate[]> = {
  "servis-laptop": [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Diperiksa", value: "diperiksa", icon: "SearchCheck", hexColor: "#3b82f6" },
    { label: "Menunggu Sparepart", value: "menunggu-sparepart", icon: "Package", hexColor: "#a855f7" },
    { label: "Dalam Proses", value: "dalam-proses", icon: "Wrench", hexColor: "#eab308" },
    { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
  laundry: [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Disortir", value: "disortir", icon: "SearchCheck", hexColor: "#3b82f6" },
    { label: "Dicuci", value: "dicuci", icon: "Droplets", hexColor: "#eab308" },
    { label: "Siap", value: "siap", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
  bengkel: [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Diperiksa", value: "diperiksa", icon: "SearchCheck", hexColor: "#3b82f6" },
    { label: "Tunggu Part", value: "tunggu-part", icon: "Package", hexColor: "#a855f7" },
    { label: "Diservis", value: "diservis", icon: "Wrench", hexColor: "#eab308" },
    { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
  percetakan: [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Didesain", value: "didesain", icon: "PenTool", hexColor: "#3b82f6" },
    { label: "Cetak", value: "cetak", icon: "Printer", hexColor: "#eab308" },
    { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
  tailor: [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Diukur", value: "diukur", icon: "Ruler", hexColor: "#3b82f6" },
    { label: "Dijahit", value: "dijahit", icon: "Wrench", hexColor: "#eab308" },
    { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
  "reparasi-hp": [
    { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
    { label: "Diperiksa", value: "diperiksa", icon: "SearchCheck", hexColor: "#3b82f6" },
    { label: "Tunggu Sparepart", value: "tunggu-sparepart", icon: "Package", hexColor: "#a855f7" },
    { label: "Diperbaiki", value: "diperbaiki", icon: "Wrench", hexColor: "#eab308" },
    { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
    { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
  ],
};

const DEFAULT_TEMPLATE: DefaultTemplate[] = [
  { label: "Antrian", value: "antrian", icon: "Clock", hexColor: "#f97316" },
  { label: "Diproses", value: "diproses", icon: "Wrench", hexColor: "#eab308" },
  { label: "Selesai", value: "selesai", icon: "CheckCircle2", hexColor: "#22c55e" },
  { label: "Diambil", value: "diambil", icon: "CircleOff", hexColor: "#6b7280" },
];

function getTemplateForBusinessType(businessType: string): DefaultTemplate[] {
  return TEMPLATES[businessType] ?? DEFAULT_TEMPLATE;
}
