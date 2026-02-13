'use client';

import { GRADE_LABELS } from '@/lib/picturebook/config';
import { GRADES } from '@/lib/picturebook/types';
import { usePicturebookStore } from '@/stores/use-picturebook-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCapIcon } from 'lucide-react';

export function GlobalGradeSelector() {
  const { selectedGrade, setGrade } = usePicturebookStore();

  return (
    <div className="flex items-center gap-2">
      <GraduationCapIcon className="text-muted-foreground size-4" />
      <Select value={selectedGrade} onValueChange={(v) => setGrade(v as any)}>
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue placeholder="选择年级" />
        </SelectTrigger>
        <SelectContent>
          {GRADES.map((grade) => (
            <SelectItem key={grade} value={grade}>
              {GRADE_LABELS[grade]?.zh || grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
