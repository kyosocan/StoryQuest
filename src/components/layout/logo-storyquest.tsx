import { cn } from '@/lib/utils';
import Image from 'next/image';

export function StoryQuestLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="StoryQuest"
      title="StoryQuest"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
