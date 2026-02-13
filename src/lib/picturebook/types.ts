/**
 * AI 绘本闯关系统 - 类型定义
 */

// 年级选项
export const GRADES = ['1', '2', '3', '4', '5', '6', 'KET', 'PET'] as const;
export type Grade = (typeof GRADES)[number];

// 任务状态
export const TASK_STATUS = {
  UPLOADED: 'uploaded',
  CONFIRMED: 'confirmed',
  GENERATING: 'generating',
  READY: 'ready',
  COMPLETED: 'completed',
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// 卡片类型
export const CARD_TYPE = {
  READING: 'reading',
  CHOICE: 'choice',
} as const;
export type CardType = (typeof CARD_TYPE)[keyof typeof CARD_TYPE];

// 卡片子类型
export const CARD_SUB_TYPE = {
  IMAGE_CHOICE: 'image_choice', // 名词 → 图片选择
  ACTION_READING: 'action_reading', // 动词 → 动作朗读
  EXPRESSION_REPLACE: 'expression_replace', // 形容词 → 替换表达
  FOLLOW_READING: 'follow_reading', // 抽象词 → 跟读
} as const;
export type CardSubType = (typeof CARD_SUB_TYPE)[keyof typeof CARD_SUB_TYPE];

// 词性
export const PART_OF_SPEECH = {
  NOUN: 'noun',
  VERB: 'verb',
  ADJECTIVE: 'adjective',
  ABSTRACT: 'abstract',
} as const;
export type PartOfSpeech = (typeof PART_OF_SPEECH)[keyof typeof PART_OF_SPEECH];

// 词性到卡片类型的映射
export const POS_TO_CARD_TYPE: Record<
  PartOfSpeech,
  { cardType: CardType; subType: CardSubType }
> = {
  noun: { cardType: 'choice', subType: 'image_choice' },
  verb: { cardType: 'reading', subType: 'action_reading' },
  adjective: { cardType: 'choice', subType: 'expression_replace' },
  abstract: { cardType: 'reading', subType: 'follow_reading' },
};

// 难度配置
export type DifficultyConfig = {
  storyLength: { min: number; max: number }; // 故事字数范围
  sentenceLength: { min: number; max: number }; // 句子字数范围
  readingTarget: 'word' | 'phrase' | 'sentence'; // 朗读目标
  chineseHintRatio: number; // 中文提示比例 (0-1)
  readingCardRatio: number; // 朗读卡比例
  choiceCardRatio: number; // 选择题比例
};

// 闯关结果
export type ChallengeResult = {
  passed: boolean;
  score: number;
  totalCards: number;
  passedCards: number;
  stars: number; // 1-3 stars
};

// 积分消耗常量
export const CREDITS_COST = {
  WORD_RECOGNITION: 2, // 单词识别
  STORY_GENERATION: 5, // 故事生成（每组）
  CARD_GENERATION: 3, // 闯关卡生成（每组）
} as const;
