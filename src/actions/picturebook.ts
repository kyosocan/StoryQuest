'use server';

import { randomUUID } from 'crypto';
import { consumeCredits, hasEnoughCredits } from '@/credits/credits';
import { getDb } from '@/db';
import {
  challengeAttempt,
  challengeCard,
  user,
  wordStory,
  wordTask,
} from '@/db/schema';
import type {
  ChallengeResponse,
  ConfirmedWord,
  RecognizedWord,
  WordGroup,
} from '@/db/schema';
import { READING_JUDGMENT } from '@/lib/picturebook/config';
import {
  generateChallengeCards,
  generateStory,
  groupWords,
  recognizeWordsFromImage,
  recognizeWordsFromText,
} from '@/lib/picturebook/ai';
import { CREDITS_COST, TASK_STATUS } from '@/lib/picturebook/types';
import type { Grade } from '@/lib/picturebook/types';
import { actionClient } from '@/lib/safe-action';
import { getSession } from '@/lib/server';
import { cookies } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const GUEST_COOKIE_NAME = 'wordquest_guest_id';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

async function getActor() {
  console.log('getActor started');
  let session: Awaited<ReturnType<typeof getSession>> | null = null;
  try {
    session = await getSession();
    console.log('Session result:', session?.user?.id);
  } catch (e) {
    console.warn('getSession failed, continuing as guest:', e);
  }

  if (session?.user?.id) {
    return { userId: session.user.id, isGuest: false };
  }

  let guestId: string;
  try {
    const cookieStore = await cookies();
    guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    console.log('Guest ID from cookie:', guestId);
    if (!guestId) {
      guestId = `guest_${randomUUID()}`;
      console.log('Generated new guestId:', guestId);
      cookieStore.set(GUEST_COOKIE_NAME, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch (e) {
    console.error('Cookie operations failed:', e);
    // Fallback to a temporary ID if cookies fail (though this shouldn't happen on server)
    guestId = `temp_${randomUUID()}`;
  }

  const db = await getDb();
  console.log('Checking for existing guest in DB:', guestId);
  try {
    const existingGuest = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, guestId))
      .limit(1);

    if (!existingGuest[0]) {
      console.log('Creating new guest user in DB');
      const guestEmail = `${guestId}@guest.wordquest.local`;
      await db.insert(user).values({
        id: guestId,
        name: 'Guest User',
        email: guestEmail,
        normalizedEmail: guestEmail,
        emailVerified: false,
        role: 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Guest user created');
    }
  } catch (e) {
    console.error('DB operations for guest failed:', e);
    throw e;
  }

  return { userId: guestId, isGuest: true };
}

// ============================================================
// 创建新任务
// ============================================================
export const createTaskAction = actionClient
  .schema(
    z.object({
      title: z.string().min(1).max(100),
      grade: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    console.log('createTaskAction server side started:', parsedInput);
    let actor: Awaited<ReturnType<typeof getActor>>;
    try {
      actor = await getActor();
      console.log('Actor:', actor);
    } catch (actorError: unknown) {
      console.error('getActor error:', actorError);
      return {
        success: false,
        error: `获取用户身份失败: ${getErrorMessage(actorError)}`,
      };
    }

    let db: Awaited<ReturnType<typeof getDb>>;
    try {
      db = await getDb();
      console.log('DB connection established');
    } catch (dbConnError: unknown) {
      console.error('getDb connection error:', dbConnError);
      return {
        success: false,
        error: `数据库连接失败: ${getErrorMessage(dbConnError)}`,
      };
    }

    const taskId = randomUUID();
    console.log('Inserting into wordTask, taskId:', taskId);
    try {
      await db.insert(wordTask).values({
        id: taskId,
        userId: actor.userId,
        title: parsedInput.title,
        grade: parsedInput.grade,
        status: TASK_STATUS.UPLOADED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Insert successful');
    } catch (dbError: any) {
      console.error('Database insert error:', dbError);
      return {
        success: false,
        error: `保存任务到数据库失败: ${dbError.message || '未知错误'}`,
      };
    }

    return { success: true, taskId };
  });

// ============================================================
// 仅识别图片中的单词（预览，不扣积分、不绑定任务）
// ============================================================
export const recognizeImagePreviewAction = actionClient
  .schema(z.object({ imageUrl: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      const words = await recognizeWordsFromImage(parsedInput.imageUrl);
      return { success: true, words };
    } catch (error) {
      console.error('recognizeImagePreview error:', error);
      return { success: false, error: '图片识别失败，请重试', words: [] };
    }
  });

// ============================================================
// 提交单词文本进行识别
// ============================================================
export const recognizeWordsAction = actionClient
  .schema(
    z
      .object({
        taskId: z.string(),
        wordText: z.string().optional(),
        imageUrl: z.string().optional(),
      })
      .refine(
        (data) =>
          Boolean(data.wordText?.trim()) || Boolean(data.imageUrl?.trim()),
        {
          message: '请提供文本或图片',
        }
      )
  )
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    // 验证任务所有权
    const task = await db
      .select()
      .from(wordTask)
      .where(
        and(
          eq(wordTask.id, parsedInput.taskId),
          eq(wordTask.userId, actor.userId)
        )
      )
      .limit(1);

    if (!task[0]) {
      return { success: false, error: '任务不存在' };
    }

    // 检查积分
    if (!actor.isGuest) {
      const enough = await hasEnoughCredits({
        userId: actor.userId,
        requiredCredits: CREDITS_COST.WORD_RECOGNITION,
      });
      if (!enough) {
        return { success: false, error: '积分不足，请充值' };
      }
    }

    try {
      // 识别单词
      const recognizedWords = parsedInput.imageUrl?.trim()
        ? await recognizeWordsFromImage(parsedInput.imageUrl)
        : await recognizeWordsFromText(parsedInput.wordText?.trim() || '');

      // 消耗积分
      if (!actor.isGuest) {
        await consumeCredits({
          userId: actor.userId,
          amount: CREDITS_COST.WORD_RECOGNITION,
          description: `单词识别: ${recognizedWords.length} 个单词`,
        });
      }

      // 更新任务
      await db
        .update(wordTask)
        .set({
          recognizedWords: recognizedWords as RecognizedWord[],
          updatedAt: new Date(),
        })
        .where(eq(wordTask.id, parsedInput.taskId));

      return { success: true, words: recognizedWords };
    } catch (error) {
      console.error('recognizeWords error:', error);
      return { success: false, error: '单词识别失败，请重试' };
    }
  });

// ============================================================
// 确认单词并分组
// ============================================================
export const confirmWordsAction = actionClient
  .schema(
    z.object({
      taskId: z.string(),
      words: z.array(
        z.object({
          word: z.string(),
          meaning: z.string(),
          partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'abstract']),
        })
      ),
    })
  )
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    const task = await db
      .select()
      .from(wordTask)
      .where(
        and(
          eq(wordTask.id, parsedInput.taskId),
          eq(wordTask.userId, actor.userId)
        )
      )
      .limit(1);

    if (!task[0]) {
      return { success: false, error: '任务不存在' };
    }

    const confirmedWords = parsedInput.words as ConfirmedWord[];
    const wordGroupsList = groupWords(confirmedWords);

    await db
      .update(wordTask)
      .set({
        confirmedWords,
        wordGroups: wordGroupsList as WordGroup[],
        status: TASK_STATUS.CONFIRMED,
        updatedAt: new Date(),
      })
      .where(eq(wordTask.id, parsedInput.taskId));

    return { success: true, groups: wordGroupsList };
  });

