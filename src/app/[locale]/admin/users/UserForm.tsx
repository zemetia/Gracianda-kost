'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ROLE_LABEL } from '@/config/roles';
import { USER_ROLES } from '@/lib/validations';

import type { UserFormState } from './actions';

interface UserFormProps {
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  initial?: { name: string | null; email: string; role: string };
  submitLabel: string;
  passwordRequired: boolean;
}

const initialState: UserFormState = {};

export function UserForm({ action, initial, submitLabel, passwordRequired }: UserFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <FormLayout>
        <FormCard title="Identitas" description="Nama dan email yang dipakai untuk masuk ke admin.">
          <FormGrid>
            <Input
              label="Nama"
              name="name"
              required
              defaultValue={initial?.name ?? undefined}
              error={state.fieldErrors?.name?.[0]}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              defaultValue={initial?.email}
              error={state.fieldErrors?.email?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Akses"
          description="Role menentukan menu admin mana yang bisa dibuka pengguna ini."
        >
          <FormGrid>
            <Input
              label={passwordRequired ? 'Password' : 'Password Baru'}
              name="password"
              type="password"
              autoComplete="new-password"
              required={passwordRequired}
              hint={passwordRequired ? 'Minimal 8 karakter' : 'Kosongkan kalau tidak diganti'}
              error={state.fieldErrors?.password?.[0]}
            />
            <Select
              name="role"
              label="Role"
              required
              defaultValue={initial?.role ?? 'OPERASIONAL'}
              options={USER_ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] ?? role }))}
              error={state.fieldErrors?.role?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormError message={state.error} />
        {state.success && (
          <p role="status" className="text-sm text-success">
            {state.success}
          </p>
        )}

        <FormStickyBar>
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
