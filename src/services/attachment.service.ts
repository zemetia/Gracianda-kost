// Server-only: writes to local disk under public/uploads/ for Fase 1.
// Swap this implementation for an S3-compatible client later — callers only
// depend on `url` being a fetchable path, not on how it got there.

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '@/lib/prisma';
import type { AttachmentEntity, AttachmentKind } from '@/generated/prisma/client';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4']);

export const attachmentService = {
  async upload(params: {
    file: File;
    entityType: AttachmentEntity;
    entityId: string;
    kind: AttachmentKind;
    label?: string;
  }) {
    const { file, entityType, entityId, kind, label } = params;

    if (file.size > MAX_FILE_BYTES) {
      throw new Error('Ukuran file maksimal 5MB');
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Tipe file tidak didukung');
    }

    const ext = path.extname(file.name) || '';
    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(UPLOAD_ROOT, entityType.toLowerCase(), entityId);
    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/${entityType.toLowerCase()}/${entityId}/${filename}`;

    return prisma.attachment.create({
      data: { entityType, entityId, kind, url, label },
    });
  },

  listFor(entityType: AttachmentEntity, entityId: string) {
    return prisma.attachment.findMany({ where: { entityType, entityId } });
  },

  remove(id: string) {
    return prisma.attachment.delete({ where: { id } });
  },
};
