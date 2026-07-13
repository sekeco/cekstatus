import { db } from "../../db";
import { attachment, order } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * Upload directory — configurable via UPLOAD_DIR env.
 *
 * Docker  → ./storage/uploads   (bind-mounted to backend/storage/uploads)
 * Lokal   → ./storage/uploads   (relatif ke folder backend/)
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./storage/uploads";

export class AttachmentService {
  /**
   * Upload a file and store its metadata in the database.
   */
  async upload(
    organizationId: string,
    orderId: string,
    file: File,
  ): Promise<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
  } | null> {
    // Verify order belongs to this organization
    const [ord] = await db
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.organizationId, organizationId),
        ),
      );
    if (!ord) return null;

    const id = createId();
    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${id}.${ext}`;
    const relativePath = `${organizationId}/${orderId}`;
    const fullDir = `${UPLOAD_DIR}/${relativePath}`;
    const fullPath = `${fullDir}/${uniqueName}`;

    // Ensure directory exists
    await Bun.write(fullPath, file);

    const url = `/uploads/${relativePath}/${uniqueName}`;
    const size = file.size;

    await db.insert(attachment).values({
      id,
      organizationId,
      orderId,
      url,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size,
    });

    const [row] = await db
      .select()
      .from(attachment)
      .where(eq(attachment.id, id));

    if (!row) return null;

    return {
      id: row.id,
      url: row.url,
      filename: row.filename ?? file.name,
      mimeType: row.mimeType ?? file.type,
      size: row.size ?? size,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt.toISOString(),
    };
  }

  /**
   * List all attachments for an order.
   */
  async list(organizationId: string, orderId: string) {
    const [ord] = await db
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.organizationId, organizationId),
        ),
      );
    if (!ord) return null;

    const rows = await db
      .select()
      .from(attachment)
      .where(
        and(
          eq(attachment.organizationId, organizationId),
          eq(attachment.orderId, orderId),
        ),
      )
      .orderBy(attachment.createdAt);

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt.toISOString(),
    }));
  }

  /**
   * Delete an attachment by ID.
   */
  async delete(organizationId: string, attachmentId: string) {
    const [row] = await db
      .select()
      .from(attachment)
      .where(
        and(
          eq(attachment.id, attachmentId),
          eq(attachment.organizationId, organizationId),
        ),
      );
    if (!row) return false;

    // Delete file from disk
    const filePath = `${UPLOAD_DIR}${row.url.replace("/uploads", "")}`;
    try {
      await Bun.file(filePath).delete();
    } catch {
      // File may not exist on disk, that's ok
    }

    await db
      .delete(attachment)
      .where(
        and(
          eq(attachment.id, attachmentId),
          eq(attachment.organizationId, organizationId),
        ),
      );

    return true;
  }
}
