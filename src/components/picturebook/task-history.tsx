'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { getTasksAction } from '@/actions/picturebook';
import { GRADE_LABELS } from '@/lib/picturebook/config';
import { LocaleLink } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpenIcon, ExternalLinkIcon, Loader2Icon } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  uploaded: { label: '已上传', color: 'bg-blue-500/10 text-blue-500' },
  confirmed: { label: '已确认', color: 'bg-yellow-500/10 text-yellow-500' },
  generating: { label: '生成中', color: 'bg-purple-500/10 text-purple-500' },
  ready: { label: '可闯关', color: 'bg-green-500/10 text-green-500' },
  completed: { label: '已完成', color: 'bg-emerald-500/10 text-emerald-500' },
};

export function TaskHistory() {
  const t = useTranslations('Picturebook');
  const { execute, result, isPending } = useAction(getTasksAction);

  useEffect(() => {
    execute({});
  }, [execute]);

  const tasks = result?.data?.tasks || [];

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('history.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('history.description')}</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <BookOpenIcon className="text-muted-foreground mb-4 size-12" />
            <h3 className="text-lg font-semibold">{t('history.empty')}</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.table.title')}</TableHead>
                  <TableHead>{t('history.table.grade')}</TableHead>
                  <TableHead>{t('history.table.words')}</TableHead>
                  <TableHead>{t('history.table.status')}</TableHead>
                  <TableHead>{t('history.table.date')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const status =
                    statusLabels[task.status] || statusLabels.uploaded;
                  const gradeLabel = GRADE_LABELS[task.grade]?.zh || task.grade;

                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>{gradeLabel}</TableCell>
                      <TableCell>
                        {(task.confirmedWords as unknown[])?.length || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <LocaleLink
                          href={`/dashboard/task/${task.id}`}
                          className="text-primary hover:underline"
                        >
                          <ExternalLinkIcon className="size-4" />
                        </LocaleLink>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
