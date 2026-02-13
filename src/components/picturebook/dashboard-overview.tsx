'use client';

import { getTasksAction } from '@/actions/picturebook';
import { GRADE_LABELS } from '@/lib/picturebook/config';
import { TASK_STATUS } from '@/lib/picturebook/types';
import { usePicturebookStore } from '@/stores/use-picturebook-store';
import {
  BookOpenIcon,
  ClockIcon,
  PlusCircleIcon,
  SparklesIcon,
  TrophyIcon,
  Loader2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LocaleLink } from '@/i18n/navigation';

const statusConfig: Record<
  string,
  { label: string; labelZh: string; color: string }
> = {
  uploaded: {
    label: 'Uploaded',
    labelZh: '已上传',
    color: 'bg-blue-500/10 text-blue-500',
  },
  confirmed: {
    label: 'Confirmed',
    labelZh: '已确认',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  generating: {
    label: 'Generating',
    labelZh: '生成中',
    color: 'bg-purple-500/10 text-purple-500',
  },
  ready: {
    label: 'Ready',
    labelZh: '可闯关',
    color: 'bg-green-500/10 text-green-500',
  },
  completed: {
    label: 'Completed',
    labelZh: '已完成',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
};

export function PicturebookDashboard({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const t = useTranslations('Picturebook');
  const { execute, result, isPending } = useAction(getTasksAction);

  useEffect(() => {
    execute({});
  }, [execute]);

  const tasks = result?.data?.tasks || [];
  const readyTasks = tasks.filter((t) => t.status === TASK_STATUS.READY);
  const completedTasks = tasks.filter(
    (t) => t.status === TASK_STATUS.COMPLETED
  );

  return (
    <div className="space-y-6">
      {/* 顶部欢迎区域 */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('dashboard.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.description')}
            </p>
          </div>
          <LocaleLink href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <PlusCircleIcon className="size-5" />
              {t('dashboard.newTask')}
            </Button>
          </LocaleLink>
        </div>
      )}

      {/* 统计卡片 */}
      {!hideHeader && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.totalTasks')}
              </CardTitle>
              <BookOpenIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.readyTasks')}
              </CardTitle>
              <SparklesIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.completedTasks')}
              </CardTitle>
              <TrophyIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.totalWords')}
              </CardTitle>
              <ClockIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.reduce(
                  (sum, t) => sum + (t.confirmedWords?.length || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 待闯关任务 */}
      {readyTasks.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {t('dashboard.readySection')}
          </h2>
          <div
            className={
              hideHeader
                ? 'grid gap-4'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
            }
          >
            {readyTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* 最近任务 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {hideHeader ? '闯关列表' : t('dashboard.recentSection')}
        </h2>
        {isPending ? (
          <div className="text-muted-foreground flex items-center justify-center py-12">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="ml-2">{t('common.loading')}</span>
          </div>
        ) : tasks.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <BookOpenIcon className="text-muted-foreground mb-4 size-12" />
              <h3 className="text-lg font-semibold">
                {t('dashboard.empty.title')}
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {t('dashboard.empty.description')}
              </p>
              {!hideHeader && (
                <LocaleLink href="/dashboard/new" className="mt-4">
                  <Button>
                    <PlusCircleIcon className="mr-2 size-4" />
                    {t('dashboard.newTask')}
                  </Button>
                </LocaleLink>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              hideHeader
                ? 'grid gap-4'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
            }
          >
            {tasks.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    grade: string;
    status: string;
    confirmedWords?: unknown[] | null;
    wordGroups?: unknown[] | null;
    createdAt: Date;
  };
}) {
  const t = useTranslations('Picturebook');
  const { isGenerating } = usePicturebookStore();
  const status = statusConfig[task.status] || statusConfig.uploaded;
  const gradeLabel = GRADE_LABELS[task.grade];

  const isCurrentGenerating =
    isGenerating && task.status === TASK_STATUS.GENERATING;

  return (
    <LocaleLink href={isCurrentGenerating ? '#' : `/dashboard/task/${task.id}`}>
      <Card
        className={cn(
          'transition-shadow hover:shadow-md',
          isCurrentGenerating && 'border-primary animate-pulse'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base leading-tight">
              {task.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className={cn(
                status.color,
                isCurrentGenerating && 'bg-primary text-primary-foreground'
              )}
            >
              {isCurrentGenerating ? (
                <span className="flex items-center gap-1">
                  <Loader2Icon className="size-3 animate-spin" />
                  生成中...
                </span>
              ) : (
                status.labelZh
              )}
            </Badge>
          </div>
          <CardDescription>
            {gradeLabel?.zh || task.grade} ·{' '}
            {(task.confirmedWords as unknown[])?.length || 0}{' '}
            {t('common.words')} · {(task.wordGroups as unknown[])?.length || 0}{' '}
            {t('common.groups')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">
            {new Date(task.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </CardContent>
      </Card>
    </LocaleLink>
  );
}
