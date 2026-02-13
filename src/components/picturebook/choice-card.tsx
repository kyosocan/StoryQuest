'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ChallengeCardContent } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon, Loader2Icon } from 'lucide-react';

interface ChoiceCardProps {
  content: ChallengeCardContent;
  onSubmit: (selectedIndex: number) => void;
  disabled: boolean;
}

export function ChoiceCard({ content, onSubmit, disabled }: ChoiceCardProps) {
  const t = useTranslations('Picturebook');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index: number) => {
    if (submitted || disabled) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || disabled) return;
    setSubmitted(true);
    onSubmit(selectedIndex);
  };

  const options = content.options || [];

  return (
    <div className="space-y-4">
      {/* 问题 */}
      {content.question && (
        <div className="rounded-xl bg-linear-to-r from-yellow-500/10 to-orange-500/10 p-6">
          <p className="text-lg font-medium">{content.question}</p>
          {content.questionZh && (
            <p className="text-muted-foreground mt-1 text-sm">
              {content.questionZh}
            </p>
          )}
        </div>
      )}

      {/* 选项 */}
      <div className="grid gap-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = submitted && option.isCorrect;
          const isWrong = submitted && isSelected && !option.isCorrect;

          return (
            <button
              key={`option-${index}`}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={submitted || disabled}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                !submitted && isSelected
                  ? 'border-primary bg-primary/5'
                  : !submitted
                    ? 'hover:border-primary/50 border-transparent hover:bg-muted/50'
                    : '',
                isCorrect && 'border-emerald-500 bg-emerald-500/10',
                isWrong && 'border-red-500 bg-red-500/10'
              )}
            >
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
                  isSelected && !submitted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30',
                  isCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                  isWrong && 'border-red-500 bg-red-500 text-white'
                )}
              >
                {isCorrect ? (
                  <CheckIcon className="size-4" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>
              <div>
                <p className="font-medium">{option.text}</p>
                {option.textZh && (
                  <p className="text-muted-foreground text-xs">
                    {option.textZh}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 提交按钮 */}
      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selectedIndex === null || disabled}
          className="w-full"
        >
          {disabled ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : null}
          {t('challenge.submit')}
        </Button>
      )}
    </div>
  );
}
