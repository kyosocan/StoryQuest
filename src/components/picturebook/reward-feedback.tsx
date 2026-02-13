'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, PartyPopperIcon, StarIcon } from 'lucide-react';

interface RewardFeedbackProps {
  totalCards: number;
  passedCards: number;
  onBack: () => void;
}

export function RewardFeedback({
  totalCards,
  passedCards,
  onBack,
}: RewardFeedbackProps) {
  const t = useTranslations('Picturebook');

  // 计算星级
  const percentage = totalCards > 0 ? passedCards / totalCards : 0;
  const stars = percentage >= 1 ? 3 : percentage >= 0.7 ? 2 : 1;

  // 触发 confetti 效果
  useEffect(() => {
    const loadConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        });
      } catch {
        // canvas-confetti not available
      }
    };
    loadConfetti();
  }, []);

  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <PartyPopperIcon className="size-16 text-yellow-500" />
        </div>

        <h2 className="text-2xl font-bold md:text-3xl">{t('reward.title')}</h2>

        <p className="text-muted-foreground mt-2">
          {t('reward.description', { passed: passedCards, total: totalCards })}
        </p>

        {/* 星级显示 */}
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <StarIcon
              key={i}
              className={`size-10 transition-all ${
                i <= stars
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <div className="mt-2 text-lg font-medium">
          {stars === 3
            ? t('reward.perfect')
            : stars === 2
              ? t('reward.great')
              : t('reward.good')}
        </div>

        {/* 得分 */}
        <div className="bg-muted mt-6 rounded-xl px-8 py-4">
          <div className="text-4xl font-bold text-primary">
            {Math.round(percentage * 100)}%
          </div>
          <div className="text-muted-foreground text-sm">
            {t('reward.score')}
          </div>
        </div>

        <Button onClick={onBack} className="mt-8 gap-2">
          <ArrowLeftIcon className="size-4" />
          {t('reward.backToTask')}
        </Button>
      </CardContent>
    </Card>
  );
}
