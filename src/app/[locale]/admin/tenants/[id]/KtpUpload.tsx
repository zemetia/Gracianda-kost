'use client';

import { useRef, useTransition } from 'react';
import type { Attachment } from '@prisma/client';

import { Button } from '@/components/ui/Button';

import { uploadKtpAction } from '../actions';

interface Props {
  tenantId: string;
  attachments: Attachment[];
}

export function KtpUpload({ tenantId, attachments }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, startUpload] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {attachments.map((attachment) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={attachment.id}
            src={attachment.url}
            alt="Scan KTP"
            className="h-32 w-48 rounded-md border border-border object-cover"
          />
        ))}
        {attachments.length === 0 && (
          <p className="text-sm text-foreground-subtle">Belum ada scan KTP.</p>
        )}
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startUpload(async () => {
            await uploadKtpAction(tenantId, formData);
            formRef.current?.reset();
          })
        }
        className="flex items-center gap-3"
      >
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
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
