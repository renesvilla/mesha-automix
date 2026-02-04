import { useAutomixStore } from '@/store/automixStore';
import { Upload, Trash2, Settings, Music, Sliders, Zap } from 'lucide-react';
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

  const trackDuration = endPoint - startTrim;
  const totalPlaylistDuration = trackDuration * tracks.length;

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border space-y-2">
        <div className="flex items-center gap-2">
          <Zap size={24} className="text-glow-cyan" />
          <h1 className="text-xl font-bold text-glow-cyan">MÉSHA</h1>
        </div>
        <p className="text-xs text-muted-foreground">Automix Studio</p>
        <p className="text-xs text-muted-foreground">Dark charcoal • Cyan & Magenta</p>
      </div>

      {/* Workspace Info */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="border-dashed-green p-3 rounded">
          <p className="text-xs text-muted-foreground mb-1">Workspace</p>
          <p className="text-sm font-semibold text-glow-cyan">Salon Mixroom</p>
          <p className="text-xs text-muted-foreground mt-1">v1</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-muted-foreground">Mode:</span>
          <span className="text-glow-cyan font-semibold">Automix</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="text-muted-foreground">Engine:</span>
          <span className="text-glow-magenta font-semibold">Web Audio</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 border-b border-sidebar-border space-y-2">
        <div className="border-dashed-green p-3 rounded space-y-2">
          <div className="flex items-center gap-2 text-glow-cyan">
            <Music size={16} />
            <span className="text-sm font-semibold">Studio</span>
            <span className="status-active w-2 h-2 rounded-full ml-auto"></span>
          </div>
          <div className="flex items-center gap-2 text-foreground hover:text-glow-cyan transition-colors cursor-pointer">
            <Music size={16} />
            <span className="text-sm">Tracks</span>
          </div>
          <div className="flex items-center gap-2 text-foreground hover:text-glow-cyan transition-colors cursor-pointer">
            <Sliders size={16} />
            <span className="text-sm">Presets</span>
          </div>
          <div className="flex items-center gap-2 text-foreground hover:text-glow-cyan transition-colors cursor-pointer">
            <Settings size={16} />
            <span className="text-sm">Mix Settings</span>
          </div>
        </div>
      </nav>

      {/* Upload Section */}
      <div className="p-4 border-b border-sidebar-border">
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-semibold hover:shadow-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
            color: '#0a0a0a',
          }}
        >
          <Upload size={18} />
          Add tracks
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

      {/* Stats Section */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Tracks</p>
          <p className="text-2xl font-bold text-glow-cyan">{tracks.length}</p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Decoded locally</p>
          <p className="text-sm text-glow-magenta font-semibold">
            {tracks.filter((t) => t.isLoaded).length}/{tracks.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Total mix length</p>
          <p className="text-lg font-bold text-glow-green">{totalPlaylistDuration.toFixed(1)}s</p>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="p-4 border-b border-sidebar-border space-y-4 flex-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sliders size={16} className="text-glow-cyan" />
          Timeline
        </h3>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            Start Trim
          </label>
          <input
            type="range"
            min="0"
            max="300"
            step="0.5"
            value={startTrim}
            onChange={(e) => setStartTrim(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#00d9ff' }}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {startTrim.toFixed(1)}s
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Start a little late to skip intros if needed.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            End / Automix Point
          </label>
          <input
            type="range"
            min="0"
            max="300"
            step="0.5"
            value={endPoint}
            onChange={(e) => setEndPoint(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#ff00ff' }}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {endPoint.toFixed(1)}s
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Where each track begins its transition.
          </p>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Crossfade Duration</p>
          <p className="text-sm font-semibold text-glow-cyan">5.0s</p>
          <p className="text-xs text-muted-foreground mt-1">
            Equal-power blend for smooth salon energy.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {tracks.length > 0 && (
          <button
            onClick={clearTracks}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={16} />
            Clear all
          </button>
        )}
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm bg-card border border-border text-foreground hover:border-glow-cyan transition-colors">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}
