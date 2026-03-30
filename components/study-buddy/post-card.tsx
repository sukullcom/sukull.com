import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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

export function PostCard({ post, currentUser, isOwnPost, onChatRequest, onEdit, onDelete }: PostCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* User Avatar */}
          <Image
            src={normalizeAvatarUrl(post.userAvatar)}
            width={48}
            height={48}
            alt="Avatar"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
          />

          {/* Post Content */}
          <div className="flex-1 min-w-0">
            {/* User Info & Time */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-0.5">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{post.userName}</h4>
                {post.userSchoolName && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {post.userSchoolName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {formatTimeAgo(post.created_at)}
              </div>
            </div>

            {/* Purpose Badge */}
            {post.purpose && (
              <Badge variant="secondary" className="mb-3">
                {post.purpose}
              </Badge>
            )}

            {/* Post Description */}
            <p className="text-gray-700 mb-4 leading-relaxed text-sm sm:text-base break-words">
              {post.reason}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {isOwnPost ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Düzenle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                    Sil
                  </Button>
                </>
              ) : (
                post.user_id !== currentUser?.id && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onChatRequest?.(post)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mesaj Gönder
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 