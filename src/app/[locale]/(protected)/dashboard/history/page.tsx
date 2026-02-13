import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { TaskHistory } from '@/components/picturebook/task-history';
import { useTranslations } from 'next-intl';

/**
 * 历史记录页面
 */
export default function HistoryPage() {
  const t = useTranslations('Picturebook');

  const breadcrumbs = [
    { label: t('dashboard.title') },
    { label: t('history.title'), isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
          <TaskHistory />
        </div>
      </div>
    </>
  );
}
