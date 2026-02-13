'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import {
  getTaskDetailAction,
  submitChallengeAction,
} from '@/actions/picturebook';
import type { ChallengeCardContent } from '@/db/schema';
import { LocaleLink, useLocaleRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MicIcon,
  RotateCcwIcon,
  StarIcon,
  XCircleIcon,
} from 'lucide-react';
import { ReadingCard } from './reading-card';
import { ChoiceCard } from './choice-card';
import { RewardFeedback } from './reward-feedback';

interface ChallengeViewProps {
  taskId: string;
  groupIndex: number;
}

type CardData = {
  id: string;
  cardType: string;
  subType: string;
  targetWord: string;
  cardIndex: number;
  content: ChallengeCardContent;
};

export function ChallengeView({ taskId, groupIndex }: ChallengeViewProps) {
  const t = useTranslations('Picturebook');
  const router = useLocaleRouter();
  const { execute, result, isPending } = useAction(getTaskDetailAction);
  const submitChallenge = useAction(submitChallengeAction);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [passedCards, setPassedCards] = useState<Set<string>>(new Set());
  const [showReward, setShowReward] = useState(false);
  const [lastResult, setLastResult] = useState<{
    passed: boolean;
    score: number;
    hint?: string;
  } | null>(null);

  useEffect(() => {
    execute({ taskId });
  }, [execute, taskId]);

  const data = result?.data;
  if (isPending || !data?.success) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const cards = (data.cards || [])
    .filter((c) => c.groupIndex === groupIndex)
    .sort((a, b) => a.cardIndex - b.cardIndex) as CardData[];

  const story = data.stories?.find((s) => s.groupIndex === groupIndex);
  const attempts = data.attempts || [];

  // 初始化已通过的卡片
  if (passedCards.size === 0 && attempts.length > 0) {
    const passed = new Set<string>();
    for (const attempt of attempts) {
      if (attempt.passed) {
        passed.add(attempt.cardId);
      }
    }
    if (passed.size > 0) {
      setPassedCards(passed);
    }
  }

  const currentCard = cards[currentCardIndex];
  const progress =
    cards.length > 0 ? (passedCards.size / cards.length) * 100 : 0;
  const allPassed = passedCards.size === cards.length && cards.length > 0;

  // 提交答案
  const handleSubmit = async (response: {
    type: 'reading' | 'choice';
    spokenText?: string;
    matchedKeywords?: string[];
    matchPercentage?: number;
    selectedOptionIndex?: number;
  }) => {
    if (!currentCard) return;

    const result = await submitChallenge.executeAsync({
      cardId: currentCard.id,
      taskId,
      response,
    });

    if (result?.data?.success) {
      setLastResult({
        passed: result.data.passed ?? false,
        score: result.data.score ?? 0,
        hint: result.data.hint,
      });

      if (result.data.passed) {
        const newPassed = new Set(passedCards);
        newPassed.add(currentCard.id);
        setPassedCards(newPassed);

        // 检查是否全部通过
        if (newPassed.size === cards.length) {
          setTimeout(() => setShowReward(true), 1000);
        }
      }
    }
  };

  // 下一题
  const handleNext = () => {
    setLastResult(null);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // 重试
  const handleRetry = () => {
    setLastResult(null);
  };

  if (showReward) {
    return (
      <RewardFeedback
        totalCards={cards.length}
        passedCards={passedCards.size}
        onBack={() => router.push(`/`)}
      />
    );
  }

  if (!currentCard) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        {t('challenge.noCards')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('challenge.progress', {
              current: currentCardIndex + 1,
              total: cards.length,
            })}
          </span>
          <span className="font-medium">
            {passedCards.size}/{cards.length} {t('challenge.passed')}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 当前卡片 */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {currentCard.cardType === 'reading' ? (
                  <MicIcon className="size-5 text-blue-500" />
                ) : (
                  <StarIcon className="size-5 text-yellow-500" />
                )}
                {currentCard.content.instruction}
              </CardTitle>
              {currentCard.content.instructionZh && (
                <CardDescription className="mt-1">
                  {currentCard.content.instructionZh}
                </CardDescription>
              )}
            </div>
            <Badge variant="outline">{currentCard.targetWord}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* 故事上下文 */}
          {currentCard.content.storyContext && (
            <div className="bg-muted/50 mb-4 rounded-lg p-3 text-sm italic">
              &quot;{currentCard.content.storyContext}&quot;
            </div>
          )}

          {/* 卡片内容 */}
          {currentCard.cardType === 'reading' ? (
            <ReadingCard
              content={currentCard.content}
              onSubmit={(result) =>
                handleSubmit({
                  type: 'reading',
                  spokenText: result.spokenText,
                  matchedKeywords: result.matchedKeywords,
                  matchPercentage: result.matchPercentage,
                })
              }
              disabled={submitChallenge.isPending}
            />
          ) : (
            <ChoiceCard
              content={currentCard.content}
              onSubmit={(selectedIndex) =>
                handleSubmit({
                  type: 'choice',
                  selectedOptionIndex: selectedIndex,
                })
              }
              disabled={submitChallenge.isPending}
            />
          )}

          {/* 结果反馈 */}
          {lastResult && (
            <div
              className={`mt-4 flex items-center gap-3 rounded-lg p-4 ${
                lastResult.passed
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-600'
              }`}
            >
              {lastResult.passed ? (
                <CheckCircle2Icon className="size-6" />
              ) : (
                <XCircleIcon className="size-6" />
              )}
              <div>
                <p className="font-medium">
                  {lastResult.passed
                    ? t('challenge.correct')
                    : t('challenge.incorrect')}
                </p>
                {lastResult.hint && (
                  <p className="mt-1 text-sm opacity-80">{lastResult.hint}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentCardIndex > 0) {
              setCurrentCardIndex(currentCardIndex - 1);
              setLastResult(null);
            }
          }}
          disabled={currentCardIndex === 0}
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          {t('common.back')}
        </Button>

        <div className="flex gap-2">
          {lastResult && !lastResult.passed && (
            <Button variant="outline" onClick={handleRetry}>
              <RotateCcwIcon className="mr-2 size-4" />
              {t('challenge.retry')}
            </Button>
          )}

          {(lastResult?.passed || passedCards.has(currentCard.id)) &&
            currentCardIndex < cards.length - 1 && (
              <Button onClick={handleNext}>
                {t('common.next')}
                <ArrowRightIcon className="ml-2 size-4" />
              </Button>
            )}

          {allPassed && (
            <Button onClick={() => setShowReward(true)}>
              <StarIcon className="mr-2 size-4" />
              {t('challenge.viewReward')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
