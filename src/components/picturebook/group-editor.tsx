'use client';

import type { WordGroup } from '@/db/schema';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayersIcon } from 'lucide-react';

interface GroupEditorProps {
  groups: WordGroup[];
  onChange: (groups: WordGroup[]) => void;
}

export function GroupEditor({ groups }: GroupEditorProps) {
  const t = useTranslations('Picturebook');

  const posLabels: Record<string, string> = {
    noun: '名词',
    verb: '动词',
    adjective: '形容词',
    abstract: '抽象词',
  };

  const posColors: Record<string, string> = {
    noun: 'bg-blue-500/10 text-blue-600',
    verb: 'bg-green-500/10 text-green-600',
    adjective: 'bg-orange-500/10 text-orange-600',
    abstract: 'bg-purple-500/10 text-purple-600',
  };

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <LayersIcon className="size-4" />
        <span>{t('newTask.group.groupCount', { count: groups.length })}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.groupIndex}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t('newTask.group.groupLabel', {
                  index: group.groupIndex + 1,
                })}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {group.words.length} {t('common.words')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {group.words.map((word) => (
                  <div
                    key={word.word}
                    className="bg-muted flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-sm font-medium">{word.word}</span>
                    <span className="text-muted-foreground text-xs">
                      {word.meaning}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${posColors[word.partOfSpeech] || ''}`}
                    >
                      {posLabels[word.partOfSpeech] || word.partOfSpeech}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
