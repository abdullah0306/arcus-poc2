import { create } from 'zustand';
import { fabric } from 'fabric';

interface CanvasStore {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),
}));
