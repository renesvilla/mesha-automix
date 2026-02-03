/**
 * Utilitários para Web Audio API e processamento de áudio
 * Inclui decodificação, crossfade e conversão para MP3
 */

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

/**
 * Decodifica um arquivo de áudio para AudioBuffer
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Interface para agendamento de reprodução de faixas
 */
export interface ScheduledTrack {
  audioBuffer: AudioBuffer;
  startTime: number;
  endTime: number;
  fadeInStart?: number;
  fadeOutStart?: number;
}

/**
 * Cria um nó de ganho com crossfade linear
 */
function createCrossfadeGain(
  context: AudioContext | OfflineAudioContext,
  startTime: number,
  endTime: number,
  fadeInStart?: number,
  fadeOutStart?: number
): GainNode {
  const gainNode = context.createGain();

  // Fade in se especificado
  if (fadeInStart !== undefined) {
    gainNode.gain.setValueAtTime(0, fadeInStart);
    gainNode.gain.linearRampToValueAtTime(1, startTime);
  } else {
    gainNode.gain.setValueAtTime(1, startTime);
  }

  // Fade out se especificado
  if (fadeOutStart !== undefined) {
    gainNode.gain.setValueAtTime(1, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0, endTime);
  } else {
    gainNode.gain.setValueAtTime(1, endTime);
  }

  return gainNode;
}

/**
 * Reproduz uma sequência de faixas com crossfade automático
 * Usa OfflineAudioContext para renderização rápida
 */
export async function renderMixToAudioBuffer(
  tracks: AudioBuffer[],
  startTrim: number,
  endPoint: number,
  crossfadeDuration: number = 5
): Promise<AudioBuffer> {
  if (tracks.length === 0) {
    throw new Error('Nenhuma faixa para renderizar');
  }

  const trackDuration = endPoint - startTrim;
  const totalDuration = trackDuration * tracks.length - crossfadeDuration * (tracks.length - 1);

  // Cria contexto offline com duração total
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(audioContext.sampleRate * totalDuration),
    audioContext.sampleRate
  );

  let currentScheduleTime = 0;

  tracks.forEach((buffer, index) => {
    const trackStartTime = currentScheduleTime;
    const trackEndTime = trackStartTime + trackDuration;

    // Próxima faixa começa 5 segundos antes do fim desta
    const nextTrackStartTime = trackEndTime - crossfadeDuration;

    // Cria nó de fonte para esta faixa
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Define o ponto de início (trim) e duração
    const sourceStartOffset = startTrim;
    const sourceDuration = trackDuration;

    // Cria ganho com crossfade
    let fadeInStart: number | undefined;
    let fadeOutStart: number | undefined;

    // Primeira faixa: sem fade in
    if (index > 0) {
      fadeInStart = nextTrackStartTime;
    }

    // Última faixa: sem fade out
    if (index < tracks.length - 1) {
      fadeOutStart = trackEndTime - crossfadeDuration;
    }

    const gainNode = createCrossfadeGain(
      offlineContext,
      trackStartTime,
      trackEndTime,
      fadeInStart,
      fadeOutStart
    );

    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Agenda a reprodução
    source.start(trackStartTime, sourceStartOffset, sourceDuration);

    currentScheduleTime = nextTrackStartTime;
  });

  return offlineContext.startRendering();
}

// Funções de conversão movidas para mp3Encoder.ts

/**
 * Reproduz áudio em tempo real com controle de playback
 */
export class AudioPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private gainNode: GainNode;

  constructor() {
    this.audioContext = audioContext;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  play(
    audioBuffer: AudioBuffer,
    offset: number = 0,
    onEnded?: () => void
  ): void {
    if (this.isPlaying) {
      this.stop();
    }

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.gainNode);

    if (onEnded) {
      this.currentSource.onended = onEnded;
    }

    this.startTime = this.audioContext.currentTime - offset;
    this.pausedTime = 0;
    this.isPlaying = true;

    this.currentSource.start(0, offset);
  }

  pause(): void {
    if (this.currentSource && this.isPlaying) {
      this.pausedTime = this.audioContext.currentTime - this.startTime;
      this.currentSource.stop();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (this.currentSource && !this.isPlaying && this.pausedTime > 0 && this.currentSource.buffer) {
      this.play(this.currentSource.buffer, this.pausedTime);
    }
  }

  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.isPlaying = false;
      this.pausedTime = 0;
    }
  }

  setVolume(value: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  getCurrentTime(): number {
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedTime;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
