import { useAutomixStore } from '@/store/automixStore';
import { Play, Pause, SkipForward, SkipBack, Download, Repeat, Repeat1, Shuffle } from 'lucide-react';
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
    currentTrackIndex,
    repeatMode,
    isShuffle,
    setIsPlaying,
    setCurrentTime,
    setCurrentTrackIndex,
    setRepeatMode,
    setShuffle,
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
          // Lógica de repeat
          if (repeatMode === 'one') {
            setCurrentTime(0);
            audioPlayer.stop();
            // Reinicia a reprodução
            handlePlayPause();
          } else if (repeatMode === 'all') {
            setCurrentTime(0);
            setCurrentTrackIndex(0);
            audioPlayer.stop();
            // Reinicia do começo
            handlePlayPause();
          } else {
            setIsPlaying(false);
            audioPlayer.stop();
          }
        }
      }, 100);

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      };
    }
  }, [isPlaying, audioPlayer, totalDuration, repeatMode, setIsPlaying, setCurrentTime, setCurrentTrackIndex]);

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

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setCurrentTime(0);
    } else if (repeatMode === 'all') {
      setCurrentTrackIndex(tracks.length - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setCurrentTime(0);
    } else if (repeatMode === 'all') {
      setCurrentTrackIndex(0);
      setCurrentTime(0);
    }
  };

  const handleRepeat = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const handleShuffle = () => {
    setShuffle(!isShuffle);
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

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrevious}
          disabled={tracks.length === 0 || isExporting}
          className="p-2 rounded-lg border border-border hover:border-cyan-400/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Faixa anterior"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={handlePlayPause}
          disabled={tracks.length === 0 || !allTracksLoaded || isExporting}
          className="p-3 rounded-lg bg-gradient-neon text-sidebar-primary-foreground hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-cyan-hover"
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          onClick={handleNext}
          disabled={tracks.length === 0 || isExporting}
          className="p-2 rounded-lg border border-border hover:border-cyan-400/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Próxima faixa"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleRepeat}
          disabled={tracks.length === 0 || isExporting}
          className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            repeatMode === 'off'
              ? 'border-border hover:border-cyan-400/50 text-foreground hover:bg-card'
              : 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
          }`}
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>

        <button
          onClick={handleShuffle}
          disabled={tracks.length === 0 || isExporting}
          className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isShuffle
              ? 'border-magenta-500 bg-magenta-500/10 text-magenta-500'
              : 'border-border hover:border-cyan-400/50 text-foreground hover:bg-card'
          }`}
          style={
            isShuffle
              ? { borderColor: '#ff00ff', backgroundColor: 'rgba(255, 0, 255, 0.1)', color: '#ff00ff' }
              : undefined
          }
          title="Shuffle"
        >
          <Shuffle size={18} />
        </button>

        <button
          onClick={handleExport}
          disabled={tracks.length === 0 || !allTracksLoaded || isExporting}
          className="p-2 rounded-lg border border-border hover:border-magenta-500/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
          title="Exportar como MP3/WAV"
        >
          <Download size={18} />
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
            {tracks.length} faixa{tracks.length !== 1 ? 's' : ''} pronta{tracks.length !== 1 ? 's' : ''} |
            Faixa {currentTrackIndex + 1} de {tracks.length}
          </p>
        )}
      </div>
    </div>
  );
}
