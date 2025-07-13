"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
};

type DragItem = {
  id: number;
  text: string;
  imageSrc?: string | null;
  audioSrc?: string | null;
  dragData: Record<string, unknown>;
};

type DropZone = {
  id: string;
  label: string;
  correctItemId?: number;
  currentItemId?: number;
};

export const DragDropChallenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
}: Props) => {
  const [dragItems, setDragItems] = useState<DragItem[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Initialize drag items and drop zones from options
  useEffect(() => {
    const items: DragItem[] = [];
    const zones: DropZone[] = [];

    options.forEach((option) => {
      if (option.dragData) {
        try {
          const dragData = JSON.parse(option.dragData);
          
          if (dragData.type === "item") {
            items.push({
              id: option.id,
              text: option.text,
              imageSrc: option.imageSrc,
              audioSrc: option.audioSrc,
              dragData,
            });
          } else if (dragData.type === "zone") {
            zones.push({
              id: dragData.zoneId,
              label: option.text,
              correctItemId: dragData.correctItemId,
            });
          }
        } catch {
          console.error("Failed to parse drag data");
        }
      }
    });

    setDragItems(items);
    setDropZones(zones);
  }, [options]);

  // Reset component state when status changes to "none" (for practice mode and next challenge)
  useEffect(() => {
    if (status === "none" && selectedOption === undefined) {
      // Reset all internal state
      setDraggedItem(null);
      
      // Reset drop zones to clear any placed items
      setDropZones(prev => prev.map(zone => ({
        ...zone,
        currentItemId: undefined
      })));
    }
  }, [status, selectedOption]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: number) => {
    if (disabled) return;
    setDraggedItem(itemId);
    e.dataTransfer.setData("text/plain", itemId.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    if (disabled) return;

    const itemId = parseInt(e.dataTransfer.getData("text/plain"));
    
    // Calculate the updated zones after this drop
    const updatedZones = dropZones.map((zone) => {
      if (zone.id === zoneId) {
        return { ...zone, currentItemId: itemId };
      }
      // Remove item from other zones if it was already placed
      if (zone.currentItemId === itemId) {
        return { ...zone, currentItemId: undefined };
      }
      return zone;
    });

    // Update drop zones state
    setDropZones(updatedZones);
    setDraggedItem(null);

    // Check if all zones are now filled (after this drop)
    const allZonesFilled = updatedZones.every(zone => zone.currentItemId !== undefined);

    if (allZonesFilled) {
      // Check if all placements are CORRECT (not just filled)
      const allCorrect = updatedZones.every(zone => {
        if (!zone.currentItemId || !zone.correctItemId) {
          return false;
        }
        
        // Find the placed item and get its itemId from dragData
        const placedItem = dragItems.find(item => item.id === zone.currentItemId);
        
        if (!placedItem?.dragData) {
          return false;
        }
        
        try {
          // dragData is already parsed in initialization, no need to parse again
          const dragData = placedItem.dragData as { itemId: number };
          return dragData.itemId === zone.correctItemId;
        } catch {
          return false;
        }
      });
      
      // Only select the correct option if ALL placements are correct
      if (allCorrect) {
        const correctOption = options.find(opt => opt.correct);
        if (correctOption) {
          onSelect(correctOption.id);
        }
      } else {
        // If placements are wrong, select a wrong option to enable Check button
        const wrongOption = options.find(opt => !opt.correct);
        if (wrongOption) {
          onSelect(wrongOption.id);
        }
      }
    }
  };

  const getItemInZone = (zoneId: string) => {
    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone?.currentItemId) return null;
    return dragItems.find(item => item.id === zone.currentItemId);
  };

  const isItemPlaced = (itemId: number) => {
    return dropZones.some(zone => zone.currentItemId === itemId);
  };

  return (
    <div className="space-y-6">
      {/* Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dropZones.map((zone) => {
          const placedItem = getItemInZone(zone.id);
          
          // Check if placement is correct by comparing itemId from dragData
          let isCorrect = false;
          let isWrong = false;
          
          if (status !== "none" && placedItem && zone.correctItemId) {
            try {
              // dragData is already parsed in initialization
              const dragData = placedItem.dragData as { itemId: number };
              isCorrect = dragData.itemId === zone.correctItemId;
              isWrong = dragData.itemId !== zone.correctItemId;
            } catch {
              isWrong = true;
            }
          }

          return (
            <div
              key={zone.id}
              className={cn(
                "min-h-[120px] border-2 border-dashed rounded-xl p-4 transition-all",
                "flex flex-col items-center justify-center",
                draggedItem && "border-blue-300 bg-blue-50",
                isCorrect && "border-green-300 bg-green-100",
                isWrong && "border-rose-300 bg-rose-100",
                !placedItem && "border-gray-300"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, zone.id)}
            >
              <div className="text-sm font-medium text-gray-600 mb-2">
                {zone.label}
              </div>
              
              {placedItem ? (
                <div
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-move",
                    isCorrect && "border-green-300 bg-green-50",
                    isWrong && "border-rose-300 bg-rose-50",
                    status === "none" && "border-blue-300 bg-blue-50"
                  )}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, placedItem.id)}
                >
                  {placedItem.imageSrc && (
                    <Image 
                      src={placedItem.imageSrc} 
                      alt={placedItem.text}
                      width={64}
                      height={64}
                      className="object-contain mx-auto mb-2"
                    />
                  )}
                  <div className="text-center text-sm font-medium">
                    {placedItem.text}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center">
                  Drop item here
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draggable Items */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Drag items to correct positions:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dragItems
            .filter(item => !isItemPlaced(item.id))
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-3 rounded-lg border-2 cursor-move transition-all",
                  "hover:shadow-md active:scale-95",
                  "border-gray-300 bg-white",
                  draggedItem === item.id && "opacity-50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                {item.imageSrc && (
                  <Image 
                    src={item.imageSrc} 
                    alt={item.text}
                    width={48}
                    height={48}
                    className="object-contain mx-auto mb-2"
                  />
                )}
                <div className="text-center text-sm font-medium">
                  {item.text}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}; 