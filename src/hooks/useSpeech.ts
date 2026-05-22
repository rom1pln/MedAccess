import { useState, useCallback, useEffect, useRef } from 'react';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStartedRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev === true) {
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isStartedRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition', e);
      }
      isStartedRef.current = false;
      setIsListening(false);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          
          // Reset silence timer every time we get a final result
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
          }, 2000); // Wait 2 seconds of silence before stopping
        }
      };

      recognitionRef.current.onstart = () => {
        isStartedRef.current = true;
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        isStartedRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('L\'accès au microphone a été refusé. Veuillez vérifier les paramètres de votre navigateur.');
        }
        isStartedRef.current = false;
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [stopListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      if (isStartedRef.current) {
        stopListening();
        return;
      }
      
      stopSpeaking();
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition', e);
        // If it was already started but the ref was out of sync, try to stop and restart
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      }
    } else {
      alert('La reconnaissance vocale n\'est pas supportée par ce navigateur.');
    }
  }, [stopSpeaking, stopListening]);

  const speak = useCallback((text: string) => {
    if (isMuted) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, stopSpeaking]);

  return { isListening, transcript, startListening, stopListening, speak, stopSpeaking, isMuted, toggleMute };
}
