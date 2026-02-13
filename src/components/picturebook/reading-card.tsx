'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { ChallengeCardContent } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { READING_JUDGMENT } from '@/lib/picturebook/config';
import { MicIcon, MicOffIcon, Loader2Icon, Volume2Icon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { evaluateVoiceAction } from '@/actions/voice-eval';
import { toast } from 'sonner';

interface ReadingCardProps {
  content: ChallengeCardContent;
  onSubmit: (result: {
    spokenText: string;
    matchedKeywords: string[];
    matchPercentage: number;
  }) => void;
  disabled: boolean;
}

export function ReadingCard({ content, onSubmit, disabled }: ReadingCardProps) {
  const t = useTranslations('Picturebook');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const evaluateVoice = useAction(evaluateVoiceAction);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleVoiceEval(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
    } catch (err) {
      console.error('Failed to start recording', err);
      toast.error('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleVoiceEval = async (base64Audio: string) => {
    setIsProcessing(true);
    const result = await evaluateVoice.executeAsync({
      audioBase64: base64Audio,
      text: content.readingText || '',
    });

    setIsProcessing(false);
    if (result?.data?.success) {
      const evalData = result.data.data;
      // 假设返回的数据结构中有识别的文本和得分
      const spokenText = evalData.data?.text || '';
      const totalScore = evalData.data?.totalScore || 0;

      setTranscript(spokenText);

      // 简单地将总分转换为匹配百分比
      const matchPercentage = totalScore / 100;

      onSubmit({
        spokenText,
        matchedKeywords: content.keywords || [], // 实际中可以根据 evalData.words 进一步细化
        matchPercentage,
      });
    } else {
      toast.error(result?.data?.error || '语音评测失败');
    }
  };

  const handleSubmit = () => {
    // 如果已经有了识别结果，直接提交
    if (transcript) {
      // 这里的逻辑可以根据需要调整，目前 handleVoiceEval 已经调用了 onSubmit
    }
  };

  // 播放参考音频 (使用 TTS)
  const playReference = () => {
    if ('speechSynthesis' in window && content.readingText) {
      const utterance = new SpeechSynthesisUtterance(content.readingText);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-4">
      {/* 朗读目标 */}
      <div className="rounded-xl bg-linear-to-r from-blue-500/10 to-purple-500/10 p-6 text-center">
        <p className="text-xl font-bold md:text-2xl">{content.readingText}</p>
        {content.readingHint && (
          <p className="text-muted-foreground mt-2 text-sm">
            {content.readingHint}
          </p>
        )}
      </div>

      {/* 播放参考音频 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={playReference}
          className="gap-2"
        >
          <Volume2Icon className="size-4" />
          {t('challenge.listenFirst')}
        </Button>
      </div>

      {/* 录音区域 */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          variant={isRecording ? 'destructive' : 'default'}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className="size-16 rounded-full"
        >
          {isRecording ? (
            <MicOffIcon className="size-6" />
          ) : (
            <MicIcon className="size-6" />
          )}
        </Button>
        <p className="text-muted-foreground text-sm">
          {isRecording ? t('challenge.recording') : t('challenge.tapToRecord')}
        </p>
      </div>

      {/* 识别结果 */}
      {transcript && (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs">
            {t('challenge.yourSpeech')}
          </p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}

      {/* 提交 */}
      {transcript && !isRecording && !isProcessing && (
        <Button
          onClick={() => {}} // 已经在 handleVoiceEval 中提交
          disabled={true}
          className="w-full"
        >
          {t('challenge.submit')}
        </Button>
      )}
    </div>
  );
}
