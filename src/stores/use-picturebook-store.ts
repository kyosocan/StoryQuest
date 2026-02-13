import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Grade } from '@/lib/picturebook/types';

interface PicturebookState {
  selectedGrade: Grade;
  setGrade: (grade: Grade) => void;
  isGenerating: boolean;
  setGenerating: (isGenerating: boolean) => void;
  lastTaskId: string | null;
  setLastTaskId: (taskId: string | null) => void;
}

export const usePicturebookStore = create<PicturebookState>()(
  persist(
    (set) => ({
      selectedGrade: '1',
      setGrade: (grade) => set({ selectedGrade: grade }),
      isGenerating: false,
      setGenerating: (isGenerating) => set({ isGenerating }),
      lastTaskId: null,
      setLastTaskId: (taskId) => set({ lastTaskId: taskId }),
    }),
    {
      name: 'picturebook-storage',
    }
  )
);
