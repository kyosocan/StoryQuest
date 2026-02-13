'use client';

import { GRADE_LABELS } from '@/lib/picturebook/config';
import { GRADES } from '@/lib/picturebook/types';
import type { Grade } from '@/lib/picturebook/types';
import { cn } from '@/lib/utils';
import { GraduationCapIcon, AwardIcon } from 'lucide-react';

interface GradeSelectorProps {
  selected: Grade | null;
  onSelect: (grade: Grade) => void;
}

export function GradeSelector({ selected, onSelect }: GradeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GRADES.map((grade) => {
        const label = GRADE_LABELS[grade];
        const isExam = grade === 'KET' || grade === 'PET';

        return (
          <button
            key={grade}
            type="button"
            onClick={() => onSelect(grade)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-md',
              selected === grade
                ? 'border-primary bg-primary/5 shadow-md'
                : 'hover:border-primary/50 border-transparent bg-muted/50'
            )}
          >
            {isExam ? (
              <AwardIcon
                className={cn(
                  'size-8',
                  selected === grade ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            ) : (
              <GraduationCapIcon
                className={cn(
                  'size-8',
                  selected === grade ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                selected === grade ? 'text-primary' : ''
              )}
            >
              {label?.zh || grade}
            </span>
          </button>
        );
      })}
    </div>
  );
}
