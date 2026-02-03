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
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;

  // Track management
  addTracks: (files: File[]) => void;
  removeTrack: (id: string) => void;
  clearTracks: () => void;
  setTrackAudioBuffer: (id: string, buffer: AudioBuffer) => void;
  setTrackLoaded: (id: string, isLoaded: boolean) => void;

  // Timeline controls
  setStartTrim: (value: number) => void;
  setEndPoint: (value: number) => void;

  // Playback controls
  setIsPlaying: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  updateTotalDuration: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAutomixStore = create<AutomixState>((set, get) => ({
  tracks: [],
  startTrim: 0,
  endPoint: 180,
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,

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
    set({ tracks: [], currentTime: 0 });
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
}));
