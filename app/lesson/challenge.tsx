import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { DragDropChallenge } from "./drag-drop-challenge";
import { FillBlankChallenge } from "./fill-blank-challenge";
import { MatchPairsChallenge } from "./match-pairs-challenge";
import { SequenceChallenge } from "./sequence-challenge";
import { TimerChallenge, withTimer } from "./timer-challenge";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  question?: string;
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
  timeLimit,
  onTimeUp,
}: Props) => {
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
          >
            {/* Default to SELECT if no specific type is provided */}
            <div
              className={cn(
                "grid gap-2",
                "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
              )}
            >
              {options.map((option, i) => (
                <Card
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  imageSrc={option.imageSrc}
                  shortcut={`${i + 1}`}
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
    <div
      className={cn(
        "grid gap-2",
        type === "ASSIST" && "grid-cols-1",
        type === "SELECT" &&
          "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
      )}
    >
      {options.map((option, i) => (
        <Card
          key={option.id}
          id={option.id}
          text={option.text}
          imageSrc={option.imageSrc}
          shortcut={`${i + 1}`}
          selected={selectedOption === option.id}
          onClick={() => onSelect(option.id)}
          status={status}
          audioSrc={option.audioSrc}
          disabled={disabled}
          type={type}
        />
      ))}
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
      >
        {renderChallengeContent()}
      </TimerChallenge>
    );
  }

  return renderChallengeContent();
};
