'use client';

import { useTranslations } from 'next-intl';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function GeneratingView() {
  const t = useTranslations('Picturebook');

  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="bg-primary/10 flex size-20 items-center justify-center rounded-full">
            <SparklesIcon className="text-primary size-10" />
          </div>
          <div className="absolute -right-1 -top-1">
            <Loader2Icon className="text-primary size-6 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-semibold">
          {t('newTask.generating.title')}
        </h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          {t('newTask.generating.description')}
        </p>
        <div className="mt-6 flex items-center gap-2">
          <div className="bg-primary size-2 animate-bounce rounded-full [animation-delay:0ms]" />
          <div className="bg-primary size-2 animate-bounce rounded-full [animation-delay:150ms]" />
          <div className="bg-primary size-2 animate-bounce rounded-full [animation-delay:300ms]" />
        </div>
      </CardContent>
    </Card>
  );
}
