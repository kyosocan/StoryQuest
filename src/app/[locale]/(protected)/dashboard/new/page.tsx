import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { NewTaskWizard } from '@/components/picturebook/new-task-wizard';
import { useTranslations } from 'next-intl';

/**
 * 新建学习任务页面 - 多步骤向导
 */
export default function NewTaskPage() {
  const t = useTranslations('Picturebook');

  const breadcrumbs = [
    { label: t('dashboard.title') },
    { label: t('newTask.title'), isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
          <NewTaskWizard />
        </div>
      </div>
    </>
  );
}
