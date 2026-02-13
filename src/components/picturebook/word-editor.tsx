'use client';

import type { ConfirmedWord } from '@/db/schema';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';

const POS_OPTIONS = [
  { value: 'noun', label: '名词', labelEn: 'Noun' },
  { value: 'verb', label: '动词', labelEn: 'Verb' },
  { value: 'adjective', label: '形容词', labelEn: 'Adjective' },
  { value: 'abstract', label: '抽象词', labelEn: 'Abstract' },
];

interface WordEditorProps {
  words: ConfirmedWord[];
  onChange: (words: ConfirmedWord[]) => void;
}

export function WordEditor({ words, onChange }: WordEditorProps) {
  const t = useTranslations('Picturebook');

  const updateWord = (
    index: number,
    field: keyof ConfirmedWord,
    value: string
  ) => {
    const newWords = [...words];
    newWords[index] = { ...newWords[index], [field]: value };
    onChange(newWords);
  };

  const removeWord = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  const addWord = () => {
    onChange([...words, { word: '', meaning: '', partOfSpeech: 'noun' }]);
  };

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>{t('newTask.confirm.wordCount', { count: words.length })}</span>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_1fr_120px_40px] gap-2 text-xs font-medium text-muted-foreground">
        <span>{t('newTask.confirm.word')}</span>
        <span>{t('newTask.confirm.meaning')}</span>
        <span>{t('newTask.confirm.pos')}</span>
        <span />
      </div>

      {/* 单词列表 */}
      <div className="space-y-2">
        {words.map((word, index) => (
          <div
            key={`word-${index}`}
            className="grid grid-cols-[1fr_1fr_120px_40px] items-center gap-2"
          >
            <Input
              value={word.word}
              onChange={(e) => updateWord(index, 'word', e.target.value)}
              placeholder="apple"
              className="h-9 text-sm"
            />
            <Input
              value={word.meaning}
              onChange={(e) => updateWord(index, 'meaning', e.target.value)}
              placeholder="苹果"
              className="h-9 text-sm"
            />
            <Select
              value={word.partOfSpeech}
              onValueChange={(value) =>
                updateWord(index, 'partOfSpeech', value)
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => removeWord(index)}
            >
              <Trash2Icon className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addWord} className="gap-1">
        <PlusIcon className="size-4" />
        {t('newTask.confirm.addWord')}
      </Button>
    </div>
  );
}
