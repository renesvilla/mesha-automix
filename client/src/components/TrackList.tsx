import { useAutomixStore } from '@/store/automixStore';
import { Music, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function TrackList() {
  const { tracks, removeTrack } = useAutomixStore();

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Music size={48} className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma faixa carregada</h2>
        <p className="text-muted-foreground">
          Clique em "Upload Áudio" na barra lateral para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-cyan-400/50 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                  #{index + 1}
                </span>
                {track.isLoaded ? (
                  <CheckCircle size={16} className="text-cyan-400 flex-shrink-0" />
                ) : (
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: '#ff00ff' }} />
                )}
              </div>
              <h3 className="font-semibold text-foreground truncate">{track.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {track.isLoaded ? (
                  <>
                    Duração: <span className="text-cyan-400">{track.duration.toFixed(2)}s</span>
                  </>
                ) : (
                  'Carregando...'
                )}
              </p>
            </div>

            <button
              onClick={() => removeTrack(track.id)}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Remover faixa"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Progress bar for loading */}
          {!track.isLoaded && (
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-neon animate-pulse" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
