"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { turkishToast } from "@/components/ui/custom-toaster";
import { createClient } from "@/utils/supabase/client";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PostCard } from "@/components/study-buddy/post-card";
import { ChatCard } from "@/components/study-buddy/chat-card";
import Image from "next/image";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { 
  checkStreakRequirement, 
  getStreakRequirementMessage,
  UserAchievements 
} from "@/utils/streak-requirements";
import { 
  Users, 
  MessageCircle, 
  Plus, 
  Filter,
  BookOpen,
  Send,
  Edit,
  AlertCircle,
  X,
  Lock,
  Sparkles,
  CircleCheck,
  Calendar,
  Heart,
  Target,
} from "lucide-react";
import { StudyBuddySchoolSelector } from "@/components/study-buddy-school-selector";

interface StudyBuddyPost {
  id: number;
  user_id: string;
  purpose: string;
  reason: string;
  created_at: string;
  school_id?: number;
  userName?: string;
  userAvatar?: string;
  userSchoolName?: string;
}

interface StudyBuddyChat {
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
}

interface StudyBuddyMessage {
  id: number;
  chat_id: number;
  sender: string;
  content: string;
  created_at: string;
}

interface UserMetadata {
  name?: string;
  email?: string;
  avatar?: string;
  schoolId?: number;
  profileComplete?: boolean;
  [key: string]: unknown;
}

const POSTS_PER_PAGE = 10;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Anti-spam and resource protection constants
const MESSAGE_LIMITS = {
  MAX_LENGTH: 200,
  MAX_PER_MINUTE: 10,
  MAX_PER_HOUR: 50,
  MAX_PER_DAY: 100,
  MIN_INTERVAL_MS: 2000,
  MAX_CONSECUTIVE_SAME: 3,
};

const POST_LIMITS = {
  MAX_REASON_LENGTH: 300,
  MAX_PER_MONTH: 1,
  MIN_INTERVAL_MS: 60000,
};

const CHAT_LIMITS = {
  MAX_NEW_CHATS_PER_DAY: 2,
  MAX_ACTIVE_CHATS: 5,
};

const warningMessages = {
  MESSAGE_LIMIT: "Mesajlar en fazla 200 karakter olabilir.",
  MONTHLY_MESSAGE_LIMIT: "Aylık 100 mesaj sınırına ulaştınız.",
  MONTHLY_POST_LIMIT: "Aylık 1 gönderi sınırına ulaştınız.",
  MONTHLY_CHAT_LIMIT: "Her ay en fazla 2 farklı kişiyle sohbet başlatabilirsiniz!",
  EMPTY_PURPOSE: "Lütfen bir çalışma amacı seçin.",
  EMPTY_REASON: "Lütfen açıklama ekleyin.",
  REASON_TOO_LONG: "Açıklama en fazla 300 karakter olabilir.",
  AUTHENTICATION_REQUIRED: "Bu işlemi gerçekleştirmek için giriş yapmalısınız.",
  CANNOT_MESSAGE_YOURSELF: "Kendinize mesaj gönderemezsiniz.",
  ERROR_CREATING_POST: "Gönderi oluşturulurken bir hata oluştu.",
  ERROR_CREATING_CHAT: "Sohbet oluşturulurken bir hata oluştu.",
  ERROR_SENDING_MESSAGE: "Mesaj gönderilirken bir hata oluştu.",
  ERROR_LOADING_POSTS: "Gönderiler yüklenirken bir hata oluştu.",
  ERROR_LOADING_CHATS: "Sohbetler yüklenirken bir hata oluştu.",
  MESSAGE_TOO_FREQUENT: "Çok hızlı mesaj gönderiyorsunuz. Lütfen 2 saniye bekleyin.",
  MESSAGE_RATE_LIMIT_MINUTE: "Dakikada en fazla 10 mesaj gönderebilirsiniz.",
  MESSAGE_RATE_LIMIT_HOUR: "Saatte en fazla 50 mesaj gönderebilirsiniz.",
  MESSAGE_RATE_LIMIT_DAY: "Günde en fazla 100 mesaj gönderebilirsiniz.",
  DUPLICATE_MESSAGE: "Aynı mesajı art arda çok fazla gönderiyorsunuz.",
  POST_TOO_FREQUENT: "Gönderiler arasında en az 1 dakika beklemelisiniz.",
  POST_MONTHLY_LIMIT: "Ayda en fazla 1 gönderi oluşturabilirsiniz.",
  TOO_MANY_ACTIVE_CHATS: "En fazla 5 aktif sohbetiniz olabilir.",
  DAILY_CHAT_LIMIT: "Günde en fazla 2 yeni sohbet başlatabilirsiniz.",
};

