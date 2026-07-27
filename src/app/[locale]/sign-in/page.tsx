import type { Metadata } from 'next';

import { buildMetadata } from '@/lib/seo';

import { SignInForm } from './SignInForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Masuk Admin',
    path: '/sign-in',
    locale,
    noIndex: true,
  });
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignInForm />
    </main>
  );
}
