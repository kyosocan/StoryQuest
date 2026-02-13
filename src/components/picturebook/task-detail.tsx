'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { getTaskDetailAction } from '@/actions/picturebook';
import { GRADE_LABELS } from '@/lib/picturebook/config';
import { TASK_STATUS } from '@/lib/picturebook/types';
import { LocaleLink } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BookOpenIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
  SwordsIcon,
} from 'lucide-react';
import { StoryViewer } from './story-viewer';

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const t = useTranslations('Picturebook');
  const { execute, result, isPending } = useAction(getTaskDetailAction);

  useEffect(() => {
    execute({ taskId });
  }, [execute, taskId]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const data = result?.data;
  if (!data?.success || !data.task) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        {t('task.notFound')}
      </div>
    );
  }

  const { task, stories, cards, attempts } = data;
  const gradeLabel = GRADE_LABELS[task.grade]?.zh || task.grade;

  // 计算各组进度
  const groupProgress = stories.map((story) => {
    const groupCards = cards.filter((c) => c.groupIndex === story.groupIndex);
    const passedCards = groupCards.filter((card) =>
      attempts.some((a) => a.cardId === card.id && a.passed)
    );
    return {
      story,
      totalCards: groupCards.length,
      passedCards: passedCards.length,
      allPassed:
        passedCards.length === groupCards.length && groupCards.length > 0,
    };
  });

  const totalPassed = groupProgress.filter((g) => g.allPassed).length;
  const allGroupsPassed =
    totalPassed === groupProgress.length && groupProgress.length > 0;

  return (
    <div className="space-y-6">
      {/* 任务头部 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="secondary">{gradeLabel}</Badge>
            <span className="text-muted-foreground text-sm">
              {(task.confirmedWords as unknown[])?.length || 0}{' '}
              {t('common.words')} · {stories.length} {t('common.groups')}
            </span>
          </div>
        </div>
        {allGroupsPassed && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-emerald-600">
            <CheckCircle2Icon className="size-5" />
            <span className="font-medium">{t('task.allCompleted')}</span>
          </div>
        )}
      </div>

      {/* 故事和闯关列表 */}
      <div className="space-y-6">
        {groupProgress.map(
          ({ story, totalCards, passedCards, allPassed }, index) => (
            <Card key={story.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpenIcon className="size-5" />
                      {t('task.storyTitle', { index: index + 1 })}
                      {allPassed && (
                        <Badge className="bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2Icon className="mr-1 size-3" />
                          {t('task.completed')}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {t('task.words')}: {story.words.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {passedCards}/{totalCards}
                    </div>
                    <div className="text-muted-foreground">
                      {t('task.cardsPassed')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 故事内容（折叠显示） */}
                <StoryViewer
                  story={story.storyContent}
                  storyZh={story.storyContentZh || undefined}
                  words={story.words}
                />

                {/* 进度条 */}
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${totalCards > 0 ? (passedCards / totalCards) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* 闯关按钮 */}
                <LocaleLink
                  href={`/dashboard/task/${taskId}/challenge/${story.groupIndex}`}
                >
                  <Button
                    className="w-full gap-2"
                    variant={allPassed ? 'outline' : 'default'}
                  >
                    {allPassed ? (
                      <>
                        <SparklesIcon className="size-4" />
                        {t('task.reviewChallenge')}
                      </>
                    ) : (
                      <>
                        <SwordsIcon className="size-4" />
                        {t('task.startChallenge')}
                      </>
                    )}
                  </Button>
                </LocaleLink>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
