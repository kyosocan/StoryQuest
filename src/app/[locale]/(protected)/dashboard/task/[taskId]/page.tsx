import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { TaskDetail } from '@/components/picturebook/task-detail';
import { useTranslations } from 'next-intl';

/**
 * 任务详情页 - 显示故事和闯关入口
 */
export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  return <TaskDetailContent params={params} />;
}

async function TaskDetailContent({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const t = useTranslations('Picturebook');

  const breadcrumbs = [
    { label: t('dashboard.title') },
    { label: t('task.detail'), isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
          <TaskDetail taskId={taskId} />
        </div>
      </div>
    </>
  );
}
