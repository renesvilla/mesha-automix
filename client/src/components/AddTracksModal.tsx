import { useAutomixStore } from '@/store/automixStore';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface AddTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTracksModal({ isOpen, onClose }: AddTracksModalProps) {
  const { addTracks } = useAutomixStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAll = () => {
    if (selectedFiles.length > 0) {
      addTracks(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-glow-cyan">Add tracks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select multiple audio files. We decode locally with Web Audio to detect duration — the salon-ready mix
              stays premium and private.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-foreground" />
          </button>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
              color: '#0a0a0a',
            }}
          >
            <Upload size={20} />
            Choose files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFiles.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleAddAll}
                className="ml-auto px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 transition-colors font-semibold"
              >
                Add all
              </button>
            </>
          )}
        </div>



        {/* Files List */}
        <div className="space-y-3">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="bg-muted border border-border rounded-lg p-4 flex items-center gap-4 hover:border-cyan-400/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{file.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {file.type || 'audio/mpeg'} • {formatFileSize(file.size)}
                </p>
              </div>

              <button
                onClick={() => handleRemoveFile(index)}
                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
              >
                <X size={18} />
              </button>
            </div>
          ))}

          {selectedFiles.length === 0 && (
            <div className="text-center py-12">
              <Upload size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No files selected yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Choose files" to get started</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          {selectedFiles.length > 0 && (
            <button
              onClick={handleAddAll}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%)',
                color: '#0a0a0a',
              }}
            >
              <Plus size={18} />
              Add {selectedFiles.length} track{selectedFiles.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
