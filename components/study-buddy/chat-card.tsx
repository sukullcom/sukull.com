import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? "bg-gray-50 border-green-500" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Image
            src={normalizeAvatarUrl(otherParticipantData?.avatarUrl)}
            width={40}
            height={40}
            alt="Avatar"
            className="rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {otherParticipantData?.userName || "Kullanıcı"}
            </h4>
            {chat.last_message && (
              <p className="text-sm text-muted-foreground truncate">
                {chat.last_message}
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTime(chat.last_updated)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 