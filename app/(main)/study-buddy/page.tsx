"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search, 
  Filter,
  BookOpen,
  Clock,
  Send,
  Edit,
  AlertCircle,
  X 
} from "lucide-react";
import { StudyBuddySchoolSelector } from "@/components/study-buddy-school-selector";

interface SchoolItem {
  id: number;
  name: string;
  type: string;
}

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

// Cache for schools data to avoid repeated fetches
const schoolsCache: SchoolItem[] | null = null;
const schoolsCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  // Warning modal
  const [warningOpen, setWarningOpen] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  
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
  
  // Add totalPosts state
  const [totalPosts, setTotalPosts] = useState<number>(0);
  
  const showWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    setWarningOpen(true);
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
      
      const { data: postsData, error: postsError, count } = await query;
      
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
        setTotalPosts(count || 0);
      } else {
        setAllPostsRaw([]);
        setTotalPosts(0);
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

      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Çalışma Arkadaşları</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Gösterilen Gönderi</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {totalFilteredPosts}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Aktif Sohbet</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {chats.length}
              </Badge>
            </div>
            <Separator className="bg-green-200" />
            <div className="text-xs text-green-600">
              <p>• Aylık gönderi limiti: {POST_LIMITS.MAX_PER_MONTH}</p>
              <p>• Günlük mesaj limiti: {MESSAGE_LIMITS.MAX_PER_DAY}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Çalışma İpuçları</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-2">
            <p>• Çalışma arkadaşları ile belirli hedefler koyun</p>
            <p>• Düzenli çalışma programları oluşturun</p>
            <p>• Birbirinizi motive edin</p>
            <p>• Başarılarınızı paylaşın</p>
          </CardContent>
        </Card>
      </StickyWrapper>

      <FeedWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Çalışma Arkadaşları</h1>
            <p className="text-muted-foreground">
              Benzer hedeflere sahip çalışma arkadaşları bul ve birlikte başarıya ulaş
            </p>
          </div>

          {/* Tab Navigation */}
          <Card>
            <CardContent className="p-0">
              <div className="flex border-b">
            <Button
                  variant={activeTab === "allPosts" ? "secondary" : "ghost"}
                  className="flex-1 rounded-none border-0 h-12"
              onClick={() => setActiveTab("allPosts")}
            >
                  <Users className="mr-2 h-4 w-4" />
                  Tüm Gönderiler
            </Button>
            <Button
                  variant={activeTab === "myPosts" ? "secondary" : "ghost"}
                  className="flex-1 rounded-none border-0 h-12"
              onClick={() => setActiveTab("myPosts")}
            >
                  <Edit className="mr-2 h-4 w-4" />
                  Gönderilerim
            </Button>
            <Button
                  variant={activeTab === "chats" ? "secondary" : "ghost"}
                  className="flex-1 rounded-none border-0 h-12"
              onClick={() => setActiveTab("chats")}
            >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Sohbetlerim
            </Button>
          </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
            {activeTab === "allPosts" && (
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-600" />
                      <CardTitle>Filtreler</CardTitle>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => setShowNewPostForm(!showNewPostForm)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni Gönderi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Çalışma Amacı</label>
                    <select
                      value={filterPurpose}
                      onChange={(e) => setFilterPurpose(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none"
                    >
                        <option value="">Tümü</option>
                      {PURPOSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Okul Filtresi</label>
                      <StudyBuddySchoolSelector
                        onSchoolSelect={setSelectedSchoolId}
                        selectedSchoolId={selectedSchoolId}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* New Post Form */}
              {showNewPostForm && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-800">Yeni Gönderi Oluştur</CardTitle>
                  <Button
                        variant="ghost"
                    size="sm"
                        onClick={() => setShowNewPostForm(false)}
                  >
                        <X className="h-4 w-4" />
                  </Button>
                </div>
                    {creationError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        {creationError}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Çalışma Amacı</label>
                      <select
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none"
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Açıklama</label>
                      <textarea
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none min-h-[100px]"
                        value={postReason}
                        onChange={(e) => setPostReason(e.target.value)}
                        placeholder={`Neden çalışma arkadaşı arıyorsun? (max ${POST_LIMITS.MAX_REASON_LENGTH} karakter)`}
                        maxLength={POST_LIMITS.MAX_REASON_LENGTH}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{postReason.length}/{POST_LIMITS.MAX_REASON_LENGTH} karakter</span>
                        <span>Aylık limit: {POST_LIMITS.MAX_PER_MONTH} gönderi</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
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
              <div className="space-y-4">
                  {loadingPosts ? (
                  <LoadingSpinner size="lg" />
                ) : (
                  <>
                    {displayedPosts.map((post) => (
                      <PostCard
                          key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onChatRequest={handleOpenChat}
                      />
                    ))}
                  </>
                  )}
                            </div>

                {/* Pagination */}
              {totalFilteredPosts > POSTS_PER_PAGE && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  <div className="flex items-center gap-2">
                            <Button
                      variant="secondary"
                              size="sm"
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                            >
                      İlk
                            </Button>
                  <Button
                      variant="secondary"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                  >
                      Önceki
                  </Button>
                    <div className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100">
                      <span className="text-sm font-medium">
                        Sayfa {currentPage + 1} / {Math.ceil(totalFilteredPosts / POSTS_PER_PAGE)}
                      </span>
                    </div>
                  <Button
                      variant="secondary"
                    size="sm"
                    onClick={goToNextPage}
                      disabled={currentPage >= Math.ceil(totalFilteredPosts / POSTS_PER_PAGE) - 1}
                    >
                      Sonraki
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(Math.ceil(totalFilteredPosts / POSTS_PER_PAGE) - 1)}
                      disabled={currentPage >= Math.ceil(totalFilteredPosts / POSTS_PER_PAGE) - 1}
                    >
                      Son
                  </Button>
                </div>
                  <div className="text-sm text-muted-foreground">
                    Toplam {totalFilteredPosts} gönderi • {POSTS_PER_PAGE} gönderi/sayfa
                </div>
                </div>
              )}
              </div>
            )}

          {/* My Posts Tab */}
            {activeTab === "myPosts" && (
            <div className="space-y-6">
                {loadingMyPosts ? (
                <LoadingSpinner size="lg" />
              ) : (
                <>
                  {/* Edit Form */}
                  {showEditPostForm && editingPost && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-blue-800">Gönderi Düzenle</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowEditPostForm(false);
                              setEditingPost(null);
                              setCreationError("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {creationError && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {creationError}
                              </div>
                            )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Çalışma Amacı</label>
                          <select
                            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-500 focus:outline-none"
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Açıklama</label>
                          <textarea
                            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-500 focus:outline-none min-h-[100px]"
                            value={editPostReason}
                            onChange={(e) => setEditPostReason(e.target.value)}
                            placeholder={`Neden çalışma arkadaşı arıyorsun? (max ${POST_LIMITS.MAX_REASON_LENGTH} karakter)`}
                            maxLength={POST_LIMITS.MAX_REASON_LENGTH}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{editPostReason.length}/{POST_LIMITS.MAX_REASON_LENGTH} karakter</span>
                          </div>
                        </div>
                          <Button 
                          variant="primary"
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={handleEditSubmit}
                          disabled={!editPostPurpose || !editPostReason}
                        >
                          Gönderiyi Güncelle
                          </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Posts List */}
                  {myPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Henüz bir gönderi oluşturmadınız.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
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
            <div className="grid grid-cols-3 gap-6">
              {/* Contact List - Left Side */}
              <div className="col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sohbetler</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {chats.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Henüz bir sohbetiniz yok.</p>
                    </div>
                    ) : (
                      <div className="space-y-2">
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
                  </CardContent>
                </Card>
                </div>

              {/* Chat Messages - Right Side */}
              <div className="col-span-2">
                {selectedChat ? (
                  <Card className="h-[calc(100vh-16rem)] flex flex-col">
                    <CardHeader className="border-b bg-gray-50/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image
                            src={normalizeAvatarUrl(selectedChat.participantsData?.[
                              selectedChat.participants.find(p => p !== currentUser?.id)!
                            ]?.avatarUrl)}
                            width={40}
                            height={40}
                            alt="Avatar"
                            className="rounded-full"
                          />
                          <CardTitle>
                            {selectedChat.participantsData?.[
                              selectedChat.participants.find(p => p !== currentUser?.id)!
                            ]?.userName || "Kullanıcı"}
                          </CardTitle>
                    </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedChat(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                              className={`flex ${
                            message.sender === currentUser?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                            className={`max-w-[70%] p-3 rounded-xl ${
                              message.sender === currentUser?.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70">
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
                    </CardContent>
                    <div className="border-t bg-gray-50/80 p-4">
                      <div className="flex gap-2">
                          <input
                          type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Mesajınızı yazın..."
                          className="flex-1 rounded-xl border-2 border-gray-200 p-3 focus:border-green-500 focus:outline-none"
                            maxLength={MESSAGE_LIMITS.MAX_LENGTH}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          />
                          <Button
                            variant="primary"
                            onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          >
                          <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>{newMessage.length}/{MESSAGE_LIMITS.MAX_LENGTH} karakter</span>
                          <span>Günlük limit: {MESSAGE_LIMITS.MAX_PER_DAY} mesaj</span>
                        </div>
                      </div>
                  </Card>
                ) : (
                  <Card className="h-[calc(100vh-16rem)] flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="font-semibold mb-2">Sohbet Seç</h3>
                      <p className="text-muted-foreground">
                        Soldan bir sohbet seçerek mesajlaşmaya başla
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
