"use client";

import { Eye, Plus, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { useState, useEffect } from "react";

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
  icon: "🚪",
  visible: false,
  children: [
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
  const [activeApiLayers, setActiveApiLayers] = useState<LayerGroup[]>([]);

  const toggleLayerVisibility = (layerId: string) => {
    setActiveApiLayers(prev => {
      return prev.map(group => {
        if (group.id === layerId) {
          return {
            ...group,
            visible: !group.visible
          };
        }
        return group;
      });
    });
  };

  const handleApiToggle = (apiId: string, enabled: boolean) => {
    if (apiId === "doors-windows") {
      setActiveApiLayers(enabled ? [doorsWindowsLayers] : []);
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
          <Eye 
            className={cn(
              "h-4 w-4 transition-all",
              group.visible ? (isDarkMode ? "text-orange-400" : "text-orange-500") : "text-zinc-400",
              "group-hover:text-orange-500 dark:group-hover:text-orange-400"
            )} 
            onClick={() => toggleLayerVisibility(group.id)} 
          />
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
