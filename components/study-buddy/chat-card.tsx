import React from "react";
import Image from "next/image";
import { normalizeAvatarUrl } from "@/utils/avatar";

interface ChatCardProps {
  chat: {
    id: number;
    participants: string[];
    last_message: string;
    last_updated: string;
    participantsData?: {
      [key: string]: {
        userName: string;
        avatarUrl: string;
      };
    };
  };
  currentUser: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
      email?: string;
      avatar?: string;
      schoolId?: number;
      profileComplete?: boolean;
      [key: string]: unknown;
    };
  } | null;
  onClick: () => void;
  isSelected: boolean;
}

export function ChatCard({ chat, currentUser, onClick, isSelected }: ChatCardProps) {
  const otherParticipantId = chat.participants.find(p => p !== currentUser?.id);
  const otherParticipantData = otherParticipantId && chat.participantsData?.[otherParticipantId];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } else {
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit"
      });
    }
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-green-50 ring-1 ring-green-300"
          : "hover:bg-gray-50"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <Image
        src={normalizeAvatarUrl(typeof otherParticipantData === 'object' ? otherParticipantData?.avatarUrl : '')}
        width={40}
        height={40}
        alt="Avatar"
        className="rounded-full object-cover w-9 h-9 sm:w-10 sm:h-10 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {typeof otherParticipantData === 'object' && otherParticipantData?.userName || "Kullanıcı"}
          </h4>
          <span className="text-[10px] text-gray-400 shrink-0">
            {formatTime(chat.last_updated)}
          </span>
        </div>
        {chat.last_message && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {chat.last_message}
          </p>
        )}
      </div>
    </div>
  );
}
