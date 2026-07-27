'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <Input
          label={passwordRequired ? 'Password' : 'Password Baru'}
          name="password"
          type="password"
          autoComplete="new-password"
          required={passwordRequired}
          hint={passwordRequired ? 'Minimal 8 karakter' : 'Kosongkan kalau tidak diganti'}
          error={state.fieldErrors?.password?.[0]}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            Role <span className="text-destructive">*</span>
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={initial?.role ?? 'OPERASIONAL'}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.role && (
            <p className="text-xs text-destructive">{state.fieldErrors.role[0]}</p>
          )}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" isLoading={isPending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