// ============================================================
// 更新分组
// ============================================================
export const updateGroupsAction = actionClient
  .schema(
    z.object({
      taskId: z.string(),
      groups: z.array(
        z.object({
          groupIndex: z.number(),
          words: z.array(
            z.object({
              word: z.string(),
              meaning: z.string(),
              partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'abstract']),
            })
          ),
        })
      ),
    })
  )
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    await db
      .update(wordTask)
      .set({
        wordGroups: parsedInput.groups as WordGroup[],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(wordTask.id, parsedInput.taskId),
          eq(wordTask.userId, actor.userId)
        )
      );

    return { success: true };
  });

// ============================================================
// 生成故事和闯关卡
// ============================================================
export const generateContentAction = actionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    const task = await db
      .select()
      .from(wordTask)
      .where(
        and(
          eq(wordTask.id, parsedInput.taskId),
          eq(wordTask.userId, actor.userId)
        )
      )
      .limit(1);

    if (!task[0] || !task[0].wordGroups) {
      return { success: false, error: '任务不存在或未分组' };
    }

    const groups = task[0].wordGroups as WordGroup[];
    const grade = task[0].grade as Grade;

    // 检查积分
    const totalCredits =
      groups.length *
      (CREDITS_COST.STORY_GENERATION + CREDITS_COST.CARD_GENERATION);
    if (!actor.isGuest) {
      const enough = await hasEnoughCredits({
        userId: actor.userId,
        requiredCredits: totalCredits,
      });
      if (!enough) {
        return {
          success: false,
          error: `积分不足，需要 ${totalCredits} 积分`,
        };
      }
    }

    // 更新状态为生成中
    await db
      .update(wordTask)
      .set({ status: TASK_STATUS.GENERATING, updatedAt: new Date() })
      .where(eq(wordTask.id, parsedInput.taskId));

    try {
      for (const group of groups) {
        // 生成故事
        const storyResult = await generateStory(
          group.words,
          grade,
          group.groupIndex
        );

        const storyId = randomUUID();
        await db.insert(wordStory).values({
          id: storyId,
          taskId: parsedInput.taskId,
          groupIndex: group.groupIndex,
          words: group.words.map((w) => w.word),
          storyContent: storyResult.story,
          storyContentZh: storyResult.storyZh,
          highlightedWords: storyResult.highlightedWords,
          createdAt: new Date(),
        });

        // 消耗故事生成积分
        if (!actor.isGuest) {
          await consumeCredits({
            userId: actor.userId,
            amount: CREDITS_COST.STORY_GENERATION,
            description: `故事生成: 组${group.groupIndex + 1}`,
          });
        }

        // 生成闯关卡
        const cards = await generateChallengeCards(
          group.words,
          storyResult.story,
          grade
        );

        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          await db.insert(challengeCard).values({
            id: randomUUID(),
            storyId,
            taskId: parsedInput.taskId,
            groupIndex: group.groupIndex,
            cardIndex: i,
            cardType: card.cardType,
            subType: card.subType,
            targetWord: card.targetWord,
            content: card.content,
            createdAt: new Date(),
          });
        }

        // 消耗闯关卡生成积分
        if (!actor.isGuest) {
          await consumeCredits({
            userId: actor.userId,
            amount: CREDITS_COST.CARD_GENERATION,
            description: `闯关卡生成: 组${group.groupIndex + 1}`,
          });
        }
      }

      // 更新状态为就绪
      await db
        .update(wordTask)
        .set({
          status: TASK_STATUS.READY,
          creditsUsed: totalCredits,
          updatedAt: new Date(),
        })
        .where(eq(wordTask.id, parsedInput.taskId));

      return { success: true };
    } catch (error) {
      console.error('generateContent error:', error);
      // 回滚状态
      await db
        .update(wordTask)
        .set({ status: TASK_STATUS.CONFIRMED, updatedAt: new Date() })
        .where(eq(wordTask.id, parsedInput.taskId));
      return { success: false, error: '生成失败，请重试' };
    }
  });

