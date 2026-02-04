import Sidebar from '@/components/Sidebar';
import TrackList from '@/components/TrackList';
import Player from '@/components/Player';
import { useAudioLoader } from '@/hooks/useAudioLoader';

/**
 * Design: Automix Studio - Premium Audio Mixer
 * - Dark charcoal background (#0a0a0a)
 * - Cyan (#00d9ff) and Magenta (#ff00ff) accents
 * - Neon glow effects and dashed borders
 * - Professional studio aesthetic
 */
export default function Home() {
  useAudioLoader();

  return (
    <div className="flex h-screen bg-background">
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
              Upload tracks, set BPM, tune timeline sliders, then play and export — all via Web Audio API.
            </p>
          </section>

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
                <strong className="text-foreground">Upload:</strong> Add multiple audio files. They'll decode locally
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
                <strong className="text-foreground">Export:</strong> Download your mix as MP3 (or WAV fallback) for
                use in your salon.
              </li>
              <li>
                <strong className="text-foreground">Unlock audio with a click:</strong> (display policy)
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
