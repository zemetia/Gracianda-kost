'use client';

import { useRef, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import type { Attachment } from '@/generated/prisma/client';

interface MediaGalleryProps {
  entityId: string;
  attachments: Attachment[];
  /** Bound Server Actions — the gallery is shared by rooms and room types. */
  onUpload: (entityId: string, formData: FormData) => Promise<void>;
  onRemove: (entityId: string, attachmentId: string) => Promise<void>;
  emptyLabel?: string;
  /** Rendered above the grid when the media shown is inherited, not owned. */
  notice?: string;
  /** Inherited media belongs to another entity — hide the per-item delete. */
  readOnly?: boolean;
}

export function MediaGallery({
  entityId,
  attachments,
  onUpload,
  onRemove,
  emptyLabel = 'Belum ada foto/video.',
  notice,
  readOnly = false,
}: MediaGalleryProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {notice && <p className="text-sm text-foreground-muted">{notice}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group relative overflow-hidden rounded-md border border-border"
          >
            {attachment.kind === 'VIDEO' ? (
              <video src={attachment.url} className="aspect-square w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachment.url} alt="" className="aspect-square w-full object-cover" />
            )}
            {!readOnly && (
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => startRemove(() => onRemove(entityId, attachment.id))}
                className="absolute right-1 top-1 rounded bg-background/80 px-2 py-1 text-xs text-destructive opacity-0 transition-opacity group-hover:opacity-100"
              >
                Hapus
              </button>
            )}
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="col-span-full text-sm text-foreground-subtle">{emptyLabel}</p>
        )}
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startUpload(async () => {
            await onUpload(entityId, formData);
            formRef.current?.reset();
          })
        }
        className="flex items-center gap-3"
      >
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          required
          className="text-sm text-foreground-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
        <Button type="submit" size="sm" isLoading={isUploading}>
          Unggah
        </Button>
      </form>
    </div>
  );
}
