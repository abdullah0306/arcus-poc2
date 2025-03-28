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
      id: "complete_doors_and_windows",
      name: "Complete Doors and Windows",
      visible: true,
      locked: false,
      type: 'layer'
    },
    {
      id: "single-door",
      name: "Single Doors",
      visible: true,
      locked: false,
      type: 'layer'
    },
    {
      id: "double-door",
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

export default function LeftPanel() {
  const { isDarkMode } = useThemeStore();
  const { setLayerVisibility, layers } = useCanvasStore(); 
  const [activeApiLayers, setActiveApiLayers] = useState<LayerGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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

      if (hasDetectionResults) {
        setActiveApiLayers([doorsWindowsLayers]);
        // Set the complete_doors_and_windows layer to visible by default
        setLayerVisibility('complete_doors_and_windows', true);
      } else {
        setActiveApiLayers([]);
        // Set the complete_doors_and_windows layer to hidden
        setLayerVisibility('complete_doors_and_windows', false);
      }
    }
  }, [project]);

  const toggleLayerVisibility = async (layerId: string) => {
    setActiveApiLayers(prev => {
      return prev.map(group => {
        if (group.id === "doors-windows") {
          return {
            ...group,
            visible: !group.visible
          };
        }
        return group;
      });
    });

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/canvas/layer-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          layerId: "complete_doors_and_windows", 
          visible: !activeApiLayers.find(g => g.id === "doors-windows")?.visible,
          currentPage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the canvas store with the new visibility state
        setLayerVisibility("complete_doors_and_windows", data.visible);
        
        // Emit an event to update the canvas image
        window.dispatchEvent(new CustomEvent('layerVisibilityChanged', {
          detail: {
            imageUrl: data.imageUrl,
            layerId: data.layerId,
            visible: data.visible
          }
        }));
      }
    } catch (error) {
      console.error('Error updating layer visibility:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApiToggle = (apiId: string, enabled: boolean) => {
    if (apiId === "doors-windows") {
      setActiveApiLayers(enabled ? [doorsWindowsLayers] : []);
      
      setLayerVisibility('complete_doors_and_windows', enabled);
    }
  };

  useEffect(() => {
    const handleAPIToggle = (event: Event) => {
      const customEvent = event as ApiToggleEvent;
      handleApiToggle(customEvent.detail.apiId, customEvent.detail.enabled);
    };

    window.addEventListener("apiToggle", handleAPIToggle as EventListener);
    return () => window.removeEventListener("apiToggle", handleAPIToggle as EventListener);
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
          {isProcessing && group.id === "doors-windows" ? (
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
      </div>
    </div>
  );
}
