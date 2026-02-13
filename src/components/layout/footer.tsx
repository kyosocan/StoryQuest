'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcherHorizontal } from '@/components/layout/mode-switcher-horizontal';
import { useFooterLinks } from '@/config/footer-config';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations();
  const footerLinks = useFooterLinks();

  return (
    <footer className={cn('border-t', className)}>
      <Container className="px-4">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-6">
          <div className="col-span-full flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2">
              <Logo />
              <span className="text-xl font-semibold">
                {t('Metadata.name')}
              </span>
            </div>
          </div>

          {footerLinks?.map((section) => (
            <div
              key={section.title}
              className="col-span-1 items-start md:col-span-1"
            >
              <span className="text-sm font-semibold uppercase">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {item.title}
                        </LocaleLink>
                      </li>
                    )
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t py-8">
        <Container className="px-4 flex items-center justify-between gap-x-4">
          <span className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {t('Metadata.name')} All Rights
            Reserved.
          </span>

          <div className="flex items-center gap-x-4">
            <ModeSwitcherHorizontal />
          </div>
        </Container>
      </div>
    </footer>
  );
}
