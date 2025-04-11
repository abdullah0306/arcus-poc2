"use client";

import { Eye, Plus, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { useCanvasStore } from "@/store/canvas-store";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetCanvasProject } from "@/features/projects/api/use-get-canvas-project";
import { usePDFPageStore } from "@/store/pdf-page-store";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: 'group' | 'layer';
}

interface LayerGroup {
  id: string;
  title: string;
  icon: string;
  visible: boolean;
  children: Layer[];
}

const doorsWindowsLayers: LayerGroup = {
  id: "doors-windows",
  title: "Doors and Windows",
  icon: "",
  visible: false,
  children: [
    {
      id: "single-doors",
      name: "Single Doors",
      visible: true,
      locked: false,
      type: 'layer'
    },
    {
      id: "double-doors",
      name: "Double Doors",
      visible: true,
      locked: false,
      type: 'layer'
    },
    {
      id: "windows",
      name: "Windows",
      visible: true,
      locked: false,
      type: 'layer'
    }
  ]
};

interface ApiToggleEvent extends CustomEvent {
  detail: {
    apiId: string;
    enabled: boolean;
  };
}

interface WallsColorToggleEvent extends CustomEvent {
  detail: {
    enabled: boolean;
    currentPage: number;
  };
}

// Define walls color layer
const wallsColorLayer: Layer = {
  id: "walls_color",
  name: "Walls Color",
  visible: false,
  locked: false,
  type: 'layer'
};

