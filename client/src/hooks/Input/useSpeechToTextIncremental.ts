import { useRef, useCallback } from 'react';
import useSpeechToTextBrowser from './useSpeechToTextBrowser';
import useSpeechToTextExternal from './useSpeechToTextExternal';
import useGetAudioSettings from './useGetAudioSettings';

export const useSpeechToTextIncremental = (
  append: (chunk: string) => void,
  replaceSession: (session: string) => void,
  onFinish: (final: string) => void,
) => {
  const { speechToTextEndpoint } = useGetAudioSettings();
  const useExternal = speechToTextEndpoint === 'external';

  const interimRef = useRef('');

  const handleInterim = useCallback(
    (cur: string) => {
      const prev = interimRef.current;
      if (cur.length < prev.length || !cur.startsWith(prev)) {
        replaceSession(cur); // correction
      } else if (cur !== prev) {
        append(cur.slice(prev.length)); // incremental
      }
      interimRef.current = cur;
    },
    [append, replaceSession],
  );

  const handleFinal = useCallback(
    (finalTxt: string) => {
      interimRef.current = '';
      onFinish(finalTxt);
    },
    [onFinish],
  );

  const browser = useSpeechToTextBrowser(handleInterim, handleFinal);
  const external = useSpeechToTextExternal(handleInterim, handleFinal);

  const startFn = useExternal ? external.externalStartRecording : browser.startRecording;
  const stopFn = useExternal ? external.externalStopRecording : browser.stopRecording;
  const isListening = useExternal ? external.isListening : browser.isListening;
  const isLoading = useExternal ? external.isLoading : browser.isLoading;

  const start = useCallback(() => {
    interimRef.current = '';
    startFn?.();
  }, [startFn]);

  return {
    isListening,
    isLoading,
    startRecording: start,
    stopRecording: stopFn,
  };
};

export default useSpeechToTextIncremental;
