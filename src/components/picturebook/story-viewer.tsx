'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, LanguagesIcon } from 'lucide-react';

interface StoryViewerProps {
  story: string;
  storyZh?: string;
  words: string[];
}

export function StoryViewer({ story, storyZh, words }: StoryViewerProps) {
  const t = useTranslations('Picturebook');
  const [expanded, setExpanded] = useState(false);
  const [showZh, setShowZh] = useState(false);

  // 高亮单词
  const highlightStory = (text: string) => {
    const parts: Array<{ text: string; isHighlight: boolean }> = [];
    let remaining = text;

    while (remaining.length > 0) {
      let earliestIndex = remaining.length;
      let matchedWord = '';

      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        const match = regex.exec(remaining);
        if (match && match.index < earliestIndex) {
          earliestIndex = match.index;
          matchedWord = match[0];
        }
      }

      if (matchedWord) {
        if (earliestIndex > 0) {
          parts.push({
            text: remaining.slice(0, earliestIndex),
            isHighlight: false,
          });
        }
        parts.push({ text: matchedWord, isHighlight: true });
        remaining = remaining.slice(earliestIndex + matchedWord.length);
      } else {
        parts.push({ text: remaining, isHighlight: false });
        break;
      }
    }

    return parts;
  };

  const displayStory = showZh && storyZh ? storyZh : story;
  const highlighted = showZh ? [] : highlightStory(displayStory);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1 text-xs"
        >
          {expanded ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
          {expanded ? t('story.collapse') : t('story.expand')}
        </Button>
        {storyZh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowZh(!showZh)}
            className="gap-1 text-xs"
          >
            <LanguagesIcon className="size-4" />
            {showZh ? t('story.showEnglish') : t('story.showChinese')}
          </Button>
        )}
      </div>

      {expanded && (
        <div className="bg-muted/50 rounded-lg p-4 leading-relaxed">
          {showZh ? (
            <p className="text-sm">{storyZh}</p>
          ) : (
            <p className="text-sm">
              {highlighted.map((part, i) =>
                part.isHighlight ? (
                  <span
                    key={`part-${i}`}
                    className="bg-primary/20 text-primary rounded px-1 font-semibold"
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={`part-${i}`}>{part.text}</span>
                )
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
