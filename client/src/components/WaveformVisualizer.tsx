/**
 * Componente de visualização de waveform estilizado
 * Mostra representação visual das faixas de áudio
 */

export default function WaveformVisualizer() {
  // Gera waveform abstrato com padrão neon
  const generateWaveform = () => {
    const bars = Array.from({ length: 40 }, () => Math.random() * 100);
    return bars;
  };

  const waveform = generateWaveform();

  return (
    <div className="flex items-center justify-center gap-1 h-12 bg-gradient-neon-dark rounded-lg p-3 border border-cyan-400/20">
      {waveform.map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-neon rounded-sm transition-all duration-300 hover:shadow-lg"
          style={{
            height: `${height}%`,
            opacity: 0.6 + (height / 100) * 0.4,
          }}
        />
      ))}
    </div>
  );
}
