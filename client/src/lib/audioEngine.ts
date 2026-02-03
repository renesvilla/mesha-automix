/**
 * Motor de Áudio Avançado para Automix
 * Gerencia agendamento de faixas com crossfade inteligente e sincronização
 */

export interface AudioEngineConfig {
  startTrim: number;
  endPoint: number;
  crossfadeDuration: number;
  sampleRate: number;
}

export interface ScheduleEntry {
  trackIndex: number;
  audioBuffer: AudioBuffer;
  scheduleStartTime: number;
  scheduleEndTime: number;
  sourceStartOffset: number;
  sourceDuration: number;
  fadeInStart?: number;
  fadeInEnd?: number;
  fadeOutStart?: number;
  fadeOutEnd?: number;
}

/**
 * Calcula o cronograma completo de reprodução com crossfade
 */
export function calculateSchedule(
  audioBuffers: AudioBuffer[],
  config: AudioEngineConfig
): ScheduleEntry[] {
  const { startTrim, endPoint, crossfadeDuration } = config;
  const trackDuration = endPoint - startTrim;
  const schedule: ScheduleEntry[] = [];

  let currentScheduleTime = 0;

  audioBuffers.forEach((buffer, trackIndex) => {
    const trackStartTime = currentScheduleTime;
    const trackEndTime = trackStartTime + trackDuration;

    // Próxima faixa começa 5 segundos antes do fim desta
    const nextTrackStartTime = trackEndTime - crossfadeDuration;

    // Configuração de fade
    let fadeInStart: number | undefined;
    let fadeInEnd: number | undefined;
    let fadeOutStart: number | undefined;
    let fadeOutEnd: number | undefined;

    // Primeira faixa: sem fade in
    if (trackIndex > 0) {
      fadeInStart = nextTrackStartTime;
      fadeInEnd = trackStartTime;
    }

    // Última faixa: sem fade out
    if (trackIndex < audioBuffers.length - 1) {
      fadeOutStart = trackEndTime - crossfadeDuration;
      fadeOutEnd = trackEndTime;
    }

    schedule.push({
      trackIndex,
      audioBuffer: buffer,
      scheduleStartTime: trackStartTime,
      scheduleEndTime: trackEndTime,
      sourceStartOffset: startTrim,
      sourceDuration: trackDuration,
      fadeInStart,
      fadeInEnd,
      fadeOutStart,
      fadeOutEnd,
    });

    currentScheduleTime = nextTrackStartTime;
  });

  return schedule;
}

/**
 * Renderiza o mix usando OfflineAudioContext com cronograma otimizado
 */
export async function renderMixWithSchedule(
  schedule: ScheduleEntry[],
  sampleRate: number
): Promise<AudioBuffer> {
  if (schedule.length === 0) {
    throw new Error('Cronograma vazio');
  }

  // Calcula duração total
  const lastEntry = schedule[schedule.length - 1];
  const totalDuration = lastEntry.scheduleEndTime;

  // Cria contexto offline
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(sampleRate * totalDuration),
    sampleRate
  );

  // Processa cada entrada do cronograma
  schedule.forEach((entry) => {
    const source = offlineContext.createBufferSource();
    source.buffer = entry.audioBuffer;

    // Cria nó de ganho com automação de fade
    const gainNode = offlineContext.createGain();

    // Configura fade in
    if (entry.fadeInStart !== undefined && entry.fadeInEnd !== undefined) {
      gainNode.gain.setValueAtTime(0, entry.fadeInStart);
      gainNode.gain.linearRampToValueAtTime(1, entry.fadeInEnd);
    } else {
      gainNode.gain.setValueAtTime(1, entry.scheduleStartTime);
    }

    // Configura fade out
    if (entry.fadeOutStart !== undefined && entry.fadeOutEnd !== undefined) {
      gainNode.gain.setValueAtTime(1, entry.fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, entry.fadeOutEnd);
    } else {
      gainNode.gain.setValueAtTime(1, entry.scheduleEndTime);
    }

    source.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Agenda reprodução
    source.start(entry.scheduleStartTime, entry.sourceStartOffset, entry.sourceDuration);
  });

  return offlineContext.startRendering();
}

/**
 * Calcula informações de visualização para a timeline
 */
export interface TimelineInfo {
  totalDuration: number;
  trackDuration: number;
  trackCount: number;
  crossfadeDuration: number;
  crossfadeOverlap: number;
}

export function calculateTimelineInfo(
  trackCount: number,
  config: AudioEngineConfig
): TimelineInfo {
  const trackDuration = config.endPoint - config.startTrim;
  const crossfadeOverlap = config.crossfadeDuration;
  const totalDuration = trackDuration * trackCount - crossfadeOverlap * (trackCount - 1);

  return {
    totalDuration: Math.max(0, totalDuration),
    trackDuration,
    trackCount,
    crossfadeDuration: config.crossfadeDuration,
    crossfadeOverlap,
  };
}

/**
 * Valida configuração de áudio
 */
export function validateAudioConfig(config: AudioEngineConfig): string[] {
  const errors: string[] = [];

  if (config.startTrim < 0) {
    errors.push('Start Trim não pode ser negativo');
  }

  if (config.endPoint <= config.startTrim) {
    errors.push('End Point deve ser maior que Start Trim');
  }

  if (config.crossfadeDuration < 0) {
    errors.push('Crossfade Duration não pode ser negativo');
  }

  if (config.crossfadeDuration > config.endPoint - config.startTrim) {
    errors.push('Crossfade Duration não pode ser maior que a duração da faixa');
  }

  return errors;
}