export default function StudyBuddyPage() {
  const supabase = createClient();

  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: UserMetadata;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [userAchievements, setUserAchievements] = useState<UserAchievements>({
    profileEditingUnlocked: false,
    studyBuddyUnlocked: false,
  });

  // Tabs
  const [activeTab, setActiveTab] = useState<"allPosts" | "myPosts" | "chats">("allPosts");

  // School filtering
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const PURPOSE_OPTIONS = useMemo(() => [
    "YKS Sınavı",
    "TUS Sınavı",
    "ALES Sınavı",
    "KPSS Sınavı",
    "LGS Sınavı",
    "Üniversite Vizeleri",
    "Kitap Okuma",
    "Yazılım Öğrenme",
    "Tez Çalışması",
    "Yüksek Lisans Çalışması",
    "Lise Okul Sınavı",
    "Diğer",
  ], []);
  
  const [filterPurpose, setFilterPurpose] = useState<string>("");

  // Posts
  const [allPostsRaw, setAllPostsRaw] = useState<StudyBuddyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showNewPostForm, setShowNewPostForm] = useState<boolean>(false);
  const [postPurpose, setPostPurpose] = useState<string>("");
  const [postReason, setPostReason] = useState<string>("");
  const [creationError, setCreationError] = useState<string>("");

  // My Posts
  const [myPosts, setMyPosts] = useState<StudyBuddyPost[]>([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState<boolean>(false);

  // Chats
  const [chats, setChats] = useState<StudyBuddyChat[]>([]);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [selectedChat, setSelectedChat] = useState<StudyBuddyChat | null>(null);
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Anti-spam tracking
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [lastPostTime, setLastPostTime] = useState<number>(0);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);
  const [messageCooldown, setMessageCooldown] = useState<number>(0);
  
  // For post editing
  const [editingPost, setEditingPost] = useState<StudyBuddyPost | null>(null);
  const [editPostPurpose, setEditPostPurpose] = useState<string>("");
  const [editPostReason, setEditPostReason] = useState<string>("");
  const [showEditPostForm, setShowEditPostForm] = useState<boolean>(false);
  
  
  const showWarning = useCallback((msg: string) => {
    turkishToast.warning(msg);
  }, []);

  // Helper function to fetch user streak data
  const fetchUserStreak = useCallback(async () => {
    try {
      const response = await fetch("/api/user/streak");
      const data = await response.json();
      
      if (response.ok && data.streak !== undefined) {
        setUserStreak(data.streak);
        
        // Update achievements data
        if (data.achievements) {
          setUserAchievements(data.achievements);
        }
        
        return data.streak;
      } else {
        setUserStreak(0);
        setUserAchievements({
          profileEditingUnlocked: false,
          studyBuddyUnlocked: false,
        });
        return 0;
      }
    } catch (error) {
      console.error("Study Buddy - Error fetching user streak:", error);
      setUserStreak(0);
      setUserAchievements({
        profileEditingUnlocked: false,
        studyBuddyUnlocked: false,
      });
      return 0;
    }
  }, []);

  // Auth effect
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        
        // If user is logged in, get their progress/streak data using server action
        if (session?.user) {
          await fetchUserStreak();
        }
        
        setLoadingUser(false);
      } catch (error) {
        console.error("Error loading session:", error);
        setLoadingUser(false);
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user: { id: string; email?: string; user_metadata?: UserMetadata } } | null) => {
        setCurrentUser(session?.user || null);
        
        // Also update streak when auth state changes using server action
        if (session?.user) {
          await fetchUserStreak();
        } else {
          setUserStreak(0);
        }
      }
    );
    
    return () => subscription?.unsubscribe();
  }, [supabase, fetchUserStreak]);

  // Helper functions for filtering and pagination
  const filteredPosts = useMemo(() => {
    let filtered = allPostsRaw;
    
    if (filterPurpose) {
      filtered = filtered.filter(post => post.purpose === filterPurpose);
    }
    
    if (selectedSchoolId) {
      filtered = filtered.filter(post => post.school_id === selectedSchoolId);
    }
    
    return filtered;
  }, [allPostsRaw, filterPurpose, selectedSchoolId]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const displayedPosts = filteredPosts.slice(
    currentPage * POSTS_PER_PAGE,
    (currentPage + 1) * POSTS_PER_PAGE
  );
  
  // Update total posts to reflect filtered count
  const totalFilteredPosts = filteredPosts.length;

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));

  // Anti-spam validation functions
  const validateMessageSpam = useCallback(async (message: string): Promise<boolean> => {
    if (!currentUser) return false;

    const now = Date.now();
    const trimmed = message.trim();
    

    // Check message length
    if (trimmed.length > MESSAGE_LIMITS.MAX_LENGTH) {
      showWarning(warningMessages.MESSAGE_LIMIT);
      return false;
    }

    // Check minimum interval between messages
    if (now - lastMessageTime < MESSAGE_LIMITS.MIN_INTERVAL_MS) {
      const remainingTime = Math.ceil((MESSAGE_LIMITS.MIN_INTERVAL_MS - (now - lastMessageTime)) / 1000);
      setMessageCooldown(remainingTime);
      showWarning(warningMessages.MESSAGE_TOO_FREQUENT);
      return false;
    }

    // Check for duplicate consecutive messages
    const lastThreeMessages = recentMessages.slice(-MESSAGE_LIMITS.MAX_CONSECUTIVE_SAME);
    const duplicateCount = lastThreeMessages.filter(msg => msg === trimmed).length;
    if (duplicateCount >= MESSAGE_LIMITS.MAX_CONSECUTIVE_SAME) {
      showWarning(warningMessages.DUPLICATE_MESSAGE);
      return false;
    }

    // Check rate limits from database
    const oneMinuteAgo = new Date(now - 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Check messages in last minute
      const { data: minuteMessages } = await supabase
        .from("study_buddy_messages")
        .select("id")
        .eq("sender", currentUser.id)
        .gt("created_at", oneMinuteAgo);

      if (minuteMessages && minuteMessages.length >= MESSAGE_LIMITS.MAX_PER_MINUTE) {
        showWarning(warningMessages.MESSAGE_RATE_LIMIT_MINUTE);
        return false;
      }

      // Check messages in last hour
      const { data: hourMessages } = await supabase
        .from("study_buddy_messages")
        .select("id")
        .eq("sender", currentUser.id)
        .gt("created_at", oneHourAgo);

      if (hourMessages && hourMessages.length >= MESSAGE_LIMITS.MAX_PER_HOUR) {
        showWarning(warningMessages.MESSAGE_RATE_LIMIT_HOUR);
        return false;
      }

      // Check messages in last day
      const { data: dayMessages } = await supabase
        .from("study_buddy_messages")
        .select("id")
        .eq("sender", currentUser.id)
        .gt("created_at", oneDayAgo);

      if (dayMessages && dayMessages.length >= MESSAGE_LIMITS.MAX_PER_DAY) {
        showWarning(warningMessages.MESSAGE_RATE_LIMIT_DAY);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking message limits:", error);
      return true; // Allow message if check fails
    }
  }, [currentUser, lastMessageTime, recentMessages, showWarning, supabase]);

  const validatePostSpam = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    const now = Date.now();

    // Check minimum interval between posts
    if (now - lastPostTime < POST_LIMITS.MIN_INTERVAL_MS) {
      const remainingTime = Math.ceil((POST_LIMITS.MIN_INTERVAL_MS - (now - lastPostTime)) / 1000);
      showWarning(`${warningMessages.POST_TOO_FREQUENT} (${remainingTime} saniye kaldı)`);
      return false;
    }

    // Check monthly post limit
    const oneMonthAgo = new Date(now - THIRTY_DAYS_IN_MS).toISOString();
    
    try {
      const { data: monthPosts } = await supabase
        .from("study_buddy_posts")
        .select("id")
        .eq("user_id", currentUser.id)
        .gt("created_at", oneMonthAgo);

      if (monthPosts && monthPosts.length >= POST_LIMITS.MAX_PER_MONTH) {
        showWarning(warningMessages.POST_MONTHLY_LIMIT);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking post limits:", error);
      return true; // Allow post if check fails
    }
  }, [currentUser, lastPostTime, showWarning, supabase]);

  const validateChatSpam = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Check active chats limit
      const { data: allChats } = await supabase
        .from("study_buddy_chats")
        .select("*");

      const userChats = allChats?.filter((chat: StudyBuddyChat) => 
        chat.participants.includes(currentUser.id)
      ) || [];

      if (userChats.length >= CHAT_LIMITS.MAX_ACTIVE_CHATS) {
        showWarning(warningMessages.TOO_MANY_ACTIVE_CHATS);
        return false;
      }

      // Check daily new chats limit
      const recentChats = userChats.filter((chat: StudyBuddyChat) => 
        chat.last_updated > oneDayAgo
      );

      if (recentChats.length >= CHAT_LIMITS.MAX_NEW_CHATS_PER_DAY) {
        showWarning(warningMessages.DAILY_CHAT_LIMIT);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking chat limits:", error);
      return true; // Allow chat if check fails
    }
  }, [currentUser, showWarning, supabase]);

  // Load all posts
  const loadAllPosts = useCallback(async () => {
    if (!currentUser) return;
    
    setLoadingPosts(true);
    
    try {
      // Keep loading until no old posts need to be deleted
      let hasOldPosts = true;
      
      while (hasOldPosts) {
      const from = currentPage * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from("study_buddy_posts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (filterPurpose) {
        query = query.eq("purpose", filterPurpose);
      }
      
      const { data: postsData, error: postsError } = await query;
      
      if (postsError) {
        console.error("Error loading posts:", postsError);
        turkishToast.error(warningMessages.ERROR_LOADING_POSTS);
        return;
      }

      // Check for posts older than 30 days and delete them
      const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_IN_MS).toISOString();
      const oldPosts = postsData.filter(
        (post: StudyBuddyPost) => post.created_at < thirtyDaysAgo && post.user_id === currentUser.id
      );
      
      if (oldPosts.length > 0) {
        for (const post of oldPosts) {
          await supabase
            .from("study_buddy_posts")
            .delete()
            .eq("id", post.id);
        }
        
        if (oldPosts.length === 1) {
          turkishToast.info("1 adet eski gönderiniz otomatik olarak silindi (30 gün limiti)");
        } else {
          turkishToast.info(`${oldPosts.length} adet eski gönderiniz otomatik olarak silindi (30 gün limiti)`);
        }
        
          // Continue the loop to check for more old posts
          continue;
      }
        
        // No old posts found, process the current data
        hasOldPosts = false;
      
      // Enrich posts with user data
      if (postsData && postsData.length > 0) {
        const userIds = Array.from(new Set(postsData.map((post: StudyBuddyPost) => post.user_id)));
        
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, avatar")
          .in("id", userIds);
          
        const userMap = (usersData || []).reduce((acc: Record<string, { id: string; name: string; avatar: string }>, user: { id: string; name: string; avatar: string }) => {
          acc[user.id] = user;
          return acc;
        }, {});
        
        const enrichedPosts = postsData.map((post: StudyBuddyPost) => {
          const user = userMap[post.user_id];
          
          return {
            ...post,
            userName: user?.name || "User",
            userAvatar: normalizeAvatarUrl(user?.avatar),
            userSchoolName: "" // Empty string since we don't have school data
          };
        });
        
        setAllPostsRaw(enrichedPosts);
      } else {
        setAllPostsRaw([]);
        }
      }
    } catch (error) {
      console.error("Error in loadAllPosts:", error);
      turkishToast.error(warningMessages.ERROR_LOADING_POSTS);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUser, filterPurpose, currentPage, supabase]);

  // Load my posts
  const loadMyPosts = useCallback(async () => {
    if (!currentUser) return;
    
    setLoadingMyPosts(true);
    
    try {
      const { data, error } = await supabase
        .from("study_buddy_posts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error("Error loading my posts:", error);
        turkishToast.error("Gönderileriniz yüklenirken bir hata oluştu.");
        return;
      }

      const enrichedPosts = await Promise.all(
        (data || []).map(async (post: StudyBuddyPost) => {
          let userSchoolName = "";
          
          if (post.school_id) {
            const { data: schoolData } = await supabase
              .from("schools")
              .select("name")
              .eq("id", post.school_id)
              .single();
            
            userSchoolName = schoolData?.name || "";
          }
          
          return {
            ...post,
            userName: currentUser.user_metadata?.name || "User",
            userAvatar: '/mascot_purple.svg', // Always use default mascot avatar
            userSchoolName,
          };
        })
      );
      
      setMyPosts(enrichedPosts);
    } catch (error) {
      console.error("Error in loadMyPosts:", error);
      turkishToast.error("Gönderileriniz yüklenirken bir hata oluştu.");
    } finally {
      setLoadingMyPosts(false);
    }
  }, [currentUser, supabase]);

  // Load chats
  const loadChats = useCallback(async () => {
      if (!currentUser) return;
      
    setLoadingChats(true);
      
      try {
        const { data, error } = await supabase
        .from("study_buddy_chats")
        .select("*")
          .order("last_updated", { ascending: false });

      if (error) {
        console.error("Error loading chats:", error);
        turkishToast.error(warningMessages.ERROR_LOADING_CHATS);
        return;
      }

      const userChats = (data || []).filter((chat: StudyBuddyChat) =>
          chat.participants.includes(currentUser.id)
      );

      // Enrich chats with participant data
      const enrichedChats = await Promise.all(
            userChats.map(async (chat: StudyBuddyChat) => {
          const participantsData: { [key: string]: { userName: string; avatarUrl: string } } = {};
          
          for (const participantId of chat.participants) {
            if (participantId !== currentUser.id) {
          const { data: userData } = await supabase
            .from("users")
            .select("name, avatar")
                .eq("id", participantId)
            .single();
              
              participantsData[participantId] = {
              userName: userData?.name || "User",
              avatarUrl: normalizeAvatarUrl(userData?.avatar),
              };
            }
          }
          
          return {
            ...chat,
            participantsData,
          };
        })
      );
      
      setChats(enrichedChats);
    } catch (error) {
      console.error("Error in loadChats:", error);
      turkishToast.error(warningMessages.ERROR_LOADING_CHATS);
      } finally {
        setLoadingChats(false);
      }
  }, [currentUser, supabase]);

  // Load messages for selected chat
  const loadMessages = useCallback(async () => {
    if (!selectedChat) return;
    
    try {
      const { data, error } = await supabase
        .from("study_buddy_messages")
        .select("*")
        .eq("chat_id", selectedChat.id)
        .order("created_at", { ascending: true });
  
      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error in loadMessages:", error);
    }
  }, [selectedChat, supabase]);

  // Implementations for placeholder functions
  const handleCreatePost = useCallback(async () => {
    if (!currentUser) {
      showWarning(warningMessages.AUTHENTICATION_REQUIRED);
      return;
    }

    // Check streak requirement for study buddy features
    if (!checkStreakRequirement(userStreak, "STUDY_BUDDY_FEATURES", userAchievements)) {
      const message = getStreakRequirementMessage("STUDY_BUDDY_FEATURES");
      turkishToast.error(message);
      return;
    }

    setCreationError("");

    if (!postPurpose.trim()) {
      setCreationError(warningMessages.EMPTY_PURPOSE);
      return;
    }

    if (!postReason.trim()) {
      setCreationError(warningMessages.EMPTY_REASON);
      return;
    }

    if (postReason.length > POST_LIMITS.MAX_REASON_LENGTH) {
      setCreationError(warningMessages.REASON_TOO_LONG);
      return;
    }

    const isValid = await validatePostSpam();
    if (!isValid) return;

    try {
      // Create the post object with only the existing fields
      const newPost = {
        user_id: currentUser.id,
        purpose: postPurpose.trim(),
        reason: postReason.trim(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("study_buddy_posts")
        .insert([newPost])
        .select();

    if (error) {
      console.error("Error creating post:", error);
        if (error.code === "23502") { // not_null_violation
          setCreationError("Zorunlu alanlar eksik. Lütfen tüm alanları doldurun.");
        } else if (error.code === "23514") { // check_violation
          setCreationError("Geçersiz değer girdiniz. Lütfen kontrol edin.");
    } else {
          setCreationError(warningMessages.ERROR_CREATING_POST);
        }
        return;
      }

      setPostPurpose("");
      setPostReason("");
      setShowNewPostForm(false);
      setLastPostTime(Date.now());
      
      turkishToast.success("Gönderi başarıyla oluşturuldu!");
      
      // Reload posts
      await loadAllPosts();
      await loadMyPosts();
    } catch (error) {
      console.error("Error in handleCreatePost:", error);
      setCreationError(warningMessages.ERROR_CREATING_POST);
    }
  }, [currentUser, postPurpose, postReason, validatePostSpam, showWarning, supabase, loadAllPosts, loadMyPosts, userStreak, userAchievements]);

  const handleEditPost = useCallback((post: StudyBuddyPost) => {
    setEditingPost(post);
    setEditPostPurpose(post.purpose);
    setEditPostReason(post.reason);
    setShowEditPostForm(true);
    setCreationError("");
  }, []);

  const handleOpenChat = useCallback(async (post: StudyBuddyPost) => {
    if (!currentUser) {
      showWarning(warningMessages.AUTHENTICATION_REQUIRED);
      return;
    }

    if (post.user_id === currentUser.id) {
      showWarning(warningMessages.CANNOT_MESSAGE_YOURSELF);
      return;
    }

    // Check streak requirement for study buddy features
    if (!checkStreakRequirement(userStreak, "STUDY_BUDDY_FEATURES", userAchievements)) {
      const message = getStreakRequirementMessage("STUDY_BUDDY_FEATURES");
      turkishToast.error(message);
      return;
    }

    const isValid = await validateChatSpam();
    if (!isValid) return;

    try {
      // Check if chat already exists
      const { data: existingChats } = await supabase
        .from("study_buddy_chats")
        .select("*");
      
      const existingChat = existingChats?.find((chat: StudyBuddyChat) =>
        chat.participants.includes(currentUser.id) &&
        chat.participants.includes(post.user_id) &&
        chat.participants.length === 2
      );

      if (existingChat) {
          setSelectedChat(existingChat);
        setActiveTab("chats");
        return;
      }

      // Create new chat
      const { error } = await supabase
        .from("study_buddy_chats")
        .insert({
          participants: [currentUser.id, post.user_id],
            last_message: "",
            last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating chat:", error);
        showWarning(warningMessages.ERROR_CREATING_CHAT);
        return;
      }

      setActiveTab("chats");
      await loadChats();
      
      turkishToast.success("Sohbet başlatıldı!");
    } catch (error) {
      console.error("Error in handleOpenChat:", error);
      showWarning(warningMessages.ERROR_CREATING_CHAT);
    }
  }, [currentUser, validateChatSpam, showWarning, supabase, loadChats, userStreak, userAchievements]);

  const handleSendMessage = useCallback(async () => {
    if (!currentUser || !selectedChat || !newMessage.trim()) return;

    // Check streak requirement for study buddy features
    if (!checkStreakRequirement(userStreak, "STUDY_BUDDY_FEATURES", userAchievements)) {
      const message = getStreakRequirementMessage("STUDY_BUDDY_FEATURES");
      turkishToast.error(message);
      return;
    }

    const isValid = await validateMessageSpam(newMessage);
    if (!isValid) return;
    
    try {
      const messageContent = newMessage.trim();
      const now = new Date().toISOString();

      // Send the message
      const { error: messageError } = await supabase
        .from("study_buddy_messages")
        .insert({
          chat_id: selectedChat.id,
          sender: currentUser.id,
          content: messageContent,
        });

      if (messageError) {
        console.error("Error sending message:", messageError);
        showWarning(warningMessages.ERROR_SENDING_MESSAGE);
            return;
          }

      // Update chat's last message
      const { error: chatError } = await supabase
        .from("study_buddy_chats")
        .update({
          last_message: messageContent,
          last_updated: now,
        })
        .eq("id", selectedChat.id);

      if (chatError) {
        console.error("Error updating chat:", chatError);
      }

      // Update local states
      setRecentMessages(prev => [...prev.slice(-MESSAGE_LIMITS.MAX_CONSECUTIVE_SAME), messageContent]);
      setLastMessageTime(Date.now());
      setNewMessage("");
      
      // Update local chat list without reloading
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => {
          if (chat.id === selectedChat.id) {
            return {
              ...chat,
              last_message: messageContent,
              last_updated: now
            };
          }
          return chat;
        });
        
        // Sort chats by last_updated
        return updatedChats.sort((a, b) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
      });

      // Load new messages
      await loadMessages();
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      showWarning(warningMessages.ERROR_SENDING_MESSAGE);
    }
  }, [currentUser, selectedChat, newMessage, validateMessageSpam, showWarning, supabase, loadMessages, userStreak, userAchievements]);

  const handleDeletePost = useCallback(async (postId: number) => {
    if (!currentUser) {
      showWarning(warningMessages.AUTHENTICATION_REQUIRED);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("study_buddy_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUser.id); // Extra security check

        if (error) {
        console.error("Error deleting post:", error);
        turkishToast.error("Gönderi silinirken bir hata oluştu.");
          return;
        }

      turkishToast.success("Gönderi başarıyla silindi!");
        
        // Reload posts
      await loadAllPosts();
      await loadMyPosts();
      } catch (error) {
      console.error("Error in handleDeletePost:", error);
      turkishToast.error("Gönderi silinirken bir hata oluştu.");
    }
  }, [currentUser, supabase, loadAllPosts, loadMyPosts, showWarning]);

  const handleSelectChat = useCallback(async (chat: StudyBuddyChat) => {
    setSelectedChat(chat);
    setMessages([]); // Clear messages first
    setNewMessage("");

    try {
      const { data, error } = await supabase
        .from("study_buddy_messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      // Set messages after a brief delay to ensure the chat container is rendered
      setTimeout(() => {
        setMessages(data || []);
        // Force an immediate scroll to bottom
        messageEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 0);
    } catch (error) {
      console.error("Error in handleSelectChat:", error);
    }
  }, [supabase]);

  // Add edit post functionality
  const handleEditSubmit = useCallback(async () => {
    if (!currentUser || !editingPost) {
      return;
    }

    setCreationError("");

    if (!editPostPurpose.trim()) {
      setCreationError(warningMessages.EMPTY_PURPOSE);
      return;
    }
    
    if (!editPostReason.trim()) {
      setCreationError(warningMessages.EMPTY_REASON);
      return;
    }
    
    if (editPostReason.length > POST_LIMITS.MAX_REASON_LENGTH) {
      setCreationError(warningMessages.REASON_TOO_LONG);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("study_buddy_posts")
        .update({
          purpose: editPostPurpose.trim(),
          reason: editPostReason.trim()
        })
        .eq("id", editingPost.id)
        .eq("user_id", currentUser.id); // Security check
      
      if (error) {
        console.error("Error updating post:", error);
        setCreationError("Gönderi güncellenirken bir hata oluştu.");
        return;
      }

        setEditingPost(null);
        setEditPostPurpose("");
        setEditPostReason("");
        setShowEditPostForm(false);
      
      turkishToast.success("Gönderi başarıyla güncellendi!");
        
        // Reload posts
      await loadAllPosts();
      await loadMyPosts();
    } catch (error) {
      console.error("Error in handleEditSubmit:", error);
      setCreationError("Gönderi güncellenirken bir hata oluştu.");
    }
  }, [currentUser, editingPost, editPostPurpose, editPostReason, supabase, loadAllPosts, loadMyPosts]);

  // Effect to load data when user or tab changes
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === "allPosts") {
        loadAllPosts();
    } else if (activeTab === "myPosts") {
        loadMyPosts();
    } else if (activeTab === "chats") {
      loadChats();
    }
  }, [currentUser, activeTab, loadAllPosts, loadMyPosts, loadChats]);

  // Effect to load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat, loadMessages]);

  // Effect for message cooldown
  useEffect(() => {
    if (messageCooldown > 0) {
      const timer = setTimeout(() => {
        setMessageCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messageCooldown]);

  // Modify the useEffect for message scrolling to be immediate
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" }); // Changed from "smooth" to "auto"
    }
  }, [messages]);

  // Loading states
  if (loadingUser) return <LoadingSpinner size="md" />;

  if (!currentUser) {
  return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Giriş Gerekli</h3>
            <p className="text-muted-foreground">Bu sayfayı görüntülemek için lütfen giriş yapın.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <StickyWrapper>
        <div className="space-y-4">
          <div className="border-2 border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="font-bold text-sm text-gray-700">Özet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gönderi</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold">
                {totalFilteredPosts}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Aktif Sohbet</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold">
                {chats.length}
              </Badge>
            </div>
            <Separator />
            <div className="text-xs text-gray-500 space-y-1">
              <p>Aylık gönderi: {POST_LIMITS.MAX_PER_MONTH}</p>
              <p>Günlük mesaj: {MESSAGE_LIMITS.MAX_PER_DAY}</p>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="font-bold text-sm text-gray-700">İpuçları</span>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><CircleCheck className="w-4 h-4 inline text-green-500 shrink-0" /> Belirli hedefler koyun</p>
              <p><Calendar className="w-4 h-4 inline text-blue-500 shrink-0" /> Düzenli çalışma programları oluşturun</p>
              <p><Heart className="w-4 h-4 inline text-rose-500 shrink-0" /> Birbirinizi motive edin</p>
              <p><Target className="w-4 h-4 inline text-orange-500 shrink-0" /> Başarılarınızı paylaşın</p>
            </div>
          </div>
        </div>
      </StickyWrapper>

      <FeedWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-x-3">
            <Image
              src="/mascot_purple.svg"
              alt="Maskot"
              height={60}
              width={60}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Çalışma Arkadaşları</h1>
              <p className="text-sm text-muted-foreground">
                Benzer hedeflere sahip arkadaşlar bul, birlikte başar
              </p>
            </div>
          </div>

          {!userAchievements.studyBuddyUnlocked && userStreak < 7 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Gönderi ve mesaj göndermek için </span>
                  <span className="font-bold text-amber-900">7 gün istikrar</span>
                  <span className="font-medium text-amber-800"> gerekiyor. </span>
                  <span className="text-amber-700">({userStreak}/7 gün)</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Navigation */}
          <div className="flex border-2 border-gray-200 rounded-2xl p-1 gap-1">
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm transition-all ${
                activeTab === "allPosts"
                  ? "bg-gray-100 text-gray-800 font-bold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
              onClick={() => setActiveTab("allPosts")}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Tüm Gönderiler</span>
              <span className="sm:hidden">Gönderiler</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm transition-all ${
                activeTab === "myPosts"
                  ? "bg-gray-100 text-gray-800 font-bold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
              onClick={() => setActiveTab("myPosts")}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Gönderilerim</span>
              <span className="sm:hidden">Benim</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm transition-all ${
                activeTab === "chats"
                  ? "bg-gray-100 text-gray-800 font-bold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
              onClick={() => setActiveTab("chats")}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Sohbetlerim</span>
              <span className="sm:hidden">Sohbet</span>
            </button>
          </div>

          {/* Tab Content */}
            {activeTab === "allPosts" && (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Gönderi
                </Button>
              </div>

              {/* Filters (collapsible on mobile) */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors list-none">
                  <Filter className="h-4 w-4" />
                  <span>Filtrele</span>
                  <span className="text-xs text-gray-400 ml-1">
                    {(filterPurpose || selectedSchoolId) ? "(aktif)" : ""}
                  </span>
                </summary>
                <Card className="mt-3">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Çalışma Amacı</label>
                        <select
                          value={filterPurpose}
                          onChange={(e) => setFilterPurpose(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                        >
                          <option value="">Tümü</option>
                          {PURPOSE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Okul Filtresi</label>
                        <StudyBuddySchoolSelector
                          onSchoolSelect={setSelectedSchoolId}
                          selectedSchoolId={selectedSchoolId}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </details>

              {/* New Post Form */}
              {showNewPostForm && (
                <Card className="border-green-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-bold text-sm">Yeni Gönderi</span>
                    </div>
                    <button
                      className="text-white/80 hover:text-white transition-colors"
                      onClick={() => setShowNewPostForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {creationError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                        {creationError}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Çalışma Amacı</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                        value={postPurpose}
                        onChange={(e) => setPostPurpose(e.target.value)}
                      >
                        <option value="">Seçiniz</option>
                        {PURPOSE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Açıklama</label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 min-h-[90px] resize-none"
                        value={postReason}
                        onChange={(e) => setPostReason(e.target.value)}
                        placeholder="Neden çalışma arkadaşı arıyorsun?"
                        maxLength={POST_LIMITS.MAX_REASON_LENGTH}
                      />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{postReason.length}/{POST_LIMITS.MAX_REASON_LENGTH}</span>
                        <span>Aylık limit: {POST_LIMITS.MAX_PER_MONTH}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleCreatePost}
                      disabled={!postPurpose || !postReason}
                    >
                      Gönderi Oluştur
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Posts List */}
              <div className="space-y-3">
                {loadingPosts ? (
                  <LoadingSpinner size="lg" />
                ) : displayedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">Henüz gönderi bulunmuyor.</p>
                      <p className="text-xs text-gray-400 mt-1">İlk gönderiyi sen oluştur!</p>
                    </CardContent>
                  </Card>
                ) : (
                  displayedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onChatRequest={handleOpenChat}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalFilteredPosts > POSTS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                  >
                    ← Önceki
                  </button>
                  <span className="text-xs font-medium text-gray-500 px-2">
                    {currentPage + 1} / {Math.ceil(totalFilteredPosts / POSTS_PER_PAGE)}
                  </span>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={goToNextPage}
                    disabled={currentPage >= Math.ceil(totalFilteredPosts / POSTS_PER_PAGE) - 1}
                  >
                    Sonraki →
                  </button>
                </div>
              )}
            </div>
            )}

          {/* My Posts Tab */}
          {activeTab === "myPosts" && (
            <div className="space-y-4">
              {loadingMyPosts ? (
                <LoadingSpinner size="lg" />
              ) : (
                <>
                  {showEditPostForm && editingPost && (
                    <Card className="border-green-300 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <Edit className="h-4 w-4" />
                          <span className="font-bold text-sm">Gönderi Düzenle</span>
                        </div>
                        <button
                          className="text-white/80 hover:text-white transition-colors"
                          onClick={() => {
                            setShowEditPostForm(false);
                            setEditingPost(null);
                            setCreationError("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        {creationError && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                            {creationError}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Çalışma Amacı</label>
                          <select
                            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                            value={editPostPurpose}
                            onChange={(e) => setEditPostPurpose(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            {PURPOSE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Açıklama</label>
                          <textarea
                            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 min-h-[90px] resize-none"
                            value={editPostReason}
                            onChange={(e) => setEditPostReason(e.target.value)}
                            placeholder="Neden çalışma arkadaşı arıyorsun?"
                            maxLength={POST_LIMITS.MAX_REASON_LENGTH}
                          />
                          <div className="text-[10px] text-gray-400">
                            {editPostReason.length}/{POST_LIMITS.MAX_REASON_LENGTH}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={handleEditSubmit}
                          disabled={!editPostPurpose || !editPostReason}
                        >
                          Gönderiyi Güncelle
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {myPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Edit className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Henüz bir gönderi oluşturmadınız.</p>
                        <p className="text-xs text-gray-400 mt-1">
                          &quot;Tüm Gönderiler&quot; sekmesinden yeni gönderi oluşturabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {myPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          isOwnPost={true}
                          onEdit={() => handleEditPost(post)}
                          onDelete={() => handleDeletePost(post.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Chats Tab */}
          {activeTab === "chats" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact List */}
              <div className={`col-span-1 ${selectedChat ? 'hidden md:block' : ''}`}>
                <Card className="overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <span className="text-sm font-semibold text-gray-700">Sohbetler</span>
                    {chats.length > 0 && (
                      <span className="text-xs text-gray-400 ml-2">({chats.length})</span>
                    )}
                  </div>
                  <div className="p-1.5">
                    {loadingChats ? (
                      <div className="py-8 flex justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Henüz sohbetiniz yok.</p>
                        <p className="text-xs text-gray-400 mt-1">Bir gönderideki &quot;Mesaj Gönder&quot; butonuna tıklayarak başlayın.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {chats.map((chat) => (
                          <ChatCard
                            key={chat.id}
                            chat={chat}
                            currentUser={currentUser}
                            onClick={() => handleSelectChat(chat)}
                            isSelected={selectedChat?.id === chat.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Chat Messages */}
              <div className={`col-span-1 md:col-span-2 ${!selectedChat ? 'hidden md:block' : ''}`}>
                {selectedChat ? (
                  <Card className="h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)] flex flex-col overflow-hidden">
                    <div className="border-b bg-white px-3 sm:px-4 py-3 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                          className="md:hidden shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                          onClick={() => setSelectedChat(null)}
                        >
                          <span className="text-lg">←</span>
                        </button>
                        <Image
                          src={normalizeAvatarUrl(selectedChat.participantsData?.[
                            selectedChat.participants.find(p => p !== currentUser?.id)!
                          ]?.avatarUrl)}
                          width={36}
                          height={36}
                          alt="Avatar"
                          className="rounded-full shrink-0 w-8 h-8 sm:w-9 sm:h-9"
                        />
                        <span className="text-sm sm:text-base font-semibold truncate">
                          {selectedChat.participantsData?.[
                            selectedChat.participants.find(p => p !== currentUser?.id)!
                          ]?.userName || "Kullanıcı"}
                        </span>
                      </div>
                      <button
                        className="hidden md:flex p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setSelectedChat(null)}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-gray-50/50">
                      {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-gray-400">Henüz mesaj yok. İlk mesajını gönder!</p>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === currentUser?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 ${
                              message.sender === currentUser?.id
                                ? "bg-green-500 text-white rounded-2xl rounded-br-md"
                                : "bg-white border border-gray-200 rounded-2xl rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm break-words leading-relaxed">{message.content}</p>
                            <span className={`text-[10px] block mt-0.5 ${
                              message.sender === currentUser?.id ? "text-green-100" : "text-gray-400"
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                    <div className="border-t bg-white p-3 shrink-0">
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Mesajınızı yazın..."
                          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                          maxLength={MESSAGE_LIMITS.MAX_LENGTH}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="shrink-0 w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white disabled:text-gray-400 flex items-center justify-center transition-colors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between mt-1.5 px-1 text-[10px] text-gray-400">
                        <span>{newMessage.length}/{MESSAGE_LIMITS.MAX_LENGTH}</span>
                        <span>Günlük limit: {MESSAGE_LIMITS.MAX_PER_DAY}</span>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="h-64 md:h-[calc(100vh-14rem)] flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold mb-1 text-sm sm:text-base text-gray-700">Sohbet Seç</h3>
                      <p className="text-gray-400 text-sm">
                        Soldaki listeden bir sohbet seç
                      </p>
                    </div>
                  </Card>
            )}
            </div>
          </div>
          )}
        </div>
      </FeedWrapper>
    </div>
  );
}
