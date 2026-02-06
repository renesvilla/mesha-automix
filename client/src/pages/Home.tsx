import Sidebar from '@/components/Sidebar';
import TrackList from '@/components/TrackList';
import Player from '@/components/Player';
import { useAudioLoader } from '@/hooks/useAudioLoader';
import { useAutomixStore } from '@/store/automixStore';
import { useState } from 'react';
import { Upload } from 'lucide-react';

/**
 * Design: Automix Studio - Premium Audio Mixer
 * - Dark charcoal background (#0a0a0a)
 * - Cyan (#00d9ff) and Magenta (#ff00ff) accents
 * - Neon glow effects and dashed borders
 * - Professional studio aesthetic
 */
export default function Home() {
  useAudioLoader();
  const { addTrack } = useAutomixStore();
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter((file) => file.type.startsWith('audio/'));

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
  };

  return (
    <div
      className="flex h-screen bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Hero Section */}
          <section className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-glow-cyan mb-2">
                Automix Studio
              </h1>
              <p className="text-lg text-muted-foreground">
                Premium automix for in-salon ambience
              </p>
            </div>
            <p className="text-xl text-foreground">
              Sculpt seamless energy with{' '}
              <span className="text-glow-cyan">cyan</span>
              <span className="text-muted-foreground"> → </span>
              <span className="text-glow-magenta">magenta</span> transitions.
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop audio files or use the sidebar to upload. Then play and export — all via Web Audio API.
            </p>
          </section>

          {/* Drag & Drop Zone */}
          {isDragActive && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-card border-2 border-dashed border-glow-cyan rounded-lg p-12 text-center space-y-4">
                <Upload size={48} className="text-glow-cyan mx-auto" />
                <div>
                  <p className="text-xl font-bold text-glow-cyan">Drop your audio files here</p>
                  <p className="text-sm text-muted-foreground mt-2">MP3, WAV, OGG, and other formats supported</p>
                </div>
              </div>
            </div>
          )}

          {/* Player Section */}
          <section>
            <Player />
          </section>

          {/* Tracks Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-glow-cyan">Playlist Library</h2>
            <p className="text-sm text-muted-foreground">
              Your curated sound — kept local for playback/export.
            </p>
            <TrackList />
          </section>

          {/* Tips Section */}
          <section className="bg-card border border-border rounded p-6 space-y-3">
            <h3 className="text-sm font-semibold text-glow-cyan flex items-center gap-2">
              💡 Tips
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Upload:</strong> Drag & drop audio files directly or use the sidebar button. They'll decode locally
                in your browser.
              </li>
              <li>
                <strong className="text-foreground">Timeline:</strong> Adjust Start Trim and End/Automix Point to
                control each track's duration and transition timing.
              </li>
              <li>
                <strong className="text-foreground">Playback:</strong> Hit Play to hear the mix with automatic
                crossfade. Use Repeat and Shuffle for variations.
              </li>
              <li>
                <strong className="text-foreground">Export:</strong> Download your mix as MP3 for
                use in your salon.
              </li>
              <li>
                <strong className="text-foreground">Organize:</strong> Drag tracks to reorder, click to select, Shift+Click for multiple selection.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
