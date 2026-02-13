'use server';

import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { callVoiceEval } from '@/lib/voice-eval';

export const evaluateVoiceAction = actionClient
  .schema(
    z.object({
      audioBase64: z.string(),
      text: z.string(),
      coreType: z
        .enum(['en.word.score', 'en.snt.score', 'en.pred.score'])
        .optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const result = await callVoiceEval({
        audioBase64: parsedInput.audioBase64,
        text: parsedInput.text,
        coreType: parsedInput.coreType || 'en.snt.score',
      });

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Voice evaluation failed:', error);
      return { success: false, error: error.message || '语音评测失败' };
    }
  });
