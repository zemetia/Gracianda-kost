'use server';

import { AuthError } from 'next-auth';

import { signIn } from '@/auth';
import { loginSchema } from '@/lib/validations';

export interface SignInState {
  error?: string;
  fieldErrors?: Partial<Record<'email' | 'password', string[]>>;
}

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/admin',
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'Email atau password salah.' };
    }
    throw err;
  }
}
