import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import {
  BookOpenIcon,
  CoinsIcon,
  LogInIcon,
  SparklesIcon,
  TrophyIcon,
  UploadIcon,
} from 'lucide-react';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

import { NewTaskWizard } from '@/components/picturebook/new-task-wizard';
import { PicturebookDashboard } from '@/components/picturebook/dashboard-overview';

export default async function HomePage(props: HomePageProps) {
  await props.params;
  const t = await getTranslations('Picturebook');

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 md:py-16">
      <section className="space-y-5 text-center">
        <Badge className="gap-2 px-3 py-1.5">
          <SparklesIcon className="size-4" />
          {t('landing.badge')}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          {t('landing.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-3xl text-base md:text-lg">
          {t('landing.subtitle')}
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewTaskWizard />
        </div>
        <div className="space-y-6">
          <PicturebookDashboard hideHeader />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadIcon className="size-4" />
              {t('landing.steps.uploadTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('landing.steps.uploadDesc')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4" />
              {t('landing.steps.generateTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('landing.steps.generateDesc')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrophyIcon className="size-4" />
              {t('landing.steps.challengeTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('landing.steps.challengeDesc')}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border p-5 md:p-6">
        <h2 className="mb-3 text-lg font-semibold">
          {t('landing.rulesTitle')}
        </h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>{t('landing.rules.grouping')}</li>
          <li>{t('landing.rules.story')}</li>
          <li>{t('landing.rules.cards')}</li>
          <li>{t('landing.rules.difficulty')}</li>
          <li>{t('landing.rules.reading')}</li>
        </ul>
      </section>
    </div>
  );
}
