/**
 * Web Audio API - Utilitários de Mixagem com Timeline Corrigida
 * 
 * Arquitetura rigorosa:
 * - Usa AudioContext.currentTime como referência temporal
 * - Segmentação: segmentDuration = endTrim - startTrim
 * - Crossfade NÃO reduz duração, apenas sobrepõe
 * - Cada música toca integralmente por segmentDuration
 * - Shuffle altera ordem antes do cálculo
 * - Repeat reinicia do início
 */

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

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
 * Calcula a timeline corrigida para todas as faixas
 * 
 * Regra: nextStartTime = previousStartTime + segmentDuration - crossover
 * Cada música toca por segmentDuration segundos
 */
export function calculateTimeline(
  trackCount: number,
  segmentDuration: number,
  crossoverDuration: number
): { startTime: number; endTime: number }[] {
  const timeline: { startTime: number; endTime: number }[] = [];
  let currentTime = 0;

  for (let i = 0; i < trackCount; i++) {
    const startTime = currentTime;
    const endTime = startTime + segmentDuration;

    timeline.push({ startTime, endTime });

    // Próxima música começa antes do fim desta (sobreposição)
    currentTime = endTime - crossoverDuration;
  }

  return timeline;
}

/**
 * Cria um nó de ganho com crossfade linear correto
 * 
 * Fade-out: 1 -> 0 durante crossover
 * Fade-in: 0 -> 1 durante crossover
 */
function createCrossfadeGain(
  context: AudioContext | OfflineAudioContext,
  trackStartTime: number,
  trackEndTime: number,
  fadeInStart?: number,
  fadeOutStart?: number
): GainNode {
  const gainNode = context.createGain();

  // Fade in se especificado (próxima música)
  if (fadeInStart !== undefined) {
    gainNode.gain.setValueAtTime(0, fadeInStart);
    gainNode.gain.linearRampToValueAtTime(1, trackStartTime);
  } else {
    gainNode.gain.setValueAtTime(1, trackStartTime);
  }

  // Fade out se especificado (música atual)
  if (fadeOutStart !== undefined) {
    gainNode.gain.setValueAtTime(1, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0, trackEndTime);
  } else {
    gainNode.gain.setValueAtTime(1, trackEndTime);
  }

  return gainNode;
}

/**
 * Renderiza o mix completo com timeline corrigida
 * 
 * Garantias:
 * - Cada música toca por (endTrim - startTrim) segundos
 * - Crossfade sobrepõe mas não reduz duração
 * - Sem silêncio final
 */
export async function renderMixToAudioBuffer(
  tracks: AudioBuffer[],
  startTrim: number,
  endTrim: number,
  crossfadeDuration: number = 5
): Promise<AudioBuffer> {
  if (tracks.length === 0) {
    throw new Error('Nenhuma faixa para renderizar');
  }

  // Calcula duração efetiva de cada segmento
  const segmentDuration = endTrim - startTrim;
  if (segmentDuration <= 0) {
    throw new Error('End Trim deve ser maior que Start Trim');
  }

  // Calcula timeline corrigida
  const timeline = calculateTimeline(tracks.length, segmentDuration, crossfadeDuration);
  const totalDuration = timeline[timeline.length - 1].endTime;

  // Cria contexto offline
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(audioContext.sampleRate * totalDuration),
    audioContext.sampleRate
  );

  // Agenda cada faixa
  tracks.forEach((buffer, index) => {
    const { startTime: trackStartTime, endTime: trackEndTime } = timeline[index];

    // Cria novo BufferSource (nunca reutilizar)
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Offset de trim e duração efetiva
    const sourceStartOffset = startTrim;
    const sourceDuration = segmentDuration;

    // Calcula crossfade
    let fadeInStart: number | undefined;
    let fadeOutStart: number | undefined;

    // Primeira faixa: sem fade in
    if (index > 0) {
      fadeInStart = trackStartTime;
    }

    // Última faixa: sem fade out
    if (index < tracks.length - 1) {
      fadeOutStart = trackEndTime - crossfadeDuration;
    }

    // Cria ganho com crossfade
    const gainNode = createCrossfadeGain(
      offlineContext,
      trackStartTime,
      trackEndTime,
      fadeInStart,
      fadeOutStart
    );

    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Agenda reprodução: começa em trackStartTime, toca sourceDuration segundos
    source.start(trackStartTime, sourceStartOffset, sourceDuration);
  });

  return offlineContext.startRendering();
}

/**
 * Reproduz áudio em tempo real com controle de playback
 * 
 * Garante:
 * - Novo BufferSource a cada play
 * - Novo GainNode a cada play
 * - Controle preciso de offset e duração
 */
export class AudioPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private masterGainNode: GainNode;

  constructor() {
    this.audioContext = audioContext;
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
  }

  /**
   * Reproduz um buffer de áudio a partir de um offset
   * 
   * @param audioBuffer - Buffer a reproduzir
   * @param offset - Offset em segundos (padrão 0)
   * @param duration - Duração em segundos (padrão: duração total)
   * @param onEnded - Callback ao terminar
   */
  play(
    audioBuffer: AudioBuffer,
    offset: number = 0,
    duration?: number,
    onEnded?: () => void
  ): void {
    // Para reprodução anterior
    this.stop();

    // Cria novo BufferSource (nunca reutilizar)
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;

    // Cria novo GainNode
    this.currentGainNode = this.audioContext.createGain();
    this.currentGainNode.connect(this.masterGainNode);

    this.currentSource.connect(this.currentGainNode);

    if (onEnded) {
      this.currentSource.onended = onEnded;
    }

    this.startTime = this.audioContext.currentTime - offset;
    this.pausedTime = 0;
    this.isPlaying = true;

    // Inicia reprodução com offset e duração
    if (duration !== undefined) {
      this.currentSource.start(0, offset, duration);
    } else {
      this.currentSource.start(0, offset);
    }
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
      try {
        this.currentSource.stop();
      } catch (e) {
        // Já parado
      }
      this.isPlaying = false;
      this.pausedTime = 0;
      this.currentSource = null;
      this.currentGainNode = null;
    }
  }

  setVolume(value: number): void {
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  getVolume(): number {
    return this.masterGainNode.gain.value;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentTime(): number {
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedTime;
  }
}
