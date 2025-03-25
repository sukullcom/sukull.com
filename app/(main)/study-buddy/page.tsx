"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { turkishToast } from "@/components/ui/custom-toaster";
import { createClient } from "@/utils/supabase/client"; // or wherever your single client file is
import { LoadingSpinner } from "@/components/loading-spinner";

interface SchoolItem {
  id: number;
  name: string;
  type: string;
}

interface StudyBuddyPost {
  id: number;
  user_id: string;
  school_id?: number | null;
  purpose: string;
  reason: string;
  created_at: string;
  userName?: string;
  userSchoolName?: string;
  userAvatar?: string;
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

const POSTS_PER_PAGE = 10;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Cache for schools data to avoid repeated fetches
let schoolsCache: SchoolItem[] | null = null;
let schoolsCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a shared warningMessages object with Turkish translations
const warningMessages = {
  MESSAGE_LIMIT: "Mesajlar en fazla 200 karakter olabilir.",
  MONTHLY_MESSAGE_LIMIT: "Aylık 100 mesaj sınırına ulaştınız.",
  MONTHLY_POST_LIMIT: "Aylık 2 gönderi sınırına ulaştınız.",
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
};

export default function StudyBuddyPage() {
  const supabase = createClient();

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"allPosts" | "myPosts" | "chats">(
    "allPosts"
  );

  // School filtering
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
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
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>("");

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
  
  const showWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    setWarningOpen(true);
    // Also show as toast for better visibility
    turkishToast.warning(msg, {
      style: {
        background: '#fef3c7', 
        color: '#92400e',
        borderColor: '#fcd34d',
        opacity: '1'
      }
    });
  }, []);

  // For post editing
  const [editingPost, setEditingPost] = useState<StudyBuddyPost | null>(null);
  const [editPostPurpose, setEditPostPurpose] = useState<string>("");
  const [editPostReason, setEditPostReason] = useState<string>("");
  const [showEditPostForm, setShowEditPostForm] = useState<boolean>(false);

  // Auth effect - optimized to use a single listener
  useEffect(() => {
    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        setLoadingUser(false);
      } catch (error) {
        console.error("Error loading session:", error);
        setLoadingUser(false);
      }
    };
    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_: any, session: { user: any } | null) => {
        setCurrentUser(session?.user || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // 1) Load schools with caching
  useEffect(() => {
    async function loadSchools() {
      // Check if we have a valid cache
      const now = Date.now();
      if (schoolsCache && now - schoolsCacheTimestamp < CACHE_TTL) {
        setAllSchools(schoolsCache);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("id, name, type")
          .order("name");
          
        if (error) {
          console.error("Failed to load schools:", error);
        } else if (data) {
          // Update cache
          schoolsCache = data as SchoolItem[];
          schoolsCacheTimestamp = now;
          setAllSchools(data as SchoolItem[]);
        }
      } catch (error) {
        console.error("Error in loadSchools:", error);
      }
    }
    
    loadSchools();
  }, [supabase]);

  // 2) Load all posts - optimized with debouncing and pagination
  const loadAllPosts = useCallback(async () => {
    if (!currentUser) return;
    
    setLoadingPosts(true);
    
    try {
      // Build query with filters
      let query = supabase
        .from("study_buddy_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Apply purpose filter if selected
      if (filterPurpose) {
        query = query.eq("purpose", filterPurpose);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error loading posts:", error);
        return;
      }

      // Check for posts older than 30 days and delete them
      const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_IN_MS).toISOString();
      const oldPosts = data.filter(
        (post: StudyBuddyPost) => post.created_at < thirtyDaysAgo && post.user_id === currentUser.id
      );
      
      if (oldPosts.length > 0) {
        // Delete old posts
        for (const post of oldPosts) {
          await supabase
            .from("study_buddy_posts")
            .delete()
            .eq("id", post.id);
        }
        
        // Show notification
        if (oldPosts.length === 1) {
          turkishToast.info("1 adet eski gönderiniz otomatik olarak silindi (30 gün limiti)");
        } else {
          turkishToast.info(`${oldPosts.length} adet eski gönderiniz otomatik olarak silindi (30 gün limiti)`);
        }
        
        // Reload posts
        await loadAllPosts();
        return;
      }
      
      // Enrich posts with user data in batches to reduce DB calls
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = Array.from(new Set(data.map((post: StudyBuddyPost) => post.user_id)));
        
        // Fetch all users in a single query
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, avatar")
          .in("id", userIds);
          
        // Create a lookup map
        const userMap = (usersData || []).reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
        
        // Get all school IDs
        const schoolIds = Array.from(new Set(data.filter((p: StudyBuddyPost) => p.school_id).map((p: StudyBuddyPost) => p.school_id)));
        
        // Fetch all schools in a single query
        const { data: schoolsData } = await supabase
          .from("schools")
          .select("id, name")
          .in("id", schoolIds);
          
        // Create a lookup map
        const schoolMap = (schoolsData || []).reduce((acc: any, school: any) => {
          acc[school.id] = school;
          return acc;
        }, {});
        
        // Enrich posts with user and school data
        const enrichedPosts = data.map((post: StudyBuddyPost) => {
          const user = userMap[post.user_id];
          const school = post.school_id ? schoolMap[post.school_id] : null;
          
          return {
            ...post,
            userName: user?.name || "User",
            userAvatar: user?.avatar || "/mascot_purple.svg",
            userSchoolName: school?.name || "",
          };
        });
        
        setAllPostsRaw(enrichedPosts);
      } else {
        setAllPostsRaw([]);
      }
    } catch (error) {
      console.error("Error in loadAllPosts:", error);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUser, filterPurpose, supabase]);

  // Load posts when tab changes or filters change
  useEffect(() => {
    if (activeTab === "allPosts" && currentUser) {
      loadAllPosts();
    }
  }, [activeTab, currentUser, filterPurpose, loadAllPosts]);

  // Memoize filtered posts to avoid recalculation on every render
  const displayedPosts = useMemo(() => {
    const startIdx = currentPage * POSTS_PER_PAGE;
    const endIdx = startIdx + POSTS_PER_PAGE;
    
    // Filter by school if search term is provided
    let filtered = allPostsRaw;
    if (schoolSearchTerm) {
      filtered = allPostsRaw.filter(post => 
        post.userSchoolName?.toLowerCase().includes(schoolSearchTerm.toLowerCase())
      );
    }
    
    return filtered.slice(startIdx, endIdx);
  }, [allPostsRaw, currentPage, schoolSearchTerm]);

  // Calculate total pages once
  const totalPages = useMemo(() => {
    let filtered = allPostsRaw;
    if (schoolSearchTerm) {
      filtered = allPostsRaw.filter(post => 
        post.userSchoolName?.toLowerCase().includes(schoolSearchTerm.toLowerCase())
      );
    }
    return Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  }, [allPostsRaw, schoolSearchTerm]);

  // Pagination handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // 4) Create new post
  async function handleCreatePost() {
    setCreationError("");

    if (!postPurpose) {
      setCreationError(warningMessages.EMPTY_PURPOSE);
      return;
    }
    const trimmedReason = postReason.trim();
    if (!trimmedReason) {
      setCreationError(warningMessages.EMPTY_REASON);
      return;
    }
    if (trimmedReason.length > 256) {
      setCreationError(warningMessages.REASON_TOO_LONG);
      return;
    }
    if (!currentUser) return;

    // Limit user to 2 posts in last 30 days
    const thirtyDaysAgo = new Date(
      Date.now() - THIRTY_DAYS_IN_MS
    ).toISOString();
    const { data: recentPosts } = await supabase
      .from("study_buddy_posts")
      .select("*")
      .eq("user_id", currentUser.id)
      .gt("created_at", thirtyDaysAgo);

    if (recentPosts && recentPosts.length >= 2) {
      setCreationError(warningMessages.MONTHLY_POST_LIMIT);
      return;
    }

    const { error } = await supabase.from("study_buddy_posts").insert([
      {
        user_id: currentUser.id,
        purpose: postPurpose,
        reason: trimmedReason,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating post:", error);
    } else {
      setPostPurpose("");
      setPostReason("");
      setShowNewPostForm(false);
      turkishToast.success("Gönderi başarıyla oluşturuldu");
      loadAllPosts();
    }
  }

  // 5) Open (or create) chat
  async function handleOpenChat(post: StudyBuddyPost) {
    if (!currentUser || post.user_id === currentUser.id) return;
    setActiveTab("chats");

    const participants = [currentUser.id, post.user_id].sort();

    // Check if chat already exists
    const { data: existingChats } = await supabase
      .from("study_buddy_chats")
      .select("*")
      // We can do an exact match using .eq("participants", JSON.stringify([...]))
      // so that we only get a chat whose `participants` array exactly matches
      .filter("participants", "cs", JSON.stringify(participants));

    if (!existingChats || existingChats.length === 0) {
      // Limit user to 2 new chat partners in last 30 days
      const thirtyDaysAgo = new Date(
        Date.now() - THIRTY_DAYS_IN_MS
      ).toISOString();
      const { data: recentChats } = await supabase
        .from("study_buddy_chats")
        .select("*")
        .contains("participants", currentUser.id) // Single value check
        .gt("last_updated", thirtyDaysAgo);

      const distinctPartners = new Set<string>();
      recentChats?.forEach((chat: StudyBuddyChat) => {
        const other = chat.participants.find((uid) => uid !== currentUser.id);
        if (other) distinctPartners.add(other);
      });

      if (distinctPartners.size >= 2) {
        showWarning(warningMessages.MONTHLY_CHAT_LIMIT);
        return;
      }

      // Create a new chat
      const { data: newChat, error } = await supabase
        .from("study_buddy_chats")
        .insert([
          {
            participants: participants,
            last_message: "",
            last_updated: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Error creating chat:", error);
        return;
      }
      // Enrich newChat with the other participant's data
      if (newChat) {
        const otherUid = participants.find((id) => id !== currentUser.id);
        if (otherUid) {
          const { data: userData } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", otherUid)
            .single();
          newChat.participantsData = {
            [otherUid]: {
              userName: userData?.name || "User",
              avatarUrl: userData?.avatar || "/mascot_purple.svg",
            },
          };
        }
        setSelectedChat(newChat as StudyBuddyChat);
      }
    } else {
      // Chat already exists, so let's see if we have it (with participantsData) in `chats` state
      const existingChat = existingChats[0] as StudyBuddyChat;
      const chatInState = chats.find((c) => c.id === existingChat.id);
      if (chatInState) {
        // We already have the enriched version in state
        setSelectedChat(chatInState);
      } else {
        // If not in state for some reason, just manually enrich it again:
        const otherUid = participants.find((id) => id !== currentUser.id);
        if (otherUid) {
          const { data: userData } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", otherUid)
            .single();
          existingChat.participantsData = {
            [otherUid]: {
              userName: userData?.name || "User",
              avatarUrl: userData?.avatar || "/mascot_purple.svg",
            },
          };
        }
        setSelectedChat(existingChat);
      }
    }
  }

  // 6) My Posts - optimized
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
      } else if (data) {
        setMyPosts(data as StudyBuddyPost[]);
      }
    } catch (error) {
      console.error("Error in loadMyPosts:", error);
    } finally {
      setLoadingMyPosts(false);
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    if (!currentUser || activeTab !== "myPosts") return;
    loadMyPosts();
  }, [activeTab, currentUser, loadMyPosts]);

  // 7) Real-time subscription for "study_buddy_chats"
  useEffect(() => {
    if (!currentUser || activeTab !== "chats") return;


    const chatChannel = supabase
      .channel(`realtime-chats-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_buddy_chats",
          filter: `participants=cs.["${currentUser.id}"]` // Proper JSONB array syntax
        },
        async (payload: any) => {
          // payload.new will hold the inserted/updated row
          const changedChat = payload.new as StudyBuddyChat;

          // Enrich with participant data (the "other" user)
          const otherUid = changedChat.participants.find(
            (id: string) => id !== currentUser.id
          );
          if (otherUid) {
            const { data: userData } = await supabase
              .from("users")
              .select("name, avatar")
              .eq("id", otherUid)
              .single();
            changedChat.participantsData = {
              [otherUid]: {
                userName: userData?.name || "User",
                avatarUrl: userData?.avatar || "/mascot_purple.svg",
              },
            };
          }

          // If this chat is newly inserted, put it at top
          if (payload.eventType === "INSERT") {
            setChats((prev) => [changedChat, ...prev]);
          } else {
            // For UPDATE, update it in place
            setChats((prev) =>
              prev.map((c) => (c.id === changedChat.id ? changedChat : c))
            );
          }
        }
      )
      .subscribe();

    // Also fetch existing chats once:
    async function fetchChats() {
      const { data, error } = await supabase
        .from("study_buddy_chats")
        .select("*")
        .filter("participants", "cs", `["${currentUser.id}"]`)
        .order("last_updated", { ascending: false });
      
        filter: `participants=cs.["${currentUser.id}"]` // Correct array syntax

      if (error) {
        console.error("Error fetching chats:", error);
        setLoadingChats(false);
        return;
      }

      if (data) {
        // Enrich each chat with participant data
        const chatsWithData = await Promise.all(
          data.map(async (chat: StudyBuddyChat) => {
            const otherUid = chat.participants.find(
              (id) => id !== currentUser.id
            );
            if (otherUid) {
              const { data: userData } = await supabase
                .from("users")
                .select("name, avatar")
                .eq("id", otherUid)
                .single();
              chat.participantsData = {
                [otherUid]: {
                  userName: userData?.name || "User",
                  avatarUrl: userData?.avatar || "/mascot_purple.svg",
                },
              };
            }
            return chat;
          })
        );
        setChats(chatsWithData);
      }
      setLoadingChats(false);
    }
    fetchChats();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser, activeTab, supabase]);

  // 8) Realtime subscription for messages in the selected chat
  useEffect(() => {
    if (!selectedChat) return;

    // Listen for new messages in that chat
    const messageChannel = supabase
      .channel(`realtime-messages-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_buddy_messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as StudyBuddyMessage]);
        }
      )
      .subscribe();

    // Load existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("study_buddy_messages")
        .select("*")
        .eq("chat_id", selectedChat.id)
        .order("created_at", { ascending: true });

      setMessages((data as StudyBuddyMessage[]) || []);
    };
    fetchMessages();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [selectedChat, supabase]);

  // Scroll new messages into view
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 9) Send message
  async function handleSendMessage() {
    if (!selectedChat || !newMessage.trim() || !currentUser) return;
    
    const trimmed = newMessage.trim();
    
    if (trimmed.length > 200) {
      showWarning(warningMessages.MESSAGE_LIMIT);
      return;
    }

    // Limit user to 100 messages per 30 days
    const thirtyDaysAgo = new Date(
      Date.now() - THIRTY_DAYS_IN_MS
    ).toISOString();
    const { data: recentMsgs } = await supabase
      .from("study_buddy_messages")
      .select("*")
      .eq("sender", currentUser?.id || "")
      .gt("created_at", thirtyDaysAgo);

    if (recentMsgs && recentMsgs.length >= 100) {
      showWarning(warningMessages.MONTHLY_MESSAGE_LIMIT);
      return;
    }

    const { error } = await supabase.from("study_buddy_messages").insert([
      {
        chat_id: selectedChat.id,
        sender: currentUser?.id || "",
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Update chat's last_message and last_updated
      await supabase
        .from("study_buddy_chats")
        .update({
          last_message: trimmed,
          last_updated: new Date().toISOString(),
        })
        .eq("id", selectedChat.id);
      setNewMessage("");
    }
  }

  // Helper function to truncate messages
  const truncatedMessage = useCallback((message: string, maxLength = 40): string => {
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  }, []);

  // Handle post edit button click
  function handleEditPost(post: StudyBuddyPost) {
    setEditingPost(post);
    setEditPostPurpose(post.purpose);
    setEditPostReason(post.reason);
    setShowEditPostForm(true);
  }

  // Save edited post
  async function saveEditedPost() {
    if (!currentUser || !editingPost) return;
    
    const trimmedReason = editPostReason.trim();
    
    // Validate input
    if (!editPostPurpose) {
      setCreationError(warningMessages.EMPTY_PURPOSE);
      return;
    }
    
    if (!trimmedReason) {
      setCreationError(warningMessages.EMPTY_REASON);
      return;
    }
    
    if (trimmedReason.length > 300) {
      setCreationError(warningMessages.REASON_TOO_LONG);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("study_buddy_posts")
        .update({
          purpose: editPostPurpose,
          reason: trimmedReason,
        })
        .eq("id", editingPost.id)
        .eq("user_id", currentUser.id); // Security check
      
      if (error) {
        console.error("Error updating post:", error);
        setCreationError(warningMessages.ERROR_CREATING_POST);
      } else {
        setEditingPost(null);
        setEditPostPurpose("");
        setEditPostReason("");
        setShowEditPostForm(false);
        setCreationError("");
        turkishToast.success("Gönderi başarıyla güncellendi");
        
        // Reload posts
        loadAllPosts();
        loadMyPosts();
      }
    } catch (error) {
      console.error("Error in saveEditedPost:", error);
      setCreationError(warningMessages.ERROR_CREATING_POST);
    }
  }

  // 11) Render
  if (loadingUser) return <LoadingSpinner size="md" />;
  if (!currentUser) return <div className="p-4">Lütfen giriş yapın.</div>;

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-2 rounded-xl p-6 bg-white w-full max-w-[1200px] mx-auto flex-1 flex flex-col">
          {/* TAB BUTTONS */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "allPosts" ? "secondary" : "default"}
              size="sm"
              onClick={() => setActiveTab("allPosts")}
            >
              Bütün Gönderİler
            </Button>
            <Button
              variant={activeTab === "myPosts" ? "secondary" : "default"}
              size="sm"
              onClick={() => setActiveTab("myPosts")}
            >
              Gönderİlerİm
            </Button>
            <Button
              variant={activeTab === "chats" ? "secondary" : "default"}
              size="sm"
              onClick={() => setActiveTab("chats")}
            >
              Sohbetlerİm
            </Button>
          </div>

          <div className="flex-1 overflow-hidden mt-4">
            {/* ALL POSTS TAB */}
            {activeTab === "allPosts" && (
              <div className="h-full flex flex-col">
                {/* Filter UI */}
                <div className="p-4 rounded-md bg-gray-100 flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium">
                      Bu Neyin Hazırlığı
                    </label>
                    <select
                      value={filterPurpose}
                      onChange={(e) => setFilterPurpose(e.target.value)}
                      className="mt-1 block rounded-md p-1 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Hepsi</option>
                      {PURPOSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Okul ismi ara
                    </label>
                    <input
                      type="text"
                      placeholder="Okul ismi..."
                      value={schoolSearchTerm}
                      onChange={(e) => setSchoolSearchTerm(e.target.value)}
                      className="mt-1 block rounded-md p-1 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setShowNewPostForm(!showNewPostForm)}
                  >
                    Yeni Gönderi Oluştur
                  </Button>
                </div>

                {showNewPostForm && (
                  <div className="border-2 rounded-md p-4 space-y-3 bg-white mt-4 mx-1">
                    <h3 className="text-lg font-bold">Gönderi Oluştur</h3>
                    {creationError && (
                      <div className="text-red-500 text-sm">
                        {creationError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium">
                        Bu Neyin Hazırlığı
                      </label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={postPurpose}
                        onChange={(e) => setPostPurpose(e.target.value)}
                      >
                        <option value="">-Seç-</option>
                        {PURPOSE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Açıklama
                      </label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={postReason}
                        onChange={(e) => setPostReason(e.target.value)}
                        placeholder="Neden çalışma arkadaşı arıyorsun? (max 256 karakter)"
                        maxLength={256}
                      />
                    </div>
                    <Button variant="secondary" onClick={handleCreatePost}>
                      Gönder
                    </Button>
                  </div>
                )}

                {/* Posts List */}
                <div className="flex-1 mt-4 mx-1 border-2 rounded-md p-4 bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200">
                  {loadingPosts ? (
                    <div className="flex justify-center items-center h-40">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : displayedPosts.length === 0 ? (
                    <div>Post yok (veya filtreye uyan yok).</div>
                  ) : (
                    displayedPosts.map((post: StudyBuddyPost) => {
                      const createdAtDate = new Date(post.created_at);
                      return (
                        <div
                          key={post.id}
                          className="border-b last:border-none py-3"
                        >
                          <div className="text-sm text-gray-500">
                            Oluşturulma Zamanı: {createdAtDate.toLocaleString()}
                          </div>
                          <div className="font-semibold">
                            Gönderen: {post.userName}
                          </div>
                          {post.userSchoolName && (
                            <div className="text-sm">
                              Okul: {post.userSchoolName}
                            </div>
                          )}
                          {post.purpose && (
                            <div className="text-sm">
                              Çalışma Amacı: {post.purpose}
                            </div>
                          )}
                          <div className="text-sm text-gray-700">
                            Açıklama: {post.reason}
                          </div>
                          {post.user_id !== currentUser!.id && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleOpenChat(post)}
                            >
                              Mesaj At
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                <div className="flex justify-between mt-4 mx-1">
                  <Button
                    variant="primaryOutline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                  >
                    Önceki Sayfa
                  </Button>
                  <Button
                    variant="primaryOutline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Sonraki Sayfa
                  </Button>
                </div>
                <div className="text-sm text-gray-700 mx-1">
                  Sayfa {currentPage + 1} / {totalPages}
                </div>
              </div>
            )}

            {/* MY POSTS TAB */}
            {activeTab === "myPosts" && (
              <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-xl font-bold mb-4">Gönderilerim</h2>
                {loadingMyPosts ? (
                  <div className="flex justify-center items-center h-40">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : myPosts.length === 0 ? (
                  <div className="text-center text-gray-500 my-8">
                    Henüz gönderi oluşturmadınız.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white border rounded-lg p-4 shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-bold">{post.purpose}</span>
                            <p className="text-gray-700 mt-2 whitespace-pre-wrap break-words">
                              {post.reason}
                            </p>
                            {/* Display university name if it exists */}
                            {post.userSchoolName && (
                              <div className="text-gray-500 mt-2 text-sm">
                                {post.userSchoolName}
                              </div>
                            )}
                            <div className="text-gray-500 mt-2 text-sm">
                              {new Date(post.created_at).toLocaleDateString("tr-TR")}
                            </div>
                          </div>
                          
                          {/* Edit button */}
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleEditPost(post)}
                          >
                            Düzenle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHATS TAB */}
            {activeTab === "chats" && (
              <div className="h-full flex flex-col md:flex-row gap-4">
                {/* Chat List */}
                <div className="border-2 rounded-md p-4 bg-white w-full md:w-1/3 overflow-y-auto scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200">
                  <h2 className="text-xl font-bold mb-2">Sohbetler</h2>
                  {loadingChats ? (
                    <div className="flex justify-center items-center h-40">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : chats.length === 0 ? (
                    <div>Hiç sohbet yok.</div>
                  ) : (
                    <ul className="space-y-2">
                      {chats.map((chat) => {
                        const otherUid = chat.participants.find(
                          (id) => id !== currentUser!.id
                        );
                        const otherData =
                          chat.participantsData && otherUid
                            ? chat.participantsData[otherUid]
                            : {
                                userName: "User",
                                avatarUrl: "/mascot_purple.svg",
                              };
                        const shortLastMsg = truncatedMessage(
                          chat.last_message,
                          12
                        );
                        return (
                          <li
                            key={chat.id}
                            className="border rounded p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedChat(chat);
                              setMessages([]); // Reset messages to avoid stale data
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={otherData.avatarUrl}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-semibold">
                                  {otherData.userName}
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                  {shortLastMsg}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Chat Messages */}
                <div className="border-2 rounded-md p-4 bg-white flex-1 flex flex-col">
                  {!selectedChat ? (
                    <div className="text-gray-500">
                      Bir sohbet seçmek için sol listeden tıklayın.
                    </div>
                  ) : (
                    <>
                      <div className="pb-2 mb-2 border-b">
                        <h3 className="text-lg font-semibold">Sohbet</h3>
                        <p className="text-sm text-gray-600">
                          {selectedChat.participants
                            .filter((uid) => uid !== currentUser!.id)
                            .map((uid) => {
                              const d =
                                selectedChat.participantsData && uid
                                  ? selectedChat.participantsData[uid]
                                  : { userName: "User" };
                              return d.userName;
                            })
                            .join(", ")}
                        </p>
                      </div>
                      <div className="overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200 max-h-80">
                        {messages.map((msg) => {
                          const isMine = msg.sender === currentUser!.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`p-2 rounded mb-1 max-w-sm whitespace-pre-wrap break-words ${
                                  isMine
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messageEndRef} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          className="flex-1 border rounded-md p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Mesaj (max 200 karakter)"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSendMessage}
                        >
                          Gönder
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="pb-12"></div>
      </div>

      {/* Edit Post Modal */}
      {showEditPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Gönderi Düzenle</h3>
            
            {creationError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {creationError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Amaç</label>
              <select
                className="w-full p-2 border rounded"
                value={editPostPurpose}
                onChange={(e) => setEditPostPurpose(e.target.value)}
              >
                <option value="">Seçiniz</option>
                {PURPOSE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                Açıklama (max 300 karakter)
              </label>
              <textarea
                className="w-full p-2 border rounded min-h-[100px]"
                placeholder="Açıklamanızı yazın"
                value={editPostReason}
                onChange={(e) => setEditPostReason(e.target.value)}
              />
              <div className="text-right text-sm text-gray-500">
                {editPostReason.length}/300
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditPostForm(false);
                  setEditingPost(null);
                  setCreationError("");
                }}
              >
                İptal
              </Button>
              <Button variant="primary" onClick={saveEditedPost}>
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Improved Warning Modal with mascot_sad.svg */}
      {warningOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex flex-col items-center mb-4">
              <img 
                src="/mascot_sad.svg" 
                alt="Sad Mascot" 
                className="w-20 h-20 mb-4" 
              />
              <h3 className="text-lg font-bold text-center">Uyarı</h3>
            </div>
            
            <p className="text-center mb-6">{warningMessage}</p>
            
            <div className="flex justify-center">
              <Button onClick={() => setWarningOpen(false)}>
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
