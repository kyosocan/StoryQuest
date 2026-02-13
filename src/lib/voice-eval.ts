import { z } from 'zod';

export const voiceEvalSchema = z.object({
  audioBase64: z.string(),
  text: z.string(),
  coreType: z
    .enum(['en.word.score', 'en.snt.score', 'en.pred.score'])
    .default('en.snt.score'),
});

export type VoiceEvalRequest = z.infer<typeof voiceEvalSchema>;

export async function callVoiceEval(payload: VoiceEvalRequest) {
  const appId = process.env.TAL_MLOPS_APP_ID;
  const appKey = process.env.TAL_MLOPS_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('TAL_MLOPS_APP_ID or TAL_MLOPS_APP_KEY is not set');
  }

  // 注意：实际生产中可能需要根据文档调整接口地址和参数
  // 这里根据提供的 Go 代码参考，假设有一个类似的 REST 接口或通过 AI Service 转发
  // 暂时使用通用的 AI Service 结构，或者如果 TAL 有专门的语音评测接口则替换
  const response = await fetch(
    'http://ai-service.tal.com/openai-compatible/v1/audio/evaluations',
    {
      method: 'POST',
      headers: {
        'api-key': `${appId}:${appKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'px-1.0',
        audio: payload.audioBase64,
        text: payload.text,
        extra_body: {
          coreType: payload.coreType,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voice Eval API error: ${response.status} ${error}`);
  }

  return response.json();
}
