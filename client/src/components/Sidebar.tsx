import { useAutomixStore } from '@/store/automixStore';
import { Upload, Trash2, Settings, Music, Sliders, Zap, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import AddTracksModal from './AddTracksModal';

export default function Sidebar() {
  const {
    tracks,
    startTrim,
    endPoint,
    crossfadeDuration,
    setStartTrim,
    setEndPoint,
    setCrossfadeDuration,
    clearTracks,
    deleteSelectedTracks,
    selectedTrackIds,
    clearSelection,
  } = useAutomixStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timeline: true,
    settings: true,
  });

  const handleUploadClick = () => {
    setIsModalOpen(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calcula o tempo máximo da música mais longa
  const maxTrackDuration = tracks.length > 0 ? Math.max(...tracks.map((t) => t.duration)) : 0;
  const maxEndPoint = Math.max(startTrim + 1, maxTrackDuration); // End Point não pode ser menor que startTrim + 1s
  
  const trackDuration = endPoint - startTrim;
  const totalPlaylistDuration = trackDuration * tracks.length;

  return (
    <>
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

        {/* Timeline Section */}
        <div className="p-4 border-b border-sidebar-border space-y-4 flex-1">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-glow-cyan transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders size={16} className="text-glow-cyan" />
              Timeline
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedSections['timeline'] ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.timeline && (
            <div className="space-y-4">
              {/* Track Duration Display */}
              <div className="bg-card border border-border rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Duration per track</p>
                <p className="text-lg font-bold text-glow-cyan">{trackDuration.toFixed(1)}s</p>
                <p className="text-xs text-muted-foreground mt-1">
                  (End Point - Start Trim)
                </p>
              </div>

              {/* Start Trim */}
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

              {/* End / Automix Point */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  End / Automix Point
                </label>
                <input
                  type="range"
                  min="0.5"
                  max={maxEndPoint}
                  step="0.5"
                  value={endPoint}
                  onChange={(e) => {
                    const newEndPoint = parseFloat(e.target.value);
                    if (newEndPoint > startTrim) {
                      setEndPoint(newEndPoint);
                    }
                  }}
                  className="w-full"
                  style={{ accentColor: '#ff00ff' }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.min(endPoint, maxEndPoint).toFixed(1)}s / {maxEndPoint.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limited to longest track ({maxTrackDuration.toFixed(1)}s)
                </p>
              </div>

              {/* Crossfade Duration */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Crossfade Duration
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#00ff00' }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {crossfadeDuration.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Equal-power blend for smooth salon energy.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={() => toggleSection('settings')}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-glow-cyan transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings size={16} className="text-glow-magenta" />
              Settings
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedSections['settings'] ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.settings && (
            <div className="mt-4 space-y-2">
              {selectedTrackIds.size > 0 && (
                <button
                  onClick={() => {
                    deleteSelectedTracks();
                    clearSelection();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete {selectedTrackIds.size} selected
                </button>
              )}
              {tracks.length > 0 && (
                <button
                  onClick={clearTracks}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-xs text-muted-foreground border-t border-sidebar-border">
          <p>💡 Drag tracks to reorder • Click to select • Shift+Click for multiple</p>
        </div>
      </aside>

      <AddTracksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
