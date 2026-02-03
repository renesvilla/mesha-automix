import { useAutomixStore } from '@/store/automixStore';
import { Play, Pause, SkipForward, Download } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AudioPlayer, renderMixToAudioBuffer } from '@/lib/audioUtils';
import { exportAudioBuffer } from '@/lib/mp3Encoder';

export default function Player() {
  const {
    tracks,
    startTrim,
    endPoint,
    isPlaying,
    currentTime,
    totalDuration,
    setIsPlaying,
    setCurrentTime,
  } = useAutomixStore();

  const [audioPlayer, setAudioPlayer] = useState<AudioPlayer | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const playbackIntervalRef = useRef<number | null>(null);

  const allTracksLoaded = tracks.every((t) => t.isLoaded && t.audioBuffer);

  // Inicializa AudioPlayer
  useEffect(() => {
    const player = new AudioPlayer();
    setAudioPlayer(player);
    return () => {
      player.stop();
    };
  }, []);

  // Atualiza tempo de playback
  useEffect(() => {
    if (isPlaying && audioPlayer) {
      playbackIntervalRef.current = window.setInterval(() => {
        const time = audioPlayer.getCurrentTime();
        setCurrentTime(time);

        if (time >= totalDuration) {
          setIsPlaying(false);
          audioPlayer.stop();
        }
      }, 100);

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      };
    }
  }, [isPlaying, audioPlayer, totalDuration, setIsPlaying, setCurrentTime]);

  const handlePlayPause = async () => {
    if (!audioPlayer || tracks.length === 0 || !allTracksLoaded) return;

    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      // Renderiza o mix
      try {
        const audioBuffers = tracks
          .map((t) => t.audioBuffer)
          .filter((b) => b !== undefined) as AudioBuffer[];

        const mixBuffer = await renderMixToAudioBuffer(
          audioBuffers,
          startTrim,
          endPoint,
          5
        );

        audioPlayer.play(mixBuffer, currentTime);
        setIsPlaying(true);
      } catch (error) {
        console.error('Erro ao renderizar mix:', error);
        alert('Erro ao renderizar mix. Tente novamente.');
      }
    }
  };

  const handleSkip = () => {
    if (!audioPlayer) return;
    audioPlayer.stop();
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleExport = async () => {
    if (!allTracksLoaded || tracks.length === 0) {
      alert('Carregue todas as faixas antes de exportar.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Renderiza o mix
      const audioBuffers = tracks
        .map((t) => t.audioBuffer)
        .filter((b) => b !== undefined) as AudioBuffer[];

      setExportProgress(50);

      const mixBuffer = await renderMixToAudioBuffer(
        audioBuffers,
        startTrim,
        endPoint,
        5
      );

      setExportProgress(75);

      // Exporta como MP3 (com fallback para WAV)
      const { blob, extension } = await exportAudioBuffer(mixBuffer, 'mp3');

      setExportProgress(100);

      // Cria link de download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mesha-automix-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Mix exportado com sucesso em formato ${extension.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o mix. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
        <div
          className="h-1 bg-muted rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            setCurrentTime(percent * totalDuration);
          }}
        >
          <div
            className="h-full bg-gradient-neon transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePlayPause}
          disabled={tracks.length === 0 || !allTracksLoaded || isExporting}
          className="p-3 rounded-lg bg-gradient-neon text-sidebar-primary-foreground hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-cyan-hover"
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          onClick={handleSkip}
          disabled={tracks.length === 0 || isExporting}
          className="p-3 rounded-lg border border-border hover:border-cyan-400/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pular"
        >
          <SkipForward size={20} />
        </button>

        <button
          onClick={handleExport}
          disabled={tracks.length === 0 || !allTracksLoaded || isExporting}
          className="p-3 rounded-lg border border-border hover:border-magenta-500/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Exportar como MP3/WAV"
        >
          <Download size={20} />
          {isExporting && <span className="text-xs">{exportProgress}%</span>}
        </button>
      </div>

      {/* Status */}
      <div className="text-center text-xs text-muted-foreground">
        {tracks.length === 0 ? (
          <p>Nenhuma faixa carregada</p>
        ) : !allTracksLoaded ? (
          <p>Carregando faixas...</p>
        ) : (
          <p>
            {tracks.length} faixa{tracks.length !== 1 ? 's' : ''} pronta{tracks.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
