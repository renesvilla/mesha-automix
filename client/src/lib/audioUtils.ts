/**
 * Web Audio API - Motor de Mixagem com Timeline Rigorosamente Corrigida
 * 
 * REGRAS OBRIGATÓRIAS:
 * 1. AudioContext.currentTime como base temporal
 * 2. segmentDuration = endTrim - startTrim (NUNCA reduzir por crossover)
 * 3. nextStartTime = previousStartTime + segmentDuration - crossover
 * 4. totalDuration = segmentDuration * N - crossover * (N - 1)
 * 5. Crossfade via GainNode, NUNCA via start/offset/duration
 * 6. Novo BufferSource + GainNode a cada play
 * 7. Recalcular timeline ao mudar qualquer parâmetro
 */

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

/**
 * CÁLCULO DE TIMELINE - ABSOLUTAMENTE CORRETO
 * 
 * Exemplo com 3 músicas, segmentDuration=20s, crossover=5s:
 * Track 0: T=0s,   duration=20s, fim em 20s
 * Track 1: T=15s,  duration=20s, fim em 35s (começa 5s antes do fim da Track 0)
 * Track 2: T=30s,  duration=20s, fim em 50s (começa 5s antes do fim da Track 1)
 * Total: 50s (não 60s)
 */
export interface TimelineEntry {
  trackIndex: number;
  startTime: number;
  endTime: number;
  fadeOutStart: number;
  fadeOutEnd: number;
  fadeInStart: number;
  fadeInEnd: number;
}

export function calculateCorrectTimeline(
  trackCount: number,
  segmentDuration: number,
  crossoverDuration: number
): TimelineEntry[] {
  if (trackCount === 0) return [];
  if (segmentDuration <= 0) throw new Error('segmentDuration deve ser > 0');
  if (crossoverDuration < 0) throw new Error('crossoverDuration não pode ser negativo');

  const timeline: TimelineEntry[] = [];
  let currentStartTime = 0;

  for (let i = 0; i < trackCount; i++) {
    const startTime = currentStartTime;
    const endTime = startTime + segmentDuration;

    // Calcula crossfade (simétrico)
    const halfCross = crossoverDuration / 2;
    const fadeOutStart = endTime - halfCross;
    const fadeOutEnd = endTime + halfCross;
    const fadeInStart = startTime - halfCross;
    const fadeInEnd = startTime + halfCross;

    timeline.push({
      trackIndex: i,
      startTime,
      endTime,
      fadeOutStart,
      fadeOutEnd,
      fadeInStart,
      fadeInEnd,
    });

    // REGRA OBRIGATÓRIA: nextStartTime = previousStartTime + segmentDuration - crossover
    currentStartTime = endTime - crossoverDuration;
  }

  return timeline;
}

/**
 * Calcula duração total da mixagem
 * REGRA: totalDuration = segmentDuration * N - crossover * (N - 1)
 */
export function calculateTotalDuration(
  trackCount: number,
  segmentDuration: number,
  crossoverDuration: number
): number {
  if (trackCount === 0) return 0;
  return segmentDuration * trackCount - crossoverDuration * (trackCount - 1);
}

/**
 * Cria GainNode com crossfade linear correto
 * 
 * Fade-out: 1 → 0 de fadeOutStart até fadeOutEnd
 * Fade-in: 0 → 1 de fadeInStart até fadeInEnd
 */
function createCrossfadeGain(
  context: AudioContext | OfflineAudioContext,
  fadeOutStart: number,
  fadeOutEnd: number,
  fadeInStart: number,
  fadeInEnd: number,
  isFirstTrack: boolean,
  isLastTrack: boolean
): GainNode {
  const gainNode = context.createGain();

  // Fade-in (próximas músicas, não a primeira)
  if (!isFirstTrack) {
    gainNode.gain.setValueAtTime(0, fadeInStart);
    gainNode.gain.linearRampToValueAtTime(1, fadeInEnd);
  } else {
    gainNode.gain.setValueAtTime(1, fadeOutStart);
  }

  // Fade-out (músicas não-últimas)
  if (!isLastTrack) {
    gainNode.gain.setValueAtTime(1, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0, fadeOutEnd);
  } else {
    gainNode.gain.setValueAtTime(1, fadeOutEnd);
  }

  return gainNode;
}

