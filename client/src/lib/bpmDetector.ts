/**
 * Algoritmo de Detecção de BPM usando análise de picos em espectro de frequência
 * Baseado em Low-Pass Filter + Peak Detection
 */

/**
 * Detecta BPM de um AudioBuffer analisando o espectro de frequência
 * @param audioBuffer - Buffer de áudio para análise
 * @returns BPM detectado (range: 60-200 BPM)
 */
export function detectBPM(audioBuffer: AudioBuffer): number {
  // Extrai canal mono (média de todos os canais)
  const monoBuffer = extractMonoChannel(audioBuffer);

  // Aplica Low-Pass Filter para suavizar e focar em frequências de ritmo
  const filtered = applyLowPassFilter(monoBuffer, 200); // 200Hz cutoff

  // Detecta picos (onsets) no sinal filtrado
  const peaks = detectPeaks(filtered);

  // Calcula intervalos entre picos
  const intervals = calculateIntervals(peaks);

  // Agrupa intervalos similares e encontra o mais comum
  const bpm = findDominantBPM(intervals, audioBuffer.sampleRate);

  // Retorna BPM com limite entre 60 e 200
  return Math.max(60, Math.min(200, Math.round(bpm)));
}

/**
 * Extrai um canal mono do AudioBuffer (média de todos os canais)
 */
function extractMonoChannel(audioBuffer: AudioBuffer): Float32Array {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const monoBuffer = new Float32Array(length);

  if (numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  // Média de todos os canais
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i];
    }
    monoBuffer[i] = sum / numberOfChannels;
  }

  return monoBuffer;
}

/**
 * Aplica Low-Pass Filter usando média móvel simples
 * @param signal - Sinal de entrada
 * @param cutoffFrequency - Frequência de corte em Hz
 * @returns Sinal filtrado
 */
function applyLowPassFilter(signal: Float32Array, cutoffFrequency: number): Float32Array {
  const sampleRate = 44100; // Assumindo 44.1kHz (ajustar se necessário)
  const windowSize = Math.max(2, Math.floor(sampleRate / cutoffFrequency));
  const filtered = new Float32Array(signal.length);

  // Média móvel
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
      sum += Math.abs(signal[j]); // Usa valor absoluto para detectar energia
      count++;
    }
    filtered[i] = sum / count;
  }

  return filtered;
}

/**
 * Detecta picos (onsets) no sinal usando threshold dinâmico
 * @param signal - Sinal filtrado
 * @returns Array de índices dos picos
 */
function detectPeaks(signal: Float32Array): number[] {
  const peaks: number[] = [];
  const windowSize = 2048; // Janela para calcular threshold local
  const minPeakDistance = 4410; // Mínimo ~100ms entre picos (44.1kHz)

  for (let i = windowSize; i < signal.length - windowSize; i++) {
    // Calcula threshold local (média da janela)
    let sum = 0;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      sum += signal[j];
    }
    const threshold = (sum / (2 * windowSize + 1)) * 1.5; // 1.5x da média

    // Detecta pico se valor excede threshold e é máximo local
    if (
      signal[i] > threshold &&
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i + 1]
    ) {
      // Evita picos muito próximos
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}

/**
 * Calcula intervalos entre picos consecutivos
 * @param peaks - Array de índices de picos
 * @returns Array de intervalos em amostras
 */
function calculateIntervals(peaks: number[]): number[] {
  const intervals: number[] = [];

  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  return intervals;
}

/**
 * Encontra o BPM dominante agrupando intervalos similares
 * @param intervals - Array de intervalos em amostras
 * @param sampleRate - Taxa de amostragem
 * @returns BPM detectado
 */
function findDominantBPM(intervals: number[], sampleRate: number): number {
  if (intervals.length === 0) {
    return 120; // BPM padrão se nenhum intervalo for encontrado
  }

  // Converte intervalos para BPM
  // BPM = (sampleRate / interval) * 60
  const bpms = intervals.map((interval) => (sampleRate / interval) * 60);

  // Agrupa BPMs similares (±5 BPM)
  const groups: Map<number, number> = new Map();
  const tolerance = 5;

  for (const bpm of bpms) {
    let found = false;
    const entries = Array.from(groups.entries());
    for (const [key, count] of entries) {
      if (Math.abs(bpm - key) < tolerance) {
        groups.set(key, count + 1);
        found = true;
        break;
      }
    }
    if (!found) {
      groups.set(Math.round(bpm), 1);
    }
  }

  // Encontra o grupo com mais ocorrências
  let dominantBPM = 120;
  let maxCount = 0;

  const entries = Array.from(groups.entries());
  for (const [bpm, count] of entries) {
    if (count > maxCount) {
      maxCount = count;
      dominantBPM = bpm;
    }
  }

  return dominantBPM;
}

/**
 * Calcula playbackRate para atingir um BPM alvo
 * @param originalBPM - BPM original detectado
 * @param targetBPM - BPM alvo desejado
 * @returns PlaybackRate (0.5 a 2.0)
 */
export function calculatePlaybackRate(originalBPM: number, targetBPM: number): number {
  if (originalBPM === 0) return 1;
  const rate = targetBPM / originalBPM;
  // Limita entre 0.5x e 2.0x
  return Math.max(0.5, Math.min(2.0, rate));
}

/**
 * Formata BPM para exibição
 * @param bpm - BPM a formatar
 * @returns String formatada (ex: "120 BPM")
 */
export function formatBPM(bpm: number): string {
  return `${Math.round(bpm)} BPM`;
}
