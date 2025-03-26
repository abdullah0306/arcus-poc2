"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface APIOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
  progress: number;
  details: string[];
}

interface SubOption {
  id: string;
  title: string;
  description: string;
  enabled?: boolean;
}

interface APISection {
  id: string;
  title: string;
  options: SubOption[];
}

const apiOptions: APIOption[] = [
  {
    id: "doors-windows",
    title: "Doors and Windows Detection",
    description: "Automatically identifies and labels all doors and windows, including their dimensions and types.",
    enabled: false,
    icon: "🚪",
    progress: 0,
    details: [
      "Entry doors and emergency exits",
      "Window types and sizes",
      "Opening directions"
    ]
  },
  {
    id: "room-detection",
    title: "Room Detection",
    description: "Advanced room recognition with automatic labeling and area calculations.",
    enabled: false,
    icon: "🏠",
    progress: 0,
    details: [
      "Room type identification",
      "Area measurements",
      "Space optimization"
    ]
  },
  {
    id: "walls-detection",
    title: "Walls Detection",
    description: "Precise wall detection with thickness measurement and material analysis.",
    enabled: false,
    icon: "🧱",
    progress: 0,
    details: [
      "Wall thickness",
      "Material type",
      "Load-bearing analysis"
    ]
  },
  {
    id: "fire-alarm",
    title: "Fire Alarm Detection",
    description: "Comprehensive fire safety system detection and compliance checking.",
    enabled: false,
    icon: "🚨",
    progress: 0,
    details: [
      "Alarm placement verification",
      "Coverage analysis",
      "Emergency route planning"
    ]
  }
];

const doorWindowSection: APISection = {
  id: "door-window",
  title: "Door and window detection",
  options: [
    {
      id: "highlight-door",
      title: "Highlight a door",
      description: "Find and highlight one door on your plan"
    },
    {
      id: "highlight-window",
      title: "Highlight a window",
      description: "Find and highlight one window on your plan"
    },
    {
      id: "detect-remaining",
      title: "Detect remaining doors and windows",
      description: "Use AI to find all remaining objects"
    },
    {
      id: "confirm-exits",
      title: "Confirm fire exits",
      description: "Ensure all fire exits are marked correctly"
    }
  ]
};

export default function RightPanel() {
  const { projectId } = useParams();
  const { isDarkMode } = useThemeStore();
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [options, setOptions] = useState<APIOption[]>(apiOptions);

  const handleDoorsWindowsDetection = async (enabled: boolean) => {
    if (!enabled || !projectId) {
      console.log('Detection not enabled or no project ID');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      console.log('Starting doors and windows detection...');

      // Get the current canvas image
      const response = await fetch(`/api/canvas-projects/${projectId}`);
      console.log('Fetched canvas project');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const project = await response.json();
      console.log('Project data:', project);
      
      if (!project.canvasData?.pages?.[0]) {
        throw new Error("No image found in canvas");
      }

      console.log('Sending image to doors-windows detection API');
      // Send the image to doors-windows detection API
      const apiResponse = await fetch(`/api/canvas/doors-windows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          imageUrl: project.canvasData.pages[0]
        })
      });

      console.log('API response status:', apiResponse.status);
      
      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.statusText}`);
      }

      const result = await apiResponse.json();
      console.log('API response data:', result);
      
      if (result.success) {
        console.log("Cloudinary URL:", result.cloudinaryUrl);
        // In future, we'll use result.detectionResults
      } else {
        throw new Error(result.error || "Detection failed");
      }
    } catch (error) {
      console.error("Error in doors-windows detection:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      alert("Failed to process image: " + errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionToggle = async (optionId: string) => {
    try {
      const option = apiOptions.find(opt => opt.id === optionId);
      if (!option) return;

      const updatedOptions = apiOptions.map(opt => 
        opt.id === optionId 
          ? { ...opt, enabled: !opt.enabled }
          : opt
      );

      setOptions(updatedOptions);

      // Dispatch API toggle event
      const event = new CustomEvent("apiToggle", {
        detail: {
          apiId: optionId,
          enabled: !option.enabled
        }
      });
      window.dispatchEvent(event);

      // Your existing API call logic here
      if (optionId === "doors-windows") {
        // Your existing doors-windows API call logic
        handleDoorsWindowsDetection(true);
      }
    } catch (error) {
      console.error("Error toggling option:", error);
    }
  };

  return (
    <div className={cn(
      "w-[300px] border-l transition-colors flex flex-col h-[calc(100vh-48px)]", 
      isDarkMode 
        ? "bg-gradient-to-b from-zinc-900 to-zinc-950 border-orange-900/20" 
        : "bg-gradient-to-b from-zinc-100 to-zinc-200 border-orange-500/20"
    )}>
      <div className={cn(
        "p-3 border-b transition-colors flex-shrink-0", 
        isDarkMode 
          ? "border-orange-500/10 bg-black/20"
          : "border-orange-500/10 bg-zinc-50/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isDarkMode ? "bg-orange-500" : "bg-orange-500"
            )} />
            <h2 className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-orange-100" : "text-zinc-900"
            )}>Arcus AI</h2>
          </div>
          <span className={cn(
            "text-xs",
            isDarkMode ? "text-orange-400" : "text-orange-500"
          )}>
            Step 1 of 4
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto"> 
        <div className="p-4 space-y-4">
          {/* Detection Options */}
          <div className="space-y-3">
            {options.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "space-y-2 rounded-lg p-3 transition-colors",
                  expandedOption === option.id
                    ? isDarkMode 
                      ? "bg-orange-500/10" 
                      : "bg-orange-500/10"
                    : "hover:bg-orange-500/5"
                )}
                onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      isDarkMode ? "text-orange-100" : "text-zinc-900"
                    )}>
                      {option.title}
                    </span>
                  </div>
                  <Switch 
                    checked={option.enabled}
                    className={isDarkMode ? "bg-zinc-700" : "bg-orange-500"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionToggle(option.id);
                    }} 
                  />
                </div>
                <p className={cn(
                  "text-xs",
                  isDarkMode ? "text-orange-100/70" : "text-zinc-600"
                )}>
                  {option.description}
                </p>
                
                {/* Expanded Details */}
                {expandedOption === option.id && (
                  <div className="mt-3 space-y-2 pl-7">
                    {option.details.map((detail, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "text-xs flex items-center gap-2",
                          isDarkMode ? "text-orange-100/60" : "text-zinc-600"
                        )}
                      >
                        <div className="h-1 w-1 rounded-full bg-current" />
                        {detail}
                      </div>
                    ))}
                    
                    {/* Progress Bar */}
                    {option.enabled && (
                      <div className="mt-3">
                        <div className="h-1 bg-orange-200/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                            style={{ width: `${option.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Button - Fixed at bottom */}
      <div className="p-4 border-t flex-shrink-0"> 
        <Button
          onClick={() => handleDoorsWindowsDetection(true)}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Detect Doors & Windows"
          )}
        </Button>
      </div>
    </div>
  );
}