// ============================================================
// 获取任务列表
// ============================================================
export const getTasksAction = actionClient
  .schema(z.object({}))
  .action(async () => {
    const actor = await getActor();
    const db = await getDb();

    const tasks = await db
      .select()
      .from(wordTask)
      .where(eq(wordTask.userId, actor.userId))
      .orderBy(desc(wordTask.createdAt));

    return { success: true, tasks };
  });

// ============================================================
// 获取任务详情（含故事和闯关卡）
// ============================================================
export const getTaskDetailAction = actionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    const task = await db
      .select()
      .from(wordTask)
      .where(
        and(
          eq(wordTask.id, parsedInput.taskId),
          eq(wordTask.userId, actor.userId)
        )
      )
      .limit(1);

    if (!task[0]) {
      return { success: false, error: '任务不存在' };
    }

    const stories = await db
      .select()
      .from(wordStory)
      .where(eq(wordStory.taskId, parsedInput.taskId))
      .orderBy(wordStory.groupIndex);

    const cards = await db
      .select()
      .from(challengeCard)
      .where(eq(challengeCard.taskId, parsedInput.taskId))
      .orderBy(challengeCard.groupIndex, challengeCard.cardIndex);

    const attempts = await db
      .select()
      .from(challengeAttempt)
      .where(
        and(
          eq(challengeAttempt.taskId, parsedInput.taskId),
          eq(challengeAttempt.userId, actor.userId)
        )
      );

    return { success: true, task: task[0], stories, cards, attempts };
  });

