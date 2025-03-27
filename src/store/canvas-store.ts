import { create } from 'zustand';
import { fabric } from 'fabric';
import { CanvasData } from '@/types/canvas';

interface CanvasStore {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  currentLayer: string;
  setCurrentLayer: (layer: string) => void;
  layers: {
    [key: string]: boolean;
  };
  setLayerVisibility: (layer: string, visible: boolean) => void;
  getActiveLayer: (currentPage: number, canvasData: CanvasData) => string;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvas: null,
  currentLayer: 'pages',
  layers: {
    pages: true,
    complete_doors_and_windows: false,
    single_doors: false,
    double_doors: false,
    windows: false,
    single_doors_and_windows: false,
    single_doors_and_double_doors: false,
    double_doors_and_windows: false
  },
  setCanvas: (canvas) => set({ canvas }),
  setCurrentLayer: (layer) => set({ currentLayer: layer }),
  setLayerVisibility: (layer, visible) => set((state) => ({
    layers: {
      ...state.layers,
      [layer]: visible
    }
  })),
  getActiveLayer: (currentPage: number, canvasData: CanvasData) => {
    const layers = ['single_doors', 'double_doors', 'windows'] as const;
    type LayerType = typeof layers[number];
    
    const subLayers = {
      'single_doors': 'single_doors_and_double_doors',
      'double_doors': 'single_doors_and_windows',
      'windows': 'double_doors_and_windows'
    } as const;

    console.log('Checking layers for page:', currentPage);
    console.log('Layer data:', {
      single_doors: canvasData.single_doors?.[currentPage],
      double_doors: canvasData.double_doors?.[currentPage],
      windows: canvasData.windows?.[currentPage],
      complete_doors_and_windows: canvasData.complete_doors_and_windows?.[currentPage]
    });

    // Check if all sub-layers are visible
    const allSubLayersVisible = layers.every(layer => {
      const layerData = canvasData[layer];
      const isVisible = Array.isArray(layerData) && 
             layerData[currentPage] !== undefined && 
             layerData[currentPage] !== '';
      console.log(`Layer ${layer} visibility:`, isVisible);
      return isVisible;
    });

    // If all sub-layers are visible, return complete_doors_and_windows
    if (allSubLayersVisible) {
      console.log('All layers visible, showing complete_doors_and_windows');
      return 'complete_doors_and_windows';
    }

    // Check sub-layers combinations
    for (const layer of layers) {
      const layerData = canvasData[layer];
      const isVisible = Array.isArray(layerData) && 
             layerData[currentPage] !== undefined && 
             layerData[currentPage] !== '';
      
      if (!isVisible) continue;
      
      console.log(`Layer ${layer} is visible`);
      
      const otherLayers = layers.filter(l => l !== layer);
      const visibleCount = otherLayers.filter(l => {
        const otherLayerData = canvasData[l];
        const isVisible = Array.isArray(otherLayerData) && 
               otherLayerData[currentPage] !== undefined && 
               otherLayerData[currentPage] !== '';
        console.log(`Layer ${l} visibility:`, isVisible);
        return isVisible;
      }).length;

      if (visibleCount === 0) {
        console.log(`Only ${layer} is visible, showing its image`);
        return layer;
      } else if (visibleCount === 1) {
        console.log(`Two layers visible (${layer} and one other), showing ${subLayers[layer as LayerType]}`);
        return subLayers[layer as LayerType];
      }
    }

    // If no layers are visible or no valid combination found
    console.log('No valid layer combination found, showing pages array image');
    return 'pages';
  }
}));
