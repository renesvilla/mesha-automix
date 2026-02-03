import Sidebar from '@/components/Sidebar';
import TrackList from '@/components/TrackList';
import Player from '@/components/Player';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import { useAudioLoader } from '@/hooks/useAudioLoader';

/**
 * Design: Minimalismo Neon Futurista
 * - Fundo charcoal escuro (#0a0e27)
 * - Acentos cyan (#00d9ff) e magenta (#ff00ff)
 * - Sidebar esquerda com controles
 * - Main area com lista de faixas e player
 * - Efeitos de glow em elementos interativos
 */
export default function Home() {
  // Carrega arquivos de áudio quando adicionados
  useAudioLoader();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-8 py-6">
          <h1 className="text-3xl font-bold text-glow-cyan mb-1">Automix Engine</h1>
          <p className="text-sm text-muted-foreground">
            Mixagem automática de música com crossfade inteligente
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Waveform Visualizer */}
            <section>
              <WaveformVisualizer />
            </section>

            {/* Player Section */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Controles</h2>
              <Player />
            </section>

            {/* Track List Section */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Faixas Carregadas</h2>
              <div className="max-h-96 overflow-y-auto">
                <TrackList />
              </div>
            </section>

            {/* Info Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Como funciona</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-cyan-400">1. Upload</p>
                  <p>
                    Selecione múltiplos arquivos de áudio (MP3, WAV, OGG, etc.) na barra lateral.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-cyan-400">2. Configurar Timeline</p>
                  <p>
                    Ajuste os sliders "Start Trim" e "End/Automix Point" para definir o intervalo de
                    reprodução de cada faixa.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground" style={{ color: '#ff00ff' }}>3. Reproduzir</p>
                  <p>
                    Clique em "Play" para ouvir o mix. As faixas serão reproduzidas em sequência com
                    crossfade automático de 5 segundos.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground" style={{ color: '#ff00ff' }}>4. Exportar</p>
                  <p>
                    Clique em "Download" para exportar o mix completo em formato WAV de alta qualidade.
                  </p>
                </div>
              </div>
            </section>

            {/* Technical Info */}
            <section className="bg-gradient-neon-dark border border-cyan-400/30 rounded-lg p-6 space-y-3 text-xs text-muted-foreground">
              <h3 className="font-semibold text-foreground text-cyan-400">Tecnologia</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-foreground">Web Audio API:</span> Processamento de áudio em
                  tempo real no navegador
                </li>
                <li>
                  <span className="text-foreground">OfflineAudioContext:</span> Renderização rápida
                  do mix sem latência
                </li>
                <li>
                  <span className="text-foreground">Crossfade Linear:</span> Transição suave de 5
                  segundos entre faixas
                </li>
                <li>
                  <span className="text-foreground">Exportação WAV:</span> Formato de áudio
                  não-comprimido de alta qualidade
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
