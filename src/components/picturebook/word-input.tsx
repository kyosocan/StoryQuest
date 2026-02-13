'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { recognizeImagePreviewAction } from '@/actions/picturebook';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlusIcon, Loader2Icon, ScanTextIcon } from 'lucide-react';
import { toast } from 'sonner';

interface WordInputProps {
  onSubmit: (input: { text?: string; imageUrl?: string }) => void;
  isLoading: boolean;
}

/** 将识别结果格式化为文本框用的「每行一个：单词 释义」 */
function formatWordsToLines(
  words: Array<{ word: string; meaning?: string }>
): string {
  return words
    .map((w) => (w.meaning ? `${w.word} ${w.meaning}` : w.word))
    .join('\n');
}

export function WordInput({ onSubmit, isLoading }: WordInputProps) {
  const t = useTranslations('Picturebook');
  const recognizeImagePreview = useAction(recognizeImagePreviewAction);
  const [text, setText] = useState('');
  const [imageName, setImageName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedCount, setRecognizedCount] = useState(0);

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText || imageUrl) {
      // 若文本框已有内容（含上传图片后识别结果），只提交文本，避免重复识别和重复扣费
      onSubmit({
        text: trimmedText || undefined,
        imageUrl: trimmedText ? undefined : imageUrl || undefined,
      });
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result !== 'string') return;
        const dataUrl = reader.result;
        setImageUrl(dataUrl);
        setImageName(file.name);
        setRecognizing(true);
        const result = await recognizeImagePreview.executeAsync({
          imageUrl: dataUrl,
        });
        setRecognizing(false);
        if (result?.data?.success && result.data.words?.length) {
          const lines = formatWordsToLines(result.data.words);
          setText(lines);
          setRecognizedCount(result.data.words.length);
          toast.success(`已识别 ${result.data.words.length} 个单词，请核对后点击生成`);
        } else if (result?.data?.success && !result.data.words?.length) {
          setRecognizedCount(0);
          toast.warning('未识别到单词，请换一张图片或手动输入');
        } else {
          setRecognizedCount(0);
          toast.error(result?.data?.error || '图片识别失败，请重试');
        }
      };
      reader.onerror = () => {
        toast.error('读取图片失败，请重试');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder={t('newTask.input.placeholder')}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (recognizedCount > 0) {
              setRecognizedCount(0);
            }
          }}
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-muted-foreground text-xs">
          {t('newTask.input.hint')}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleUploadClick}
        disabled={isLoading || recognizing}
        className="w-full"
      >
        {recognizing ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            正在识别图片…
          </>
        ) : (
          <>
            <ImagePlusIcon className="mr-2 size-4" />
            {imageName ? `重新上传图片：${imageName}` : '上传图片并自动识别单词'}
          </>
        )}
      </Button>
      {recognizedCount > 0 && (
        <p className="text-muted-foreground text-xs">
          已从图片识别出 {recognizedCount} 个单词，可在上方继续编辑，确认无误后再生成。
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            {t('newTask.generating.title')}
          </>
        ) : (
          <>
            <ScanTextIcon className="mr-2 size-4" />
            {t('newTask.generate')}
          </>
        )}
      </Button>
    </div>
  );
}
