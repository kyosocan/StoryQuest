import 'server-only';

import type {
  ChallengeCardContent,
  ConfirmedWord,
  RecognizedWord,
} from '@/db/schema';
import { DIFFICULTY_MAP } from './config';
import { STORY_STYLE } from './config';
import type { CardSubType, CardType, Grade } from './types';
import { CARD_SUB_TYPE, CARD_TYPE, POS_TO_CARD_TYPE } from './types';

import { callTalAiChat } from '../tal-ai';

/**
 * 生成故事配图
 */
export async function generateStoryImage(
  prompt: string,
  size: '1024x1024' | '4K' = '1024x1024'
): Promise<string> {
  const response = await callTalAiChat({
    model: 'gemini-3-pro-image',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    modalities: ['text', 'image'],
    extra_body: {
      generationConfig: {
        imageConfig: {
          imageSize: size,
        },
      },
    },
  });

  const result = await response.json();
  // 根据接口返回格式提取图片 URL
  // 假设返回格式中包含图片 URL
  return result.choices[0].message.content[0].image_url.url;
}

/**
 * 图生图：修改背景等
 */
export async function editImage(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const response = await callTalAiChat({
    model: 'gemini-3-pro-image',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    modalities: ['text', 'image'],
  });

  const result = await response.json();
  return result.choices[0].message.content[0].image_url.url;
}

/**
 * 识别图片中的单词
 */
