import { useAutomixStore } from '@/store/automixStore';
import { Upload, Trash2, Settings, Music, Sliders, Zap, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

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
    addTrack,
  } = useAutomixStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timeline: true,
    settings: true,
  });
  const [isDragOverButton, setIsDragOverButton] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const audioFiles = Array.from(files).filter((file) => file.type.startsWith('audio/'));

    for (const file of audioFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        addTrack({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          duration: audioBuffer.duration,
          audioBuffer,
          isLoaded: true,
        });
      } catch (error) {
        console.error(`Erro ao carregar ${file.name}:`, error);
        alert(`Erro ao carregar ${file.name}`);
      }
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverButton(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverButton(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverButton(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calcula o tempo máximo da música mais longa
  const maxTrackDuration = tracks.length > 0 ? Math.max(...tracks.map((t) => t.duration)) : 0;
  const maxEndPoint = Math.max(startTrim + 1, maxTrackDuration);
  
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

        {/* Workspace Info - SETOR A */}
        <div className="p-4 border-b border-sidebar-border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-glow-cyan text-background text-xs font-bold">A</span>
            <span className="text-xs font-semibold text-muted-foreground">WORKSPACE</span>
          </div>
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

        {/* Upload Section - Com Drag & Drop */}
        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={handleUploadClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-semibold hover:shadow-lg transition-all border-2 ${
              isDragOverButton
                ? 'border-glow-cyan bg-cyan-500/10'
                : 'border-transparent'
            }`}
            style={{
              background: isDragOverButton ? 'rgba(0, 217, 255, 0.1)' : 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
              color: isDragOverButton ? '#00d9ff' : '#0a0a0a',
            }}
          >
            <Upload size={18} />
            {isDragOverButton ? 'Drop files here' : 'Add tracks'}
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Click or drag & drop audio files
          </p>
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
            <p className="text-sm text-green-400 font-semibold">
              {totalPlaylistDuration.toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Timeline Section - SETOR B */}
        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-glow-cyan transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-glow-magenta text-background text-xs font-bold">B</span>
              <Sliders size={16} className="text-glow-cyan" />
              Timeline
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedSections['timeline'] ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections['timeline'] && (
            <div className="mt-4 space-y-4">
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

          {expandedSections['settings'] && (
            <div className="mt-4 space-y-3">
              {tracks.length > 0 && selectedTrackIds.size > 0 && (
                <button
                  onClick={() => {
                    deleteSelectedTracks();
                    clearSelection();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete selected ({selectedTrackIds.size})
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </>
  );
}
