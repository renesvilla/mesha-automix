import { useAutomixStore } from '@/store/automixStore';
import { Upload, Trash2, Settings } from 'lucide-react';
import { useRef } from 'react';

export default function Sidebar() {
  const {
    tracks,
    startTrim,
    endPoint,
    setStartTrim,
    setEndPoint,
    addTracks,
    clearTracks,
  } = useAutomixStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addTracks(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-glow-cyan mb-2">MÉSHA</h1>
        <p className="text-xs text-muted-foreground">Automix Engine</p>
      </div>

      {/* Upload Section */}
      <div className="p-6 border-b border-sidebar-border">
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
            color: '#0a0e27',
          }}
        >
          <Upload size={18} />
          Upload Áudio
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Timeline Controls */}
      <div className="p-6 border-b border-sidebar-border space-y-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Start Trim (s)
          </label>
          <input
            type="range"
            min="0"
            max="300"
            step="0.5"
            value={startTrim}
            onChange={(e) => setStartTrim(parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#00d9ff' }}
          />
          <div className="text-xs text-muted-foreground mt-2 text-right">
            {startTrim.toFixed(1)}s
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            End/Automix Point (s)
          </label>
          <input
            type="range"
            min="0"
            max="300"
            step="0.5"
            value={endPoint}
            onChange={(e) => setEndPoint(parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#ff00ff' }}
          />
          <div className="text-xs text-muted-foreground mt-2 text-right">
            {endPoint.toFixed(1)}s
          </div>
        </div>

        <div className="bg-card rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">Duração por faixa</p>
          <p className="text-lg font-bold text-glow-cyan">
            {(endPoint - startTrim).toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Track Count */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Faixas carregadas</p>
            <p className="text-2xl font-bold text-glow-magenta">{tracks.length}</p>
          </div>
          {tracks.length > 0 && (
            <button
              onClick={clearTracks}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
              title="Limpar todas as faixas"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 mt-auto border-t border-sidebar-border space-y-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Settings size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Crossfade automático de <span className="text-cyan-400">5 segundos</span> entre faixas.
          </p>
        </div>
        <div className="bg-card rounded p-2 border border-border">
          <p className="font-semibold text-foreground mb-1">Dica:</p>
          <p>Ajuste os sliders para controlar o ponto de início e fim de cada faixa.</p>
        </div>
      </div>
    </aside>
  );
}
