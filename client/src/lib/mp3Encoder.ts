/**
 * Utilitário para conversão de AudioBuffer para MP3
 * Usa lamejs (JavaScript LAME encoder) quando disponível
 * Fallback para WAV se lamejs não estiver carregado
 */

declare global {
  interface Window {
    lamejs?: {
      Mp3Encoder: new (
        channels: number,
        sampleRate: number,
        bitRate: number
      ) => {
        encode(samples: Int16Array): number[];
        flush(): number[];
      };
    };
  }
}

/**
 * Carrega a biblioteca lamejs dinamicamente
 */
export async function loadLameJs(): Promise<boolean> {
  if (window.lamejs) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
    script.onload = () => {
      resolve(!!window.lamejs);
    };
    script.onerror = () => {
      console.warn('Falha ao carregar lamejs, usando WAV como fallback');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Converte AudioBuffer para MP3 usando lamejs
 */
export async function audioBufferToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
  const hasLame = await loadLameJs();

  if (!hasLame || !window.lamejs) {
    console.warn('lamejs não disponível, usando WAV como fallback');
    return audioBufferToWav(audioBuffer);
  }

  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitRate = 192; // kbps

  const encoder = new window.lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitRate);

  // Extrai dados de áudio
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  // Converte para Int16Array
  const samples = new Int16Array(audioBuffer.length * numberOfChannels);
  let sampleIndex = 0;
  const volume = 0.8; // Reduz volume para evitar clipping

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = channelData[channel][i] * volume;
      sample = Math.max(-1, Math.min(1, sample)); // Clamp
      samples[sampleIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
  }

  // Codifica para MP3
  const mp3Data: number[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const blockSize = Math.min(sampleBlockSize, samples.length - i);
    const block = samples.slice(i, i + blockSize);
    const encoded = encoder.encode(block);
    if (encoded.length > 0) {
      mp3Data.push(...encoded);
    }
  }

  // Finaliza codificação
  const finalData = encoder.flush();
  if (finalData.length > 0) {
    mp3Data.push(...finalData);
  }

  return new Blob([new Uint8Array(mp3Data)], { type: 'audio/mpeg' });
}

/**
 * Converte AudioBuffer para WAV com cabeçalhos RIFF corretos
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const channelData: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  const length = audioBuffer.length * numberOfChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const writeInt16 = (offset: number, value: number) => {
    view.setInt16(offset, value, true);
  };

  const writeInt32 = (offset: number, value: number) => {
    view.setInt32(offset, value, true);
  };

  // RIFF header
  writeString(0, 'RIFF');
  writeInt32(4, 36 + length);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  writeInt32(16, 16); // Subchunk1Size
  writeInt16(20, format); // AudioFormat (1 = PCM)
  writeInt16(22, numberOfChannels);
  writeInt32(24, sampleRate);
  writeInt32(28, sampleRate * blockAlign);
  writeInt16(32, blockAlign);
  writeInt16(34, bitDepth);

  // data sub-chunk
  writeString(36, 'data');
  writeInt32(40, length);

  // Escreve dados de áudio
  let offset = 44;
  const volume = 0.8; // Reduz volume para evitar clipping
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = channelData[channel][i] * volume;
      sample = Math.max(-1, Math.min(1, sample)); // Clamp
      writeInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Exporta AudioBuffer com escolha automática de formato
 * Tenta MP3 primeiro, fallback para WAV
 */
export async function exportAudioBuffer(
  audioBuffer: AudioBuffer,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  if (format === 'mp3') {
    try {
      const blob = await audioBufferToMp3(audioBuffer);
      return {
        blob,
        mimeType: 'audio/mpeg',
        extension: 'mp3',
      };
    } catch (error) {
      console.warn('Erro ao codificar MP3, usando WAV:', error);
    }
  }

  const blob = audioBufferToWav(audioBuffer);
  return {
    blob,
    mimeType: 'audio/wav',
    extension: 'wav',
  };
}
