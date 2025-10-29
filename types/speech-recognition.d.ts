// Global type declarations for Web Speech API (SpeechRecognition)

declare global {
  interface SpeechRecognition {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives?: number
    start: () => void
    stop: () => void
    requestData?: () => void
    onstart: (() => void) | null
    onresult: ((event: any) => void) | null
    onerror: ((event: any) => void) | null
    onend: (() => void) | null
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export {}


