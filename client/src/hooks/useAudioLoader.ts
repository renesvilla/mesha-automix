import { useEffect, useRef } from 'react';
import { useAutomixStore } from '@/store/automixStore';
import { decodeAudioFile } from '@/lib/audioUtils';

/**
 * Hook que gerencia o carregamento de arquivos de áudio
 * Decodifica cada arquivo e atualiza o store com o AudioBuffer
 * 
 * Usa seletores específicos para evitar ciclos infinitos causados
 * por mudanças de referência de funções do Zustand
 */
export function useAudioLoader() {
  // Usa seletores específicos para evitar dependências desnecessárias
  const tracks = useAutomixStore((state) => state.tracks);
  const setTrackAudioBuffer = useAutomixStore((state) => state.setTrackAudioBuffer);
  const setTrackLoaded = useAutomixStore((state) => state.setTrackLoaded);

  // Rastreia IDs de faixas já processadas para evitar reprocessamento
  const processedTracksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Processa cada faixa não carregada
    tracks.forEach((track) => {
      // Pula se já foi processada
      if (processedTracksRef.current.has(track.id)) {
        return;
      }

      // Pula se já está carregada
      if (track.isLoaded && track.audioBuffer) {
        processedTracksRef.current.add(track.id);
        return;
      }

      // Marca como processada antes de iniciar
      processedTracksRef.current.add(track.id);

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
    });

    // Limpa referências de faixas removidas
    const currentTrackIds = new Set(tracks.map((t) => t.id));
    processedTracksRef.current.forEach((id) => {
      if (!currentTrackIds.has(id)) {
        processedTracksRef.current.delete(id);
      }
    });
  }, [tracks, setTrackAudioBuffer, setTrackLoaded]);
}
