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
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Image
            src={normalizeAvatarUrl(post.userAvatar)}
            width={48}
            height={48}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />

          {/* Post Content */}
          <div className="flex-1 min-w-0">
            {/* User Info & Time */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{post.userName}</h4>
                {post.userSchoolName && (
                  <p className="text-sm text-muted-foreground">
                    {post.userSchoolName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
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
            <p className="text-gray-700 mb-4 leading-relaxed">
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