export async function recognizeWordsFromImage(
  imageUrl: string
): Promise<RecognizedWord[]> {
  const response = await callTalAiChat({
    model: 'doubao-seed-1.6-flash',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are an English vocabulary recognition expert. Analyze this image and extract all English words visible in it.

For each word:
1. Extract the English word
2. If there's a Chinese translation/meaning visible, include it
3. Classify the part of speech into one of: noun, verb, adjective, abstract
   - noun: concrete objects, animals, places, people
   - verb: action words
   - adjective: descriptive words (color, size, feeling)
   - abstract: concepts, emotions, time, quantity, function words
4. Rate your confidence (0-1)

Return the result in JSON format: { "words": [ { "word": "...", "meaning": "...", "partOfSpeech": "...", "confidence": 0.9 } ] }`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    extra_body: {
      reasoning: false,
    },
  });

  const result = await response.json();
  // Note: Depending on the model's output, we might need to parse the JSON from the text content
  const content = result.choices[0].message.content;
  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    return parsed.words;
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse recognized words');
  }
}

/**
 * 识别文本中的单词（用于非图片输入）
 */
export async function recognizeWordsFromText(
  text: string
): Promise<RecognizedWord[]> {
  const response = await callTalAiChat({
    model: 'doubao-seed-1.6-flash',
    messages: [
      {
        role: 'user',
        content: `Extract English vocabulary words from this text. The text may contain both English words and Chinese translations.

For each word:
1. Extract the English word
2. If there's a Chinese translation nearby, include it as meaning
3. Classify: noun (objects/places), verb (actions), adjective (descriptions), abstract (concepts/emotions/function words)
4. Confidence: 1.0 for clearly readable words

Text: ${text}

Return the result in JSON format: { "words": [ { "word": "...", "meaning": "...", "partOfSpeech": "...", "confidence": 1.0 } ] }`,
      },
    ],
  });

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  try {
    if (typeof rawContent === 'string') {
      const parsed = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''));
      return Array.isArray(parsed?.words)
        ? parsed.words
        : Array.isArray(parsed)
          ? parsed
          : [];
    }

    if (Array.isArray(rawContent)) {
      const textParts = rawContent
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item?.text === 'string') return item.text;
          return '';
        })
        .filter(Boolean)
        .join('\n');

      if (textParts) {
        const parsed = JSON.parse(textParts.replace(/```json\n?|\n?```/g, ''));
        return Array.isArray(parsed?.words)
          ? parsed.words
          : Array.isArray(parsed)
            ? parsed
            : [];
      }

      const firstObject = rawContent.find(
        (item) => item && typeof item === 'object'
      ) as { words?: RecognizedWord[] } | undefined;
      return Array.isArray(firstObject?.words) ? firstObject.words : [];
    }

    if (rawContent && typeof rawContent === 'object') {
      const parsed = rawContent as { words?: RecognizedWord[] };
      return Array.isArray(parsed.words) ? parsed.words : [];
    }

    return [];
  } catch (e) {
    console.error('Failed to parse AI response:', rawContent);
    throw new Error('Failed to parse recognized words');
  }
}

/**
 * 为一组单词生成故事
 */
export async function generateStory(
  words: ConfirmedWord[],
  grade: Grade,
  groupIndex: number
): Promise<{
  story: string;
  storyZh: string;
  highlightedWords: Record<string, number[]>;
}> {
  const difficulty = DIFFICULTY_MAP[grade];
  const wordList = words.map((w) => `${w.word} (${w.meaning})`).join(', ');

  const response = await callTalAiChat({
    model: 'doubao-seed-1.6-flash',
    messages: [
      {
        role: 'user',
        content: `You are a children's story writer. Generate a short English story for children learning vocabulary.

## Theme
${STORY_STYLE.theme}: ${STORY_STYLE.description}
Characters: ${STORY_STYLE.characters.join(', ')}

## Words to include
${wordList}

## Requirements
1. Story length: ${difficulty.storyLength.min}-${difficulty.storyLength.max} words
2. Sentence length: ${difficulty.sentenceLength.min}-${difficulty.sentenceLength.max} words per sentence
3. ALL words must appear in the story naturally
4. Each target word should appear at least once, highlighted in context
5. The story should be engaging and age-appropriate for grade ${grade}
6. Do NOT use any existing IP characters (Disney, Marvel, etc.)
7. Chinese hint ratio: ${Math.round(difficulty.chineseHintRatio * 100)}% of sentences may have Chinese annotations
8. This is story #${groupIndex + 1} in a series

Return the result in JSON format:
{
  "story": "...",
  "storyZh": "...",
  "highlightedWords": { "word": [0, 2] }
}`,
      },
    ],
  });

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  try {
    if (typeof rawContent === 'string') {
      return JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''));
    }

    if (Array.isArray(rawContent)) {
      const textParts = rawContent
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item?.text === 'string') return item.text;
          return '';
        })
        .filter(Boolean)
        .join('\n');

      if (textParts) {
        return JSON.parse(textParts.replace(/```json\n?|\n?```/g, ''));
      }

      const firstObject = rawContent.find(
        (item) => item && typeof item === 'object'
      );
      if (firstObject) {
        return firstObject;
      }
    }

    if (rawContent && typeof rawContent === 'object') {
      return rawContent;
    }

    throw new Error('Unsupported story response format');
  } catch (e) {
    console.error('Failed to parse story response:', rawContent);
    throw new Error('Failed to generate story');
  }
}

/**
 * 为一组单词生成闯关卡
 */
export async function generateChallengeCards(
  words: ConfirmedWord[],
  story: string,
  grade: Grade
): Promise<
  Array<{
    cardType: CardType;
    subType: CardSubType;
    targetWord: string;
    content: ChallengeCardContent;
  }>
> {
  const difficulty = DIFFICULTY_MAP[grade];

  // 根据词性分配卡片类型
  const cardAssignments = words.map((word) => {
    const mapping =
      POS_TO_CARD_TYPE[word.partOfSpeech as keyof typeof POS_TO_CARD_TYPE] ||
      POS_TO_CARD_TYPE.abstract;
    return {
      word,
      ...mapping,
    };
  });

  // 确保满足最低要求: ≥2 朗读, ≥1 选择题
  const readingCount = cardAssignments.filter(
    (c) => c.cardType === CARD_TYPE.READING
  ).length;
  const choiceCount = cardAssignments.filter(
    (c) => c.cardType === CARD_TYPE.CHOICE
  ).length;

  if (readingCount < 2) {
    // 将一些选择题转为朗读
    const toConvert = 2 - readingCount;
    let converted = 0;
    for (const assignment of cardAssignments) {
      if (converted >= toConvert) break;
      if (assignment.cardType === CARD_TYPE.CHOICE) {
        assignment.cardType = CARD_TYPE.READING;
        assignment.subType = CARD_SUB_TYPE.FOLLOW_READING;
        converted++;
      }
    }
  }

  if (choiceCount < 1) {
    // 将最后一个朗读卡转为选择题
    for (let i = cardAssignments.length - 1; i >= 0; i--) {
      if (cardAssignments[i].cardType === CARD_TYPE.READING) {
        cardAssignments[i].cardType = CARD_TYPE.CHOICE;
        cardAssignments[i].subType = CARD_SUB_TYPE.IMAGE_CHOICE;
        break;
      }
    }
  }

  // 用 AI 为每张卡 generate 内容
  const response = await callTalAiChat({
    model: 'doubao-seed-1.6-flash',
    messages: [
      {
        role: 'user',
        content: `Generate challenge cards for children's English learning.

## Story context
${story}

## Cards to generate
${cardAssignments
  .map(
    (c, i) =>
      `Card ${i + 1}: Word "${c.word.word}" (${c.word.meaning}), Type: ${c.cardType}, SubType: ${c.subType}`
  )
  .join('\n')}

## Difficulty settings
- Grade: ${grade}
- Reading target: ${difficulty.readingTarget} (word/phrase/sentence)
- Chinese hint ratio: ${Math.round(difficulty.chineseHintRatio * 100)}%

## Card type instructions
- image_choice: Create a question about identifying the word's meaning, with 4 options (1 correct, 3 distractors)
- action_reading: Create a sentence from the story for the child to read aloud, focusing on the action verb
- expression_replace: Create a question asking the child to find a synonym or replacement expression, with 4 options
- follow_reading: Create a sentence/phrase for the child to read aloud, with phonetic hints

## Requirements
1. Each card must reference the story context
2. Instructions should be clear and encouraging
3. For reading cards: provide keywords that must be spoken (for ${difficulty.readingTarget} level)
4. For choice cards: provide exactly 4 options with exactly 1 correct answer
5. Provide Chinese translations for instructions
6. Reading difficulty should match grade ${grade}

Return the result in JSON format:
{
  "cards": [
    {
      "targetWord": "...",
      "instruction": "...",
      "instructionZh": "...",
      "readingText": "...",
      "readingHint": "...",
      "keywords": ["..."],
      "question": "...",
      "questionZh": "...",
      "options": [
        { "text": "...", "textZh": "...", "isCorrect": true }
      ],
      "storyContext": "..."
    }
  ]
}`,
      },
    ],
  });

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  type GeneratedCard = {
    instruction?: string;
    instructionZh?: string;
    readingText?: string;
    readingHint?: string;
    keywords?: string[];
    question?: string;
    questionZh?: string;
    options?: Array<{ text: string; textZh?: string; isCorrect?: boolean }>;
    storyContext?: string;
  };
  let generatedCards: GeneratedCard[] = [];
  try {
    if (typeof rawContent === 'string') {
      const parsed = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, ''));
      generatedCards = Array.isArray(parsed?.cards)
        ? parsed.cards
        : Array.isArray(parsed)
          ? parsed
          : [];
    } else if (Array.isArray(rawContent)) {
      const textParts = rawContent
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item?.text === 'string') return item.text;
          return '';
        })
        .filter(Boolean)
        .join('\n');

      if (textParts) {
        const parsed = JSON.parse(textParts.replace(/```json\n?|\n?```/g, ''));
        generatedCards = Array.isArray(parsed?.cards)
          ? parsed.cards
          : Array.isArray(parsed)
            ? parsed
            : [];
      } else {
        const firstObject = rawContent.find(
          (item) => item && typeof item === 'object'
        ) as { cards?: GeneratedCard[] } | undefined;
        generatedCards = Array.isArray(firstObject?.cards)
          ? firstObject.cards
          : [];
      }
    } else if (rawContent && typeof rawContent === 'object') {
      const parsed = rawContent as { cards?: GeneratedCard[] };
      generatedCards = Array.isArray(parsed.cards) ? parsed.cards : [];
    }
  } catch (e) {
    // 兜底：即使 AI 返回结构异常，也继续用默认内容生成卡片，避免整批任务失败
    console.error('Failed to parse cards response:', rawContent);
  }

  return cardAssignments.map((assignment, index) => ({
    cardType: assignment.cardType,
    subType: assignment.subType,
    targetWord: assignment.word.word,
    content: {
      instruction:
        generatedCards[index]?.instruction || `Learn: ${assignment.word.word}`,
      instructionZh: generatedCards[index]?.instructionZh,
      readingText: generatedCards[index]?.readingText,
      readingHint: generatedCards[index]?.readingHint,
      keywords: generatedCards[index]?.keywords,
      question: generatedCards[index]?.question,
      questionZh: generatedCards[index]?.questionZh,
      options: generatedCards[index]?.options,
      correctOptionIndex: generatedCards[index]?.options?.findIndex(
        (o) => o.isCorrect
      ),
      storyContext: generatedCards[index]?.storyContext,
    },
  }));
}

/**
 * 自动分组单词（每组 5-6 个）
 */
export function groupWords(
  words: ConfirmedWord[]
): Array<{ groupIndex: number; words: ConfirmedWord[] }> {
  const groups: Array<{ groupIndex: number; words: ConfirmedWord[] }> = [];
  const totalWords = words.length;

  if (totalWords <= 6) {
    groups.push({ groupIndex: 0, words: [...words] });
    return groups;
  }

  // 优先每组 5 个词
  const numGroups = Math.ceil(totalWords / 5);
  let wordIndex = 0;

  for (let i = 0; i < numGroups; i++) {
    const remaining = totalWords - wordIndex;
    const remainingGroups = numGroups - i;
    const groupSize = Math.min(
      6,
      Math.max(5, Math.ceil(remaining / remainingGroups))
    );
    const groupWords = words.slice(wordIndex, wordIndex + groupSize);
    groups.push({ groupIndex: i, words: groupWords });
    wordIndex += groupSize;
  }

  return groups;
}
