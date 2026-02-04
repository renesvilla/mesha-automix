import { useAutomixStore } from '@/store/automixStore';
import { Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';

export default function TrackList() {
  const {
    tracks,
    startTrim,
    endPoint,
    selectedTrackIds,
    toggleTrackSelection,
    selectAllTracks,
    clearSelection,
    deleteSelectedTracks,
    reorderTracks,
    removeTrack,
  } = useAutomixStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [shiftClickIndex, setShiftClickIndex] = useState<number | null>(null);

  const trackDuration = endPoint - startTrim;

  const handleTrackClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey && shiftClickIndex !== null) {
      // Shift+Click: select range
      const start = Math.min(shiftClickIndex, index);
      const end = Math.max(shiftClickIndex, index);
      clearSelection();
      for (let i = start; i <= end; i++) {
        if (tracks[i]) {
          toggleTrackSelection(tracks[i].id);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+Click: toggle individual
      toggleTrackSelection(tracks[index].id);
      setShiftClickIndex(index);
    } else {
      // Regular click: select single
      clearSelection();
      toggleTrackSelection(tracks[index].id);
      setShiftClickIndex(index);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderTracks(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  if (tracks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center space-y-4">
        <p className="text-lg text-muted-foreground">🎵 Your studio is quiet.</p>
        <p className="text-sm text-muted-foreground">
          Add a few tracks, decode them locally, then hit Play to start a salon-smooth Automix.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedTrackIds.size === tracks.length && tracks.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                selectAllTracks();
              } else {
                clearSelection();
              }
            }}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: '#00d9ff' }}
          />
          <span className="text-sm font-semibold text-foreground">
            {selectedTrackIds.size > 0
              ? `${selectedTrackIds.size} selected`
              : `${tracks.length} track${tracks.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {selectedTrackIds.size > 0 && (
          <button
            onClick={() => {
              deleteSelectedTracks();
              clearSelection();
            }}
            className="flex items-center gap-2 px-3 py-1 rounded text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>

      {/* Tracks List */}
      <div className="divide-y divide-border">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className={`px-6 py-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-colors ${
              draggedIndex === index ? 'opacity-50 bg-muted' : ''
            } ${
              selectedTrackIds.has(track.id)
                ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                : 'hover:bg-muted/50'
            }`}
            onClick={(e) => handleTrackClick(index, e)}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedTrackIds.has(track.id)}
              onChange={() => toggleTrackSelection(track.id)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: '#00d9ff' }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Drag Handle */}
            <GripVertical size={18} className="text-muted-foreground flex-shrink-0" />

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{track.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>
                  {track.isLoaded ? (
                    <span className="text-glow-green">✓ Decoded</span>
                  ) : (
                    <span className="text-muted-foreground">Decoding...</span>
                  )}
                </span>
                <span>{track.duration.toFixed(2)}s</span>
              </div>
            </div>

            {/* Duration Display */}
            <div className="text-right">
              <div className="text-sm font-semibold text-glow-cyan">{trackDuration.toFixed(1)}s</div>
              <div className="text-xs text-muted-foreground">per track</div>
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTrack(track.id);
              }}
              className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive flex-shrink-0"
              title="Remove track"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-muted border-t border-border px-6 py-3 text-xs text-muted-foreground">
        💡 Drag to reorder • Click to select • Shift+Click for range • Ctrl/Cmd+Click for multiple
      </div>
    </div>
  );
}
