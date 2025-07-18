import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { DragDropChallenge } from "./drag-drop-challenge";
import { FillBlankChallenge } from "./fill-blank-challenge";
import { MatchPairsChallenge } from "./match-pairs-challenge";
import { SequenceChallenge } from "./sequence-challenge";
import { TimerChallenge } from "./timer-challenge";
import Image from "next/image";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  question?: string;
  questionImageSrc?: string | null | undefined; // Allow all possible values
  timeLimit?: number;
  onTimeUp?: () => void;
};

export const Challenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  type,
  question,
  questionImageSrc,
  timeLimit,
  onTimeUp,
}: Props) => {
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

  // Function to render the appropriate challenge component
  const renderChallengeContent = () => {
    switch (type) {
      case "DRAG_DROP":
        return (
          <DragDropChallenge
            options={options}
            onSelect={onSelect}
            status={status}
            selectedOption={selectedOption}
            disabled={disabled}
            type={type}
            questionImageSrc={questionImageSrc} // Pass questionImageSrc
          />
        );

      case "FILL_BLANK":
        return (
          <FillBlankChallenge
            options={options}
            onSelect={onSelect}
            status={status}
            selectedOption={selectedOption}
            disabled={disabled}
            type={type}
            question={question || ""}
            questionImageSrc={questionImageSrc} // Pass questionImageSrc
          />
        );

      case "MATCH_PAIRS":
        return (
          <MatchPairsChallenge
            options={options}
            onSelect={onSelect}
            status={status}
            selectedOption={selectedOption}
            disabled={disabled}
            type={type}
            questionImageSrc={questionImageSrc} // Pass questionImageSrc
          />
        );

      case "SEQUENCE":
        return (
          <SequenceChallenge
            options={options}
            onSelect={onSelect}
            status={status}
            selectedOption={selectedOption}
            disabled={disabled}
            type={type}
            questionImageSrc={questionImageSrc} // Pass questionImageSrc
          />
        );

      case "TIMER_CHALLENGE":
        // Timer challenge wraps another challenge type with time limit
        // The actual challenge type should be stored in metadata
        return (
          <TimerChallenge
            timeLimit={timeLimit || 60}
            onTimeUp={onTimeUp || (() => {})}
            disabled={disabled}
            status={status}
            questionImageSrc={questionImageSrc} // Pass questionImageSrc
          >
            {/* Default to SELECT if no specific type is provided */}
            <div
              className={cn(
                "grid gap-2",
                "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
              )}
            >
              {options.map((option) => (
                <Card
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  imageSrc={option.imageSrc}
                  selected={selectedOption === option.id}
                  onClick={() => onSelect(option.id)}
                  status={status}
                  audioSrc={option.audioSrc}
                  disabled={disabled}
                  type={type}
                />
              ))}
            </div>
          </TimerChallenge>
        );

      case "SELECT":
      case "ASSIST":
      default:
        // Original challenge types
        return (
          <div className="space-y-6">
            {renderQuestionImage()}
            <div
              className={cn(
                "grid gap-2",
                type === "ASSIST" && "grid-cols-1",
                type === "SELECT" &&
                  "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
              )}
            >
              {options.map((option) => (
                <Card
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  imageSrc={option.imageSrc}
                  selected={selectedOption === option.id}
                  onClick={() => onSelect(option.id)}
                  status={status}
                  audioSrc={option.audioSrc}
                  disabled={disabled}
                  type={type}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  // If there's a time limit but it's not a TIMER_CHALLENGE type, wrap with timer
  if (timeLimit && type !== "TIMER_CHALLENGE") {
    return (
      <TimerChallenge
        timeLimit={timeLimit}
        onTimeUp={onTimeUp || (() => {})}
        disabled={disabled}
        status={status}
        questionImageSrc={questionImageSrc} // Pass questionImageSrc
      >
        {renderChallengeContent()}
      </TimerChallenge>
    );
  }

  return renderChallengeContent();
};
