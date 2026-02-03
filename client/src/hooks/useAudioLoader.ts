import { useEffect } from 'react';
import { useAutomixStore } from '@/store/automixStore';
import { decodeAudioFile } from '@/lib/audioUtils';

/**
 * Hook que gerencia o carregamento de arquivos de áudio
 * Decodifica cada arquivo e atualiza o store com o AudioBuffer
 */
export function useAudioLoader() {
  const { tracks, setTrackAudioBuffer, setTrackLoaded } = useAutomixStore();

  useEffect(() => {
    // Processa cada faixa não carregada
    tracks.forEach((track) => {
      if (!track.isLoaded && !track.audioBuffer) {
        // Marca como em carregamento
        setTrackLoaded(track.id, false);

        // Decodifica o arquivo
        decodeAudioFile(track.file)
          .then((buffer) => {
            setTrackAudioBuffer(track.id, buffer);
            setTrackLoaded(track.id, true);
          })
          .catch((error) => {
            console.error(`Erro ao decodificar ${track.name}:`, error);
            setTrackLoaded(track.id, false);
          });
      }
    });
  }, [tracks, setTrackAudioBuffer, setTrackLoaded]);
}
