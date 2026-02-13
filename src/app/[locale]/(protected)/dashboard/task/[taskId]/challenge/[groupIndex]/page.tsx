import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ChallengeView } from '@/components/picturebook/challenge-view';
import { useTranslations } from 'next-intl';

/**
 * 闯关页面
 */
export default function ChallengePage({
  params,
}: {
  params: Promise<{ taskId: string; groupIndex: string }>;
}) {
  return <ChallengeContent params={params} />;
}

async function ChallengeContent({
  params,
}: {
  params: Promise<{ taskId: string; groupIndex: string }>;
}) {
  const { taskId, groupIndex } = await params;
  const t = useTranslations('Picturebook');

  const breadcrumbs = [
    { label: t('dashboard.title') },
    { label: t('task.detail') },
    {
      label: t('challenge.title', { index: Number(groupIndex) + 1 }),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
          <ChallengeView taskId={taskId} groupIndex={Number(groupIndex)} />
        </div>
      </div>
    </>
  );
}