// ============================================================
// 提交闯关答案
// ============================================================
export const submitChallengeAction = actionClient
  .schema(
    z.object({
      cardId: z.string(),
      taskId: z.string(),
      response: z.object({
        type: z.enum(['reading', 'choice']),
        spokenText: z.string().optional(),
        matchedKeywords: z.array(z.string()).optional(),
        matchPercentage: z.number().optional(),
        selectedOptionIndex: z.number().optional(),
      }),
    })
  )
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    // 获取卡片信息
    const card = await db
      .select()
      .from(challengeCard)
      .where(eq(challengeCard.id, parsedInput.cardId))
      .limit(1);

    if (!card[0]) {
      return { success: false, error: '卡片不存在' };
    }

    const cardContent = card[0].content;
    let passed = false;
    let score = 0;

    if (parsedInput.response.type === 'reading') {
      // 朗读判定
      const matchPercentage = parsedInput.response.matchPercentage || 0;
      passed = matchPercentage >= READING_JUDGMENT.PASS_THRESHOLD;
      score = Math.round(matchPercentage * 100);
    } else if (parsedInput.response.type === 'choice') {
      // 选择题判定
      passed =
        parsedInput.response.selectedOptionIndex ===
        cardContent.correctOptionIndex;
      score = passed ? 100 : 0;
    }

    // 计算尝试次数
    const prevAttempts = await db
      .select()
      .from(challengeAttempt)
      .where(
        and(
          eq(challengeAttempt.cardId, parsedInput.cardId),
          eq(challengeAttempt.userId, actor.userId)
        )
      );

    const attemptNumber = prevAttempts.length + 1;

    // 保存闯关记录
    await db.insert(challengeAttempt).values({
      id: randomUUID(),
      cardId: parsedInput.cardId,
      taskId: parsedInput.taskId,
      userId: actor.userId,
      passed,
      score,
      response: parsedInput.response as ChallengeResponse,
      attemptNumber,
      createdAt: new Date(),
    });

    // 检查是否需要提供提示
    const consecutiveFails = prevAttempts.filter((a) => !a.passed).length;
    let hint: string | undefined;
    let shouldDowngrade = false;

    if (consecutiveFails >= READING_JUDGMENT.MAX_CONSECUTIVE_FAILS && !passed) {
      hint = cardContent.readingHint || cardContent.instructionZh;
    }
    if (consecutiveFails >= READING_JUDGMENT.DOWNGRADE_AFTER_FAILS && !passed) {
      shouldDowngrade = true;
    }

    return {
      success: true,
      passed,
      score,
      attemptNumber,
      hint,
      shouldDowngrade,
    };
  });

// ============================================================
// 获取组的闯关进度
// ============================================================
export const getGroupProgressAction = actionClient
  .schema(
    z.object({
      taskId: z.string(),
      groupIndex: z.number(),
    })
  )
  .action(async ({ parsedInput }) => {
    const actor = await getActor();
    const db = await getDb();

    const cards = await db
      .select()
      .from(challengeCard)
      .where(
        and(
          eq(challengeCard.taskId, parsedInput.taskId),
          eq(challengeCard.groupIndex, parsedInput.groupIndex)
        )
      )
      .orderBy(challengeCard.cardIndex);

    const attempts = await db
      .select()
      .from(challengeAttempt)
      .where(
        and(
          eq(challengeAttempt.taskId, parsedInput.taskId),
          eq(challengeAttempt.userId, actor.userId)
        )
      );

    const cardProgress = cards.map((card) => {
      const cardAttempts = attempts.filter((a) => a.cardId === card.id);
      const bestAttempt = cardAttempts.reduce(
        (best, curr) => ((curr.score ?? 0) > (best?.score || 0) ? curr : best),
        null as (typeof attempts)[0] | null
      );

      return {
        card,
        totalAttempts: cardAttempts.length,
        passed: cardAttempts.some((a) => a.passed),
        bestScore: bestAttempt?.score || 0,
      };
    });

    const totalCards = cards.length;
    const passedCards = cardProgress.filter((p) => p.passed).length;
    const allPassed = passedCards === totalCards;

    return {
      success: true,
      cardProgress,
      totalCards,
      passedCards,
      allPassed,
    };
  });
