'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';

import type { UserFormState } from './actions';

interface UserActiveToggleProps {
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  isActive: boolean;
}

const initialState: UserFormState = {};

export function UserActiveToggle({ action, isActive }: UserActiveToggleProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
      <Button type="submit" variant={isActive ? 'destructive' : 'secondary'} isLoading={isPending}>
        {isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
