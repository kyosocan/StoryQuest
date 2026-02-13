/**
 * AI 绘本闯关系统 - 难度配置
 *
 * 由年级控制：故事长度、句子长度、朗读目标、中文提示比例、题型比例
 */

import type { DifficultyConfig, Grade } from './types';

/**
 * 各年级难度配置
 */
export const DIFFICULTY_MAP: Record<Grade, DifficultyConfig> = {
  '1': {
    storyLength: { min: 60, max: 100 },
    sentenceLength: { min: 3, max: 6 },
    readingTarget: 'word',
    chineseHintRatio: 0.8,
    readingCardRatio: 0.6,
    choiceCardRatio: 0.4,
  },
  '2': {
    storyLength: { min: 80, max: 120 },
    sentenceLength: { min: 4, max: 7 },
    readingTarget: 'word',
    chineseHintRatio: 0.7,
    readingCardRatio: 0.5,
    choiceCardRatio: 0.5,
  },
  '3': {
    storyLength: { min: 100, max: 150 },
    sentenceLength: { min: 5, max: 8 },
    readingTarget: 'phrase',
    chineseHintRatio: 0.6,
    readingCardRatio: 0.5,
    choiceCardRatio: 0.5,
  },
  '4': {
    storyLength: { min: 120, max: 180 },
    sentenceLength: { min: 6, max: 10 },
    readingTarget: 'phrase',
    chineseHintRatio: 0.5,
    readingCardRatio: 0.4,
    choiceCardRatio: 0.6,
  },
  '5': {
    storyLength: { min: 150, max: 220 },
    sentenceLength: { min: 7, max: 12 },
    readingTarget: 'sentence',
    chineseHintRatio: 0.3,
    readingCardRatio: 0.4,
    choiceCardRatio: 0.6,
  },
  '6': {
    storyLength: { min: 180, max: 260 },
    sentenceLength: { min: 8, max: 14 },
    readingTarget: 'sentence',
    chineseHintRatio: 0.2,
    readingCardRatio: 0.4,
    choiceCardRatio: 0.6,
  },
  KET: {
    storyLength: { min: 200, max: 300 },
    sentenceLength: { min: 8, max: 15 },
    readingTarget: 'sentence',
    chineseHintRatio: 0.15,
    readingCardRatio: 0.3,
    choiceCardRatio: 0.7,
  },
  PET: {
    storyLength: { min: 250, max: 350 },
    sentenceLength: { min: 10, max: 18 },
    readingTarget: 'sentence',
    chineseHintRatio: 0.1,
    readingCardRatio: 0.3,
    choiceCardRatio: 0.7,
  },
};

/**
 * 分组规则
 */
export const GROUP_CONFIG = {
  MIN_WORDS_PER_GROUP: 5,
  MAX_WORDS_PER_GROUP: 6,
  MIN_READING_CARDS: 2, // 每组至少 2 张朗读卡
  MIN_CHOICE_CARDS: 1, // 每组至少 1 张选择题
};

/**
 * 朗读判定规则
 */
export const READING_JUDGMENT = {
  PASS_THRESHOLD: 0.7, // 命中 ≥70% 关键词通过
  ALLOW_MINOR_ERRORS: true, // 允许轻微错误
  MAX_CONSECUTIVE_FAILS: 3, // 连续失败次数上限，之后提供提示
  DOWNGRADE_AFTER_FAILS: 5, // 连续失败次数上限，之后降级
};

/**
 * 故事风格
 */
export const STORY_STYLE = {
  theme: '城市小动物探险队',
  description:
    'Stories should follow the theme of a group of small city animals on adventures. Characters should be original (no existing IP). The animals discover new things, solve problems, and learn vocabulary naturally through their adventures.',
  characters: [
    'Momo the curious squirrel',
    'Pip the brave sparrow',
    'Luna the clever cat',
    'Dash the energetic rabbit',
    'Bubbles the friendly goldfish',
  ],
};

/**
 * 年级显示名称
 */
export const GRADE_LABELS: Record<string, { en: string; zh: string }> = {
  '1': { en: 'Grade 1', zh: '一年级' },
  '2': { en: 'Grade 2', zh: '二年级' },
  '3': { en: 'Grade 3', zh: '三年级' },
  '4': { en: 'Grade 4', zh: '四年级' },
  '5': { en: 'Grade 5', zh: '五年级' },
  '6': { en: 'Grade 6', zh: '六年级' },
  KET: { en: 'KET', zh: 'KET' },
  PET: { en: 'PET', zh: 'PET' },
};
