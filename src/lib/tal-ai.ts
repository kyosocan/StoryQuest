import { z } from 'zod';

export const talAiChatSchema = z.object({
  model: z.string().default('doubao-seed-1.6-flash'),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.union([
        z.string(),
        z.array(
          z.object({
            type: z.enum(['text', 'image_url']),
            text: z.string().optional(),
            image_url: z.object({ url: z.string() }).optional(),
          })
        ),
      ]),
    })
  ),
  stream: z.boolean().default(false),
  stream_options: z
    .object({
      include_usage: z.boolean().default(true),
    })
    .optional(),
  modalities: z.array(z.string()).optional(),
  extra_body: z.any().optional(),
});

export type TalAiChatRequest = z.infer<typeof talAiChatSchema>;

export async function callTalAiChat(payload: TalAiChatRequest) {
  const appId = process.env.TAL_MLOPS_APP_ID;
  const appKey = process.env.TAL_MLOPS_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('TAL_MLOPS_APP_ID or TAL_MLOPS_APP_KEY is not set');
  }

  const response = await fetch(
    'http://ai-service.tal.com/openai-compatible/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'api-key': `${appId}:${appKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TAL AI API error: ${response.status} ${error}`);
  }

  return response;
}
