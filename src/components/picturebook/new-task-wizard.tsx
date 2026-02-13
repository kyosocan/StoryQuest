'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
  createTaskAction,
  recognizeWordsAction,
  confirmWordsAction,
  generateContentAction,
} from '@/actions/picturebook';
import type { ConfirmedWord } from '@/db/schema';
import { useLocaleRouter } from '@/i18n/navigation';
import { usePicturebookStore } from '@/stores/use-picturebook-store';
import { WordInput } from './word-input';
import { GeneratingView } from './generating-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GRADE_LABELS } from '@/lib/picturebook/config';

type WizardStep = 'input' | 'generating';

function normalizePartOfSpeech(pos?: string): ConfirmedWord['partOfSpeech'] {
  const normalized = pos?.trim().toLowerCase();
  if (normalized === 'noun') return 'noun';
  if (normalized === 'verb') return 'verb';
  if (normalized === 'adjective') return 'adjective';
  if (normalized === 'abstract') return 'abstract';
  return 'noun';
}

export function NewTaskWizard() {
  const t = useTranslations('Picturebook');
  const router = useLocaleRouter();
  const { selectedGrade, setGenerating } = usePicturebookStore();

  const [step, setStep] = useState<WizardStep>('input');
  const [taskId, setTaskId] = useState<string | null>(null);

  const createTask = useAction(createTaskAction);
  const recognizeWords = useAction(recognizeWordsAction);
  const confirmWords = useAction(confirmWordsAction);
  const generateContent = useAction(generateContentAction);

  // 输入/上传单词 (自动创建任务)
  const handleWordSubmit = async (input: {
    text?: string;
    imageUrl?: string;
  }) => {
    let currentTaskId = taskId;

    if (!currentTaskId) {
      const gradeLabel = GRADE_LABELS[selectedGrade]?.zh || selectedGrade;
      const result = await createTask.executeAsync({
        title: `${gradeLabel}单词闯关`,
        grade: selectedGrade,
      });

      if (result?.data?.taskId) {
        currentTaskId = result.data.taskId;
        setTaskId(currentTaskId);
      } else {
        toast.error('创建任务失败');
        return;
      }
    }

    const result = await recognizeWords.executeAsync({
      taskId: currentTaskId,
      wordText: input.text,
      imageUrl: input.imageUrl,
    });

    if (result?.data?.success && result.data.words) {
      const autoConfirmedWords: ConfirmedWord[] = result.data.words
        .map((w) => ({
          word: w.word?.trim() || '',
          meaning: w.meaning?.trim() || '',
          partOfSpeech: normalizePartOfSpeech(w.partOfSpeech),
        }))
        .filter((w) => Boolean(w.word));

      if (autoConfirmedWords.length === 0) {
        toast.error('未识别到有效单词，请检查输入后重试');
        return;
      }

      const confirmResult = await confirmWords.executeAsync({
        taskId: currentTaskId,
        words: autoConfirmedWords,
      });

      if (!confirmResult?.data?.success) {
        const detailError =
          confirmResult?.data?.error ||
          confirmResult?.serverError ||
          '自动分组失败，请检查单词内容后重试';
        toast.error(detailError);
        return;
      }

      setStep('generating');
      setGenerating(true);
      const generateResult = await generateContent.executeAsync({
        taskId: currentTaskId,
      });
      setGenerating(false);

      if (generateResult?.data?.success) {
        toast.success('生成成功！');
        router.push(`/`);
        return;
      }

      toast.error(generateResult?.data?.error || '生成失败');
      setStep('input');
    } else {
      toast.error(result?.data?.error || '识别失败');
    }
  };

  const isInputPending =
    createTask.isPending ||
    recognizeWords.isPending ||
    confirmWords.isPending ||
    generateContent.isPending;

  return (
    <div className="space-y-6">
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('newTask.input.title')}</CardTitle>
            <CardDescription>{t('newTask.input.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WordInput onSubmit={handleWordSubmit} isLoading={isInputPending} />
          </CardContent>
        </Card>
      )}

      {step === 'generating' && <GeneratingView />}
    </div>
  );
}
