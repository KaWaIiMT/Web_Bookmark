"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

// Web Speech API types (not in TypeScript's dom lib by default)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

interface VoiceSearchProps {
  onResult: (text: string) => void;
  className?: string;
}

export function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current = transcript;
        } else {
          interim += transcript;
        }
      }
      const text = finalTranscriptRef.current || interim;
      if (text) onResult(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error);
      setListening(false);
      if (event.error === "not-allowed") {
        toast.error("麦克风权限被拒绝，请在浏览器设置中允许");
      } else if (event.error === "no-speech") {
        // silently stop — user didn't say anything
      } else if (event.error !== "aborted") {
        toast.error("语音识别出错，请重试");
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      finalTranscriptRef.current = "";
      try {
        recognition.start();
        setListening(true);
      } catch {
        // already started — ignore
      }
    }
  }, [listening]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      className={className}
      title={listening ? "点击停止" : "语音搜索"}
    >
      {listening ? (
        <span className="relative flex items-center justify-center">
          <MicOff className="h-4 w-4 text-red-400" />
          <span className="absolute -inset-1 rounded-full border-2 border-red-400/30 animate-ping" />
        </span>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
