"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Image from "next/image";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  questionImageSrc?: string | null | undefined; // Add question image support
};

type SequenceItem = {
  id: number;
  text: string;
  imageSrc?: string | null;
  audioSrc?: string | null;
  correctOrder: number;
  currentPosition: number;
};

export const SequenceChallenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  questionImageSrc, // Add questionImageSrc prop
}: Props) => {
  const [items, setItems] = useState<SequenceItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<SequenceItem[]>([]);

  // Initialize sequence items from options
  useEffect(() => {
    const sequenceItems: SequenceItem[] = [];
    
    options.forEach((option, index) => {
      if (option.correctOrder !== null && option.correctOrder !== undefined) {
        sequenceItems.push({
          id: option.id,
          text: option.text,
          imageSrc: option.imageSrc,
          audioSrc: option.audioSrc,
          correctOrder: option.correctOrder,
          currentPosition: index,
        });
      }
    });

    // Sort by correct order to establish the original sequence
    sequenceItems.sort((a, b) => a.correctOrder - b.correctOrder);
    
    // Shuffle the items for the challenge
    const shuffled = [...sequenceItems].sort(() => Math.random() - 0.5);
    
    // Update current positions
    const shuffledWithPositions = shuffled.map((item, index) => ({
      ...item,
      currentPosition: index,
    }));

    setItems(sequenceItems);
    setOrderedItems(shuffledWithPositions);
  }, [options]);

  // Reset component state when status changes to "none" (for practice mode and next challenge)
  useEffect(() => {
    if (status === "none" && selectedOption === undefined) {
      // Re-shuffle the items when resetting
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      const shuffledWithPositions = shuffled.map((item, index) => ({
        ...item,
        currentPosition: index,
      }));
      setOrderedItems(shuffledWithPositions);
    }
  }, [status, selectedOption, items]);

  // Function to check sequence correctness and select appropriate option
  const checkSequenceAndSelect = (items: SequenceItem[]) => {
    const isCorrect = items.every((item, index) => 
      item.correctOrder === index + 1
    );

    if (isCorrect) {
      // Sequence is correct - select correct option
      const correctOption = options.find(opt => opt.correct);
      if (correctOption) {
        setTimeout(() => onSelect(correctOption.id), 300);
      }
    } else {
      // Sequence is wrong - select wrong option to enable Check button
      const wrongOption = options.find(opt => !opt.correct);
      if (wrongOption) {
        setTimeout(() => onSelect(wrongOption.id), 300);
      }
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || disabled) return;

    const newItems = Array.from(orderedItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      currentPosition: index,
    }));

    setOrderedItems(updatedItems);

    // Check the sequence after every change and enable Check button
    checkSequenceAndSelect(updatedItems);
  };

  const getItemStatus = (item: SequenceItem, index: number) => {
    if (status === "none") return "none";
    
    const isCorrectPosition = item.correctOrder === index + 1;
    return isCorrectPosition ? "correct" : "wrong";
  };

  // Fallback UI when drag and drop is not available
  const handleMoveUp = (index: number) => {
    if (index === 0 || disabled) return;
    
    const newItems = [...orderedItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      currentPosition: idx,
    }));
    
    setOrderedItems(updatedItems);
    
    // Check the sequence after move and enable Check button
    checkSequenceAndSelect(updatedItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedItems.length - 1 || disabled) return;
    
    const newItems = [...orderedItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      currentPosition: idx,
    }));
    
    setOrderedItems(updatedItems);
    
    // Check the sequence after move and enable Check button
    checkSequenceAndSelect(updatedItems);
  };

  // Function to render question image if it exists
  const renderQuestionImage = () => {
    if (!questionImageSrc) return null;
    
    return (
      <div className="mb-4 flex justify-center">
        <div className="relative max-w-sm w-full aspect-square">
          <Image
            src={questionImageSrc}
            alt="Challenge question image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {renderQuestionImage()}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Put the items in the correct order
          </h3>
          <p className="text-sm text-gray-600">
            Drag and drop or use buttons to reorder the items
          </p>
        </div>

        <Droppable droppableId="sequence">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {orderedItems.map((item, index) => {
                const itemStatus = getItemStatus(item, index);
                
                return (
                  <Draggable
                    key={item.id}
                    draggableId={item.id.toString()}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center p-4 rounded-lg border-2 transition-all",
                          "bg-white shadow-sm",
                          snapshot.isDragging && "shadow-lg rotate-1",
                          itemStatus === "correct" && "border-green-300 bg-green-50",
                          itemStatus === "wrong" && "border-rose-300 bg-rose-50",
                          itemStatus === "none" && "border-gray-300",
                          disabled && "opacity-50"
                        )}
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className={cn(
                            "mr-3 cursor-grab active:cursor-grabbing",
                            "flex flex-col space-y-1",
                            disabled && "cursor-not-allowed"
                          )}
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>

                        {/* Position indicator */}
                        <div className="mr-3 flex-shrink-0">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            "text-sm font-bold",
                            itemStatus === "correct" && "bg-green-100 text-green-700",
                            itemStatus === "wrong" && "bg-rose-100 text-rose-700",
                            itemStatus === "none" && "bg-gray-100 text-gray-700"
                          )}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Item content */}
                        <div className="flex-1 flex items-center">
                          {item.imageSrc && (
                            <div className="relative w-20 h-20 mr-3 flex-shrink-0">
                              <Image 
                                src={item.imageSrc} 
                                alt={item.text || "Sequence item"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain"
                              />
                            </div>
                          )}
                          {item.text && (
                            <div className="font-medium text-gray-800">
                              {item.text}
                            </div>
                          )}
                        </div>

                        {/* Move buttons (fallback for non-drag devices) */}
                        <div className="flex flex-col space-y-1 ml-3">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={disabled || index === 0}
                            className={cn(
                              "w-6 h-6 rounded border text-xs font-bold",
                              "hover:bg-gray-100 disabled:opacity-30",
                              "disabled:cursor-not-allowed"
                            )}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={disabled || index === orderedItems.length - 1}
                            className={cn(
                              "w-6 h-6 rounded border text-xs font-bold",
                              "hover:bg-gray-100 disabled:opacity-30",
                              "disabled:cursor-not-allowed"
                            )}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}; 