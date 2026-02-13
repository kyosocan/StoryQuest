import { cn } from '@/lib/utils';
import Image from 'next/image';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/logo.png"
      alt="WordQuest"
      width={120}
      height={32}
      className={cn('h-5 w-auto', className)}
    />
  );
};

export const LogoIcon = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/logo.png"
      alt="WordQuest"
      width={32}
      height={32}
      className={cn('size-8 rounded-md', className)}
    />
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/logo.png"
      alt="WordQuest"
      width={28}
      height={28}
      className={cn('size-7', className)}
    />
  );
};