export default function LeftPanel() {
  const { isDarkMode } = useThemeStore();
  const { setLayerVisibility, layers } = useCanvasStore(); 
  const [activeApiLayers, setActiveApiLayers] = useState<LayerGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLayerId, setProcessingLayerId] = useState<string | null>(null);
  const [showWallsColorLayer, setShowWallsColorLayer] = useState(false);
  const [wallsColorVisible, setWallsColorVisible] = useState(false);
  const [layerStates, setLayerStates] = useState({
    "single-doors": false,
    "double-doors": false,
    "windows": false
  });
  const { projectId } = useParams();
  const { data: project } = useGetCanvasProject(projectId as string);
  const { currentPage } = usePDFPageStore();

  useEffect(() => {
    if (project?.canvasData) {
      const hasDetectionResults = 
        project.canvasData.complete_doors_and_windows?.length > 0 ||
        project.canvasData.single_doors?.length > 0 ||
        project.canvasData.double_doors?.length > 0 ||
        project.canvasData.windows?.length > 0;

      // Check for walls color data
      const hasWallsColorData = project.canvasData.walls_color?.length > 0 && 
        project.canvasData.walls_color[currentPage] !== null;

      // Update walls color layer visibility state
      setShowWallsColorLayer(hasWallsColorData);

      if (hasDetectionResults) {
        setActiveApiLayers([doorsWindowsLayers]);
        // Initialize all sub-layers as visible when detection results exist
        setLayerStates({
          "single-doors": true,
          "double-doors": true,
          "windows": true
        });
      } else {
        setActiveApiLayers([]);
        setLayerStates({
          "single-doors": false,
          "double-doors": false,
          "windows": false
        });
      }
    }
  }, [project]);

  const getLayerArrayKey = (states: typeof layerStates) => {
    const { "single-doors": single, "double-doors": double, "windows": windows } = states;
    
    // All layers visible - show complete detection
    if (single && double && windows) {
      return "complete_doors_and_windows";
    }
    
    // Two layers visible
    if (single && double && !windows) {
      return "single_doors_and_double_doors";
    }
    if (single && !double && windows) {
      return "single_doors_and_windows";
    }
    if (!single && double && windows) {
      return "double_doors_and_windows";
    }
    
    // Single layer visible
    if (single && !double && !windows) {
      return "single_doors";
    }
    if (!single && double && !windows) {
      return "double_doors";
    }
    if (!single && !double && windows) {
      return "windows";
    }
    
    // No layers visible - show original pages
    return "pages";
  };

  const toggleLayerVisibility = async (layerId: string) => {
    if (layerId === "doors-windows") {
      // Toggle main group visibility
      const newMainVisible = !activeApiLayers.find(g => g.id === "doors-windows")?.visible;
      
      // Update all sub-layer states
      const newStates = {
        "single-doors": newMainVisible,
        "double-doors": newMainVisible,
        "windows": newMainVisible
      };
      setLayerStates(newStates);
      
      setActiveApiLayers(prev => {
        return prev.map(group => {
          if (group.id === "doors-windows") {
            return {
              ...group,
              visible: newMainVisible,
              children: group.children.map(child => ({
                ...child,
                visible: newMainVisible
              }))
            };
          }
          return group;
        });
      });

      // Make sure walls color is turned off when doors-windows is turned on
      if (newMainVisible) {
        setWallsColorVisible(false);
      }

      setIsProcessing(true);
      setProcessingLayerId("doors-windows");
      try {
        const arrayKey = newMainVisible ? "complete_doors_and_windows" : "pages";
        const response = await fetch(`/api/canvas/layer-visibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            layerId: arrayKey,
            visible: true,
            currentPage
          })
        });

        const data = await response.json();
        
        if (data.success) {
          // Update canvas store layer visibility
          useCanvasStore.getState().setLayerVisibility('complete_doors_and_windows', newMainVisible);
          useCanvasStore.getState().setLayerVisibility('walls_color', false);
          
          window.dispatchEvent(new CustomEvent('layerVisibilityChanged', {
            detail: {
              imageUrl: data.imageUrl,
              layerId: arrayKey,
              visible: true
            }
          }));
        }
      } catch (error) {
        console.error('Error updating layer visibility:', error);
      } finally {
        setIsProcessing(false);
        setProcessingLayerId(null);
      }
    } else {
      // Handle sub-layer toggle
      const newStates = {
        ...layerStates,
        [layerId]: !layerStates[layerId as keyof typeof layerStates]
      };
      setLayerStates(newStates);

      // Update layer group visibility in UI
      setActiveApiLayers(prev => {
        return prev.map(group => {
          if (group.id === "doors-windows") {
            return {
              ...group,
              children: group.children.map(child => ({
                ...child,
                visible: newStates[child.id as keyof typeof layerStates]
              }))
            };
          }
          return group;
        });
      });

      setIsProcessing(true);
      setProcessingLayerId(layerId);
      try {
        const arrayKey = getLayerArrayKey(newStates);
        
        // Turn off walls color when toggling doors-windows sub-layers
        setWallsColorVisible(false);
        
        const response = await fetch(`/api/canvas/layer-visibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            layerId: arrayKey,
            visible: true,
            currentPage
          })
        });

        const data = await response.json();
        
        if (data.success) {
          // Update canvas store layer visibility
          // First, reset all layer visibility
          useCanvasStore.getState().setLayerVisibility('single_doors', false);
          useCanvasStore.getState().setLayerVisibility('double_doors', false);
          useCanvasStore.getState().setLayerVisibility('windows', false);
          useCanvasStore.getState().setLayerVisibility('single_doors_and_windows', false);
          useCanvasStore.getState().setLayerVisibility('single_doors_and_double_doors', false);
          useCanvasStore.getState().setLayerVisibility('double_doors_and_windows', false);
          useCanvasStore.getState().setLayerVisibility('complete_doors_and_windows', false);
          useCanvasStore.getState().setLayerVisibility('walls_color', false);
          
          // Then set the active layer
          useCanvasStore.getState().setLayerVisibility(arrayKey, true);
          
          window.dispatchEvent(new CustomEvent('layerVisibilityChanged', {
            detail: {
              imageUrl: data.imageUrl,
              layerId: arrayKey,
              visible: true
            }
          }));
        }
      } catch (error) {
        console.error('Error updating layer visibility:', error);
      } finally {
        setIsProcessing(false);
        setProcessingLayerId(null);
      }
    }
  };

  const handleApiToggle = (apiId: string, enabled: boolean) => {
    if (apiId === "doors-windows") {
      setActiveApiLayers(enabled ? [doorsWindowsLayers] : []);
      
      // Set all sub-layers visibility state
      const newStates = {
        "single-doors": enabled,
        "double-doors": enabled,
        "windows": enabled
      };
      setLayerStates(newStates);
    } else if (apiId === "walls-detection") {
      // This will be handled by the wallsColorToggle event
    }
  };

  // Handle walls color toggle
  const toggleWallsColorVisibility = async () => {
    const newVisible = !wallsColorVisible;
    setWallsColorVisible(newVisible);
    
    // Turn off doors-windows layer when walls color is turned on
    if (newVisible) {
      // Update doors-windows visibility in UI
      setActiveApiLayers(prev => {
        return prev.map(group => {
          if (group.id === "doors-windows") {
            return {
              ...group,
              visible: false,
              children: group.children.map(child => ({
                ...child,
                visible: false
              }))
            };
          }
          return group;
        });
      });
      
      // Update layer states
      setLayerStates({
        "single-doors": false,
        "double-doors": false,
        "windows": false
      });
    }
    
    setProcessingLayerId("walls_color");
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/canvas/layer-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          layerId: newVisible ? "walls_color" : "pages",
          visible: true,
          currentPage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update canvas store layer visibility
        useCanvasStore.getState().setLayerVisibility('walls_color', newVisible);
        useCanvasStore.getState().setLayerVisibility('complete_doors_and_windows', false);
        
        window.dispatchEvent(new CustomEvent('layerVisibilityChanged', {
          detail: {
            imageUrl: data.imageUrl,
            layerId: newVisible ? "walls_color" : "pages",
            visible: true
          }
        }));
      }
    } catch (error) {
      console.error('Error updating walls color visibility:', error);
    } finally {
      setIsProcessing(false);
      setProcessingLayerId(null);
    }
  };

  useEffect(() => {
    const handleAPIToggle = (event: Event) => {
      const customEvent = event as ApiToggleEvent;
      handleApiToggle(customEvent.detail.apiId, customEvent.detail.enabled);
    };

    const handleWallsColorToggle = (event: Event) => {
      const customEvent = event as WallsColorToggleEvent;
      if (customEvent.detail.enabled) {
        setShowWallsColorLayer(true);
      }
    };

    window.addEventListener("apiToggle", handleAPIToggle as EventListener);
    window.addEventListener("wallsColorToggle", handleWallsColorToggle as EventListener);
    
    return () => {
      window.removeEventListener("apiToggle", handleAPIToggle as EventListener);
      window.removeEventListener("wallsColorToggle", handleWallsColorToggle as EventListener);
    };
  }, []);

  const renderLayer = (layer: Layer, isDarkMode: boolean) => (
    <div 
      key={layer.id} 
      className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
    >
      <div className="flex items-center space-x-2">
        <Eye 
          className={cn(
            "h-4 w-4 transition-all",
            layer.visible ? (isDarkMode ? "text-orange-400" : "text-orange-500") : "text-zinc-400",
            "group-hover:text-orange-500 dark:group-hover:text-orange-400"
          )} 
          onClick={() => toggleLayerVisibility(layer.id)} 
        />
        <span className={cn(
          "text-sm",
          isDarkMode ? "text-zinc-300" : "text-zinc-700"
        )}>{layer.name}</span>
      </div>
    </div>
  );

  const renderLayerGroup = (group: LayerGroup, isDarkMode: boolean) => (
    <div key={group.id} className="space-y-1">
      <div className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
        <div className="flex items-center space-x-2">
          {isProcessing && processingLayerId === group.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye 
              className={cn(
                "h-4 w-4 transition-all",
                group.visible ? (isDarkMode ? "text-orange-400" : "text-orange-500") : "text-zinc-400",
                "group-hover:text-orange-500 dark:group-hover:text-orange-400"
              )} 
              onClick={() => toggleLayerVisibility(group.id)} 
            />
          )}
          <span className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-zinc-300" : "text-zinc-700"
          )}>{group.title}</span>
        </div>
      </div>
      {group.visible && (
        <div className="pl-4 space-y-1">
          {group.children.map(child => renderLayer(child, isDarkMode))}
        </div>
      )}
    </div>
  );

  // Render the walls color layer
  const renderWallsColorLayer = (isDarkMode: boolean) => (
    <div className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
      <div className="flex items-center space-x-2">
        {isProcessing && processingLayerId === "walls_color" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye 
            className={cn(
              "h-4 w-4 transition-all",
              wallsColorVisible ? (isDarkMode ? "text-orange-400" : "text-orange-500") : "text-zinc-400",
              "group-hover:text-orange-500 dark:group-hover:text-orange-400"
            )} 
            onClick={toggleWallsColorVisibility} 
          />
        )}
        <span className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-zinc-300" : "text-zinc-700"
        )}>Walls Color</span>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "w-[300px] border-r transition-colors flex flex-col h-[calc(100vh-48px)]", 
      isDarkMode ? "border-zinc-800" : "border-zinc-200"
    )}>
      <div className="p-2 border-b" style={{ borderColor: isDarkMode ? "#1f2937" : "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Square className={cn(
              "h-2 w-2 rounded-full",
              isDarkMode ? "bg-orange-500" : "bg-orange-500"
            )} />
            <h2 className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-orange-100" : "text-zinc-900"
            )}>Layers</h2>
          </div>
          <Plus className={cn(
            "h-4 w-4",
            isDarkMode ? "text-orange-400" : "text-orange-500"
          )} />
        </div>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto flex-grow"> 
        {activeApiLayers.map(group => renderLayerGroup(group, isDarkMode))}
        {showWallsColorLayer && renderWallsColorLayer(isDarkMode)}
      </div>
    </div>
  );
}
