'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Get navbar config with translations
 *
 * Simplified for AI Picturebook Challenge website
 * Only keep pricing link
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    {
      title: t('pricing.title'),
      href: Routes.Pricing,
      external: false,
    },
  ];
}
