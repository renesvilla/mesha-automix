import { create } from 'zustand';

export interface Track {
  id: string;
  name: string;
  file: File;
  audioBuffer?: AudioBuffer;
  duration: number;
  isLoaded: boolean;
}

export interface AutomixState {
  tracks: Track[];
  startTrim: number;
  endPoint: number;
  crossfadeDuration: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  currentTrackIndex: number;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  selectedTrackIds: Set<string>;

  // Track management
  addTracks: (files: File[]) => void;
  removeTrack: (id: string) => void;
  clearTracks: () => void;
  setTrackAudioBuffer: (id: string, buffer: AudioBuffer) => void;
  setTrackLoaded: (id: string, isLoaded: boolean) => void;

  // Timeline controls
  setStartTrim: (value: number) => void;
  setEndPoint: (value: number) => void;
  setCrossfadeDuration: (value: number) => void;

  // Playback controls
  setIsPlaying: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  updateTotalDuration: () => void;
  setCurrentTrackIndex: (index: number) => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  setShuffle: (value: boolean) => void;

  // Track selection
  toggleTrackSelection: (id: string) => void;
  selectAllTracks: () => void;
  clearSelection: () => void;
  deleteSelectedTracks: () => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAutomixStore = create<AutomixState>((set, get) => ({
  tracks: [],
  startTrim: 0,
  endPoint: 180,
  crossfadeDuration: 5,
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  currentTrackIndex: 0,
  repeatMode: 'off',
  isShuffle: false,
  selectedTrackIds: new Set(),

  addTracks: (files: File[]) => {
    const newTracks: Track[] = files.map((file) => ({
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      file,
      duration: 0,
      isLoaded: false,
    }));

    set((state) => ({
      tracks: [...state.tracks, ...newTracks],
    }));

    get().updateTotalDuration();
  },

  removeTrack: (id: string) => {
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== id),
    }));
    get().updateTotalDuration();
  },

  clearTracks: () => {
    set({ tracks: [], currentTime: 0, currentTrackIndex: 0, selectedTrackIds: new Set() });
    get().updateTotalDuration();
  },

  setTrackAudioBuffer: (id: string, buffer: AudioBuffer) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id
          ? { ...track, audioBuffer: buffer, duration: buffer.duration }
          : track
      ),
    }));
    get().updateTotalDuration();
  },

  setTrackLoaded: (id: string, isLoaded: boolean) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, isLoaded } : track
      ),
    }));
  },

  setStartTrim: (value: number) => {
    set({ startTrim: Math.max(0, value) });
    get().updateTotalDuration();
  },

  setEndPoint: (value: number) => {
    set({ endPoint: Math.max(0, value) });
    get().updateTotalDuration();
  },

  setCrossfadeDuration: (value: number) => {
    set({ crossfadeDuration: Math.max(0, value) });
  },

  setIsPlaying: (value: boolean) => {
    set({ isPlaying: value });
  },

  setCurrentTime: (value: number) => {
    set({ currentTime: Math.max(0, value) });
  },

  updateTotalDuration: () => {
    const state = get();
    const trackDuration = state.endPoint - state.startTrim;
    const totalDuration = trackDuration * state.tracks.length;
    set({ totalDuration: Math.max(0, totalDuration) });
  },

  setCurrentTrackIndex: (index: number) => {
    set({ currentTrackIndex: Math.max(0, Math.min(index, get().tracks.length - 1)) });
  },

  setRepeatMode: (mode: 'off' | 'all' | 'one') => {
    set({ repeatMode: mode });
  },

  setShuffle: (value: boolean) => {
    set({ isShuffle: value });
  },

  toggleTrackSelection: (id: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedTrackIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedTrackIds: newSelection };
    });
  },

  selectAllTracks: () => {
    set((state) => ({
      selectedTrackIds: new Set(state.tracks.map((t) => t.id)),
    }));
  },

  clearSelection: () => {
    set({ selectedTrackIds: new Set() });
  },

  deleteSelectedTracks: () => {
    set((state) => ({
      tracks: state.tracks.filter((t) => !state.selectedTrackIds.has(t.id)),
      selectedTrackIds: new Set(),
    }));
    get().updateTotalDuration();
  },

  reorderTracks: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newTracks = [...state.tracks];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      return { tracks: newTracks };
    });
  },
}));
