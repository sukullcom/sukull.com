"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Image from "next/image";
import { MathRenderer } from "@/components/ui/math-renderer";
import { READY_TO_CHECK } from "./answer-signals";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  questionImageSrc?: string | null | undefined;
};

export type SequenceChallengeHandle = {
  isOrderCorrect: () => boolean;
};

type SequenceItem = {
  id: number;
  text: string;
  imageSrc?: string | null;
  audioSrc?: string | null;
  correctOrder: number;
  currentPosition: number;
};

export const SequenceChallenge = forwardRef<SequenceChallengeHandle | null, Props>(
  function SequenceChallenge(
    { options, onSelect, status, selectedOption, disabled, questionImageSrc },
    ref,
  ) {
    const [items, setItems] = useState<SequenceItem[]>([]);
    const [orderedItems, setOrderedItems] = useState<SequenceItem[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        isOrderCorrect: () =>
          orderedItems.length > 0 &&
          orderedItems.every((item, index) => item.correctOrder === index + 1),
      }),
      [orderedItems],
    );

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

      sequenceItems.sort((a, b) => a.correctOrder - b.correctOrder);
      const shuffled = [...sequenceItems].sort(() => Math.random() - 0.5);
      const shuffledWithPositions = shuffled.map((item, index) => ({
        ...item,
        currentPosition: index,
      }));

      setItems(sequenceItems);
      setOrderedItems(shuffledWithPositions);
    }, [options]);

    useEffect(() => {
      if (status === "none" && selectedOption === undefined) {
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        const shuffledWithPositions = shuffled.map((item, index) => ({
          ...item,
          currentPosition: index,
        }));
        setOrderedItems(shuffledWithPositions);
      }
    }, [status, selectedOption, items]);

  /**
   * Kullanıcı "Kontrol et"e basabilsin diye — sıra hatalı olsa bile
   * her düzenlemede hazır sinyali gönderiyoruz; doğruluk quiz onContinue'da.
   */
    useEffect(() => {
      if (status !== "none" || orderedItems.length === 0) return;
      onSelect(READY_TO_CHECK);
      // `onSelect` is stable for user intent; avoid re-running on parent rebinds
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, orderedItems]);

    const handleDragEnd = (result: DropResult) => {
      if (!result.destination || disabled) return;

      const newItems = Array.from(orderedItems);
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        currentPosition: index,
      }));

      setOrderedItems(updatedItems);
    };

    const getItemStatus = (item: SequenceItem, index: number) => {
      if (status === "none") return "none";
      const isCorrectPosition = item.correctOrder === index + 1;
      return isCorrectPosition ? "correct" : "wrong";
    };

    const handleMoveUp = (index: number) => {
      if (index === 0 || disabled) return;
      const newItems = [...orderedItems];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      const updatedItems = newItems.map((item, idx) => ({
        ...item,
        currentPosition: idx,
      }));
      setOrderedItems(updatedItems);
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
    };

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
            <h3 className="text-lg font-medium text-gray-700 mb-2">Öğeleri doğru sıraya koy</h3>
            <p className="text-sm text-gray-600">Sürekle-bırak veya okları kullan, sonra alttan Kontrol et</p>
          </div>

          <Droppable droppableId="sequence">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
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
                            "flex items-center p-6 rounded-lg border-2 transition-all",
                            "bg-white shadow-sm",
                            snapshot.isDragging && "shadow-lg rotate-1",
                            itemStatus === "correct" && "border-green-300 bg-green-50",
                            itemStatus === "wrong" && "border-rose-300 bg-rose-50",
                            itemStatus === "none" && "border-gray-300",
                            disabled && "opacity-50",
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className={cn(
                              "mr-4 cursor-grab active:cursor-grabbing",
                              "flex flex-col space-y-1",
                              disabled && "cursor-not-allowed",
                            )}
                          >
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          </div>

                          <div className="mr-4 flex-shrink-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                "text-base font-bold",
                                itemStatus === "correct" && "bg-green-100 text-green-700",
                                itemStatus === "wrong" && "bg-rose-100 text-rose-700",
                                itemStatus === "none" && "bg-gray-100 text-gray-700",
                              )}
                            >
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 flex items-center">
                            {item.imageSrc && (
                              <div className="relative w-28 h-28 mr-4 flex-shrink-0">
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
                              <div className="font-medium text-gray-800 text-base">
                                <MathRenderer>{item.text}</MathRenderer>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-1 ml-4">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(index)}
                              disabled={disabled || index === 0}
                              className={cn(
                                "w-8 h-8 rounded border text-sm font-bold",
                                "hover:bg-gray-100 disabled:opacity-30",
                                "disabled:cursor-not-allowed",
                              )}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(index)}
                              disabled={disabled || index === orderedItems.length - 1}
                              className={cn(
                                "w-8 h-8 rounded border text-sm font-bold",
                                "hover:bg-gray-100 disabled:opacity-30",
                                "disabled:cursor-not-allowed",
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
  },
);
