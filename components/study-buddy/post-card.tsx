import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Edit, Trash } from "lucide-react";
import Image from "next/image";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { formatTimeAgo } from "@/utils/time-format";

interface PostCardProps {
  post: {
    id: number;
    user_id: string;
    purpose: string;
    reason: string;
    created_at: string;
    userName?: string;
    userSchoolName?: string;
    userAvatar?: string;
  };
  currentUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  isOwnPost?: boolean;
  onChatRequest?: (post: PostCardProps['post']) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PURPOSE_COLORS: Record<string, string> = {
  "YKS Sınavı": "bg-red-100 text-red-700",
  "TUS Sınavı": "bg-purple-100 text-purple-700",
  "ALES Sınavı": "bg-orange-100 text-orange-700",
  "KPSS Sınavı": "bg-blue-100 text-blue-700",
  "LGS Sınavı": "bg-pink-100 text-pink-700",
  "Üniversite Vizeleri": "bg-indigo-100 text-indigo-700",
  "Kitap Okuma": "bg-emerald-100 text-emerald-700",
  "Yazılım Öğrenme": "bg-cyan-100 text-cyan-700",
  "Tez Çalışması": "bg-amber-100 text-amber-700",
  "Yüksek Lisans Çalışması": "bg-violet-100 text-violet-700",
  "Lise Okul Sınavı": "bg-teal-100 text-teal-700",
  "Diğer": "bg-gray-100 text-gray-700",
};

export function PostCard({ post, currentUser, isOwnPost, onChatRequest, onEdit, onDelete }: PostCardProps) {
  const badgeColor = PURPOSE_COLORS[post.purpose] || "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <Image
          src={normalizeAvatarUrl(post.userAvatar)}
          width={44}
          height={44}
          alt="Avatar"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {post.userName}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(post.created_at)}
            </span>
          </div>

          {post.userSchoolName && (
            <p className="text-xs text-gray-400 mb-2 truncate">{post.userSchoolName}</p>
          )}

          {post.purpose && (
            <Badge className={`mb-2.5 text-xs font-medium border-0 ${badgeColor}`}>
              {post.purpose}
            </Badge>
          )}

          <p className="text-gray-700 text-sm leading-relaxed break-words">
            {post.reason}
          </p>

          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            {isOwnPost ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-xs h-8"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-3.5 w-3.5 mr-1.5" />
                  Sil
                </Button>
              </>
            ) : (
              post.user_id !== currentUser?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onChatRequest?.(post)}
                  className="text-xs h-8"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  Mesaj Gönder
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
