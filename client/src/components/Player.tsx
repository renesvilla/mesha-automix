import { useAutomixStore } from '@/store/automixStore';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  Music,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AudioPlayer, renderMixToAudioBuffer } from '@/lib/audioUtils';
import { exportAudioBuffer } from '@/lib/mp3Encoder';

export default function Player() {
  const {
    tracks,
    startTrim,
    endPoint,
    crossfadeDuration,
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
  const [volume, setVolume] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const playbackIntervalRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const lastPlayStateRef = useRef<boolean>(false);

  const allTracksLoaded = tracks.every((t) => t.isLoaded && t.audioBuffer);
  const effectiveTrackDuration = Math.max(0.1, endPoint - startTrim);
  const currentTrack = tracks[currentTrackIndex];
  const nextTrack = currentTrackIndex < tracks.length - 1 ? tracks[currentTrackIndex + 1] : null;

  // Calcula tempo relativo dentro da música atual (0 a effectiveTrackDuration)
  const currentTrackRelativeTime = currentTime % (effectiveTrackDuration || 1);
  
  // Calcula percentual de progresso para Timeline 1 (Current Track)
  const currentTrackProgressPercent = effectiveTrackDuration > 0 
    ? (currentTrackRelativeTime / effectiveTrackDuration) * 100 
    : 0;
  
  // Calcula percentual de progresso para Timeline 2 (Total Playlist)
  const playlistProgressPercent = totalDuration > 0 
    ? (currentTime / totalDuration) * 100 
    : 0;

  // Inicializa AudioPlayer
  useEffect(() => {
    const player = new AudioPlayer();
    setAudioPlayer(player);
    player.setVolume(volume);
    return () => {
      player.stop();
    };
  }, []);

  // Atualiza volume
  useEffect(() => {
    if (audioPlayer) {
      audioPlayer.setVolume(volume);
    }
  }, [volume, audioPlayer]);

  // Detecta mudanças nos parâmetros e mostra mensagem de atualização
  useEffect(() => {
    if (isPlaying) {
      setIsUpdating(true);
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = window.setTimeout(() => {
        setIsUpdating(false);
      }, 1000);
    }
  }, [startTrim, endPoint, crossfadeDuration, isPlaying]);

  // Atualiza tempo de playback
  useEffect(() => {
    if (isPlaying && audioPlayer) {
      playbackIntervalRef.current = window.setInterval(() => {
        const time = audioPlayer.getCurrentTime();
        setCurrentTime(time);

        // Verifica se atingiu o fim da playlist
        if (time >= totalDuration) {
          if (repeatMode === 'one') {
            setCurrentTime(0);
            audioPlayer.stop();
            // Reinicia reprodução
            handlePlayPause();
          } else if (repeatMode === 'all') {
            setCurrentTime(0);
            setCurrentTrackIndex(0);
            audioPlayer.stop();
            // Reinicia reprodução
            handlePlayPause();
          } else {
            // Fim da playlist sem repeat
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
  }, [isPlaying, audioPlayer, totalDuration, repeatMode]);

  const handlePlayPause = async () => {
    if (!audioPlayer || tracks.length === 0 || !allTracksLoaded) return;

    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
      lastPlayStateRef.current = false;
    } else {
      try {
        const audioBuffers = tracks
          .map((t) => t.audioBuffer)
          .filter((b) => b !== undefined) as AudioBuffer[];

        const mixBuffer = await renderMixToAudioBuffer(
          audioBuffers,
          startTrim,
          endPoint,
          crossfadeDuration
        );

        audioPlayer.play(mixBuffer, currentTime);
        setIsPlaying(true);
        lastPlayStateRef.current = true;
      } catch (error) {
        console.error('Erro ao renderizar mix:', error);
        alert('Erro ao renderizar mix. Tente novamente.');
        setIsPlaying(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      const newIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(newIndex);
      // Calcula tempo absoluto: índice * duração + startTrim
      const newTime = newIndex * effectiveTrackDuration;
      setCurrentTime(newTime);
      
      // Se está tocando, para e reinicia
      if (isPlaying && audioPlayer) {
        audioPlayer.stop();
        setIsPlaying(false);
      }
    } else if (repeatMode === 'all') {
      const newIndex = tracks.length - 1;
      setCurrentTrackIndex(newIndex);
      const newTime = newIndex * effectiveTrackDuration;
      setCurrentTime(newTime);
      
      if (isPlaying && audioPlayer) {
        audioPlayer.stop();
        setIsPlaying(false);
      }
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      const newIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(newIndex);
      const newTime = newIndex * effectiveTrackDuration;
      setCurrentTime(newTime);
      
      if (isPlaying && audioPlayer) {
        audioPlayer.stop();
        setIsPlaying(false);
      }
    } else if (repeatMode === 'all') {
      setCurrentTrackIndex(0);
      setCurrentTime(0);
      
      if (isPlaying && audioPlayer) {
        audioPlayer.stop();
        setIsPlaying(false);
      }
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
      const audioBuffers = tracks
        .map((t) => t.audioBuffer)
        .filter((b) => b !== undefined) as AudioBuffer[];

      setExportProgress(50);

      const mixBuffer = await renderMixToAudioBuffer(
        audioBuffers,
        startTrim,
        endPoint,
        crossfadeDuration
      );

      setExportProgress(75);

      const { blob } = await exportAudioBuffer(mixBuffer, 'mp3');

      setExportProgress(100);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mesha-automix-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Mix exportado com sucesso em formato MP3!');
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

  const remainingTime = Math.max(0, totalDuration - currentTime);

  return (
    <div className="bg-card border border-border rounded p-6 space-y-6">
      {/* Status Message */}
      {isUpdating && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 text-sm text-glow-cyan">
          ⚡ Atualizando parâmetros...
        </div>
      )}

      {/* Hero Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-glow-cyan flex items-center gap-2">
          <Music size={28} />
          Automix Studio
        </h2>
        <p className="text-sm text-muted-foreground">
          Premium automix for in-salon ambience
        </p>
      </div>

      {/* Timeline 1: Current Track */}
      <div className="space-y-3 p-4 bg-muted/30 rounded border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-glow-cyan font-semibold">
            {currentTrack ? currentTrack.name : 'Nenhuma faixa'}
          </span>
          <span className="text-muted-foreground">Now Playing</span>
          <span className="text-glow-magenta font-semibold">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const trackStartTime = currentTrackIndex * effectiveTrackDuration;
            setCurrentTime(trackStartTime + percent * effectiveTrackDuration);
          }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${currentTrackProgressPercent}%`,
              background: 'linear-gradient(90deg, #00d9ff 0%, #ff00ff 100%)',
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTrackRelativeTime)}</span>
          <span>{formatTime(effectiveTrackDuration)}</span>
        </div>
      </div>

      {/* Timeline 2: Total Playlist */}
      <div className="space-y-3 p-4 bg-muted/30 rounded border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 font-semibold">Total Playlist</span>
          <span className="text-muted-foreground">
            Track {currentTrackIndex + 1} / {tracks.length}
          </span>
          <span className="text-glow-cyan font-semibold">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            setCurrentTime(percent * totalDuration);
          }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${playlistProgressPercent}%`,
              background: 'linear-gradient(90deg, #00ff00 0%, #00d9ff 100%)',
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={tracks.length === 0 || isExporting}
            className="p-3 rounded-lg border border-border hover:border-cyan-400/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Faixa anterior"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={handlePlayPause}
            disabled={tracks.length === 0 || !allTracksLoaded || isExporting || isUpdating}
            className="p-4 rounded-lg border border-border text-foreground hover:border-cyan-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              (isPlaying || (!isPlaying && allTracksLoaded && tracks.length > 0)) && currentTime < totalDuration
                ? {
                    background: 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
                    color: '#0a0a0a',
                    borderColor: 'transparent',
                  }
                : undefined
            }
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying && currentTime < totalDuration ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            onClick={handleNext}
            disabled={tracks.length === 0 || isExporting}
            className="p-3 rounded-lg border border-border hover:border-cyan-400/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próxima faixa"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Next Track Info */}
        {nextTrack && (
          <div className="text-xs text-glow-magenta font-semibold">
            Próxima: {nextTrack.name}
          </div>
        )}
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24"
            style={{ accentColor: '#00d9ff' }}
            title="Volume"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(volume * 100)}%</span>
        </div>

        <button
          onClick={handleExport}
          disabled={tracks.length === 0 || !allTracksLoaded || isExporting}
          className="p-2 rounded-lg border border-border hover:border-magenta-500/50 text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Exportar como MP3"
        >
          <Download size={18} />
          {isExporting && <span className="text-xs">{exportProgress}%</span>}
        </button>
      </div>

      {/* Status Info */}
      <div className="bg-card border border-border rounded p-4 space-y-2">
        <div className="text-xs text-muted-foreground">
          {tracks.length === 0 ? (
            <p>🎵 Your studio is quiet.</p>
          ) : !allTracksLoaded ? (
            <p>⏳ Decoding tracks locally...</p>
          ) : isPlaying ? (
            <p>▶️ Playing: {currentTrack?.name || 'Unknown'}</p>
          ) : currentTime >= totalDuration ? (
            <p>✅ Playlist finished</p>
          ) : (
            <p>⏸️ Ready to play</p>
          )}
        </div>
      </div>
    </div>
  );
}