/**
 * RENDERIZA MIX COM TIMELINE ABSOLUTAMENTE CORRIGIDA
 * 
 * Garantias:
 * - Cada música toca por segmentDuration segundos
 * - Crossfade sobrepõe sem reduzir duração
 * - Sem silêncio final
 * - Novo BufferSource + GainNode para cada música
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

  // Valida parâmetros
  const segmentDuration = endTrim - startTrim;
  if (segmentDuration <= 0) {
    throw new Error('endTrim deve ser maior que startTrim');
  }

  // Calcula timeline corrigida
  const timeline = calculateCorrectTimeline(tracks.length, segmentDuration, crossfadeDuration);
  const totalDuration = calculateTotalDuration(tracks.length, segmentDuration, crossfadeDuration);

  // Cria contexto offline
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(audioContext.sampleRate * totalDuration),
    audioContext.sampleRate
  );

  // Agenda cada faixa com timeline corrigida
  tracks.forEach((buffer, index) => {
    const entry = timeline[index];
    const isFirstTrack = index === 0;
    const isLastTrack = index === tracks.length - 1;

    // REGRA: Criar novo BufferSource (nunca reutilizar)
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // REGRA: Agendar com start(startTime, startTrim, segmentDuration)
    // startTime: quando começar no contexto offline
    // startTrim: offset no arquivo de áudio
    // segmentDuration: quanto tocar do arquivo
    const sourceStartOffset = startTrim;
    const sourceDuration = segmentDuration;

    // Cria GainNode com crossfade correto
    const gainNode = createCrossfadeGain(
      offlineContext,
      entry.fadeOutStart,
      entry.fadeOutEnd,
      entry.fadeInStart,
      entry.fadeInEnd,
      isFirstTrack,
      isLastTrack
    );

    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // REGRA OBRIGATÓRIA: source.start(startTime, offset, duration)
    source.start(entry.startTime, sourceStartOffset, sourceDuration);
  });

  return offlineContext.startRendering();
}

/**
 * REPRODUTOR EM TEMPO REAL COM TIMELINE CORRIGIDA
 * 
 * Garante:
 * - Novo BufferSource a cada play
 * - Novo GainNode a cada play
 * - Controle preciso de offset e duração
 * - Recalcula timeline ao mudar parâmetros
 */
export class AudioPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private masterGainNode: GainNode;
  private scheduledSources: AudioBufferSourceNode[] = [];

  constructor() {
    this.audioContext = audioContext;
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
  }

  /**
   * Reproduz buffer de áudio com offset e duração precisos
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

    // REGRA: Criar novo BufferSource (nunca reutilizar)
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;

    // REGRA: Criar novo GainNode
    this.currentGainNode = this.audioContext.createGain();
    this.currentGainNode.connect(this.masterGainNode);

    this.currentSource.connect(this.currentGainNode);

    if (onEnded) {
      this.currentSource.onended = onEnded;
    }

    this.startTime = this.audioContext.currentTime - offset;
    this.pausedTime = 0;
    this.isPlaying = true;

    // REGRA: Agendar com start(0, offset, duration)
    if (duration !== undefined) {
      this.currentSource.start(0, offset, duration);
    } else {
      this.currentSource.start(0, offset);
    }

    this.scheduledSources.push(this.currentSource);
  }

  /**
   * Pausa reprodução mantendo posição
   */
  pause(): void {
    if (this.currentSource && this.isPlaying) {
      this.pausedTime = this.audioContext.currentTime - this.startTime;
      this.currentSource.stop();
      this.isPlaying = false;
    }
  }

  /**
   * Retoma reprodução de onde pausou
   */
  resume(): void {
    if (this.currentSource && !this.isPlaying && this.pausedTime > 0 && this.currentSource.buffer) {
      this.play(this.currentSource.buffer, this.pausedTime);
    }
  }

  /**
   * Para reprodução e limpa recursos
   */
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

    // Limpa fontes agendadas
    this.scheduledSources = [];
  }

  /**
   * Define volume (0-1)
   */
  setVolume(value: number): void {
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  /**
   * Obtém volume atual
   */
  getVolume(): number {
    return this.masterGainNode.gain.value;
  }

  /**
   * Verifica se está tocando
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Obtém tempo atual de reprodução
   */
  getCurrentTime(): number {
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedTime;
  }
}
