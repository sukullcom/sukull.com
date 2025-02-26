"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client"; // or wherever your single client file is

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

export default function StudyBuddyPage() {
  const supabase = createClient();

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      setLoadingUser(false);
    };
    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_: any, session: { user: any } | null) => {
        setCurrentUser(session?.user || null);
      }    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"allPosts" | "myPosts" | "chats">(
    "allPosts"
  );

  // School filtering
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const PURPOSE_OPTIONS = [
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
  ];
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
  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setWarningOpen(true);
  };

  // 1) Load schools
  useEffect(() => {
    async function loadSchools() {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, type")
        .order("name");
      if (error) {
        console.error("Failed to load schools:", error);
      } else if (data) {
        setAllSchools(data as SchoolItem[]);
      }
    }
    loadSchools();
  }, [supabase]);

  // 2) Load all posts
  const loadAllPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("study_buddy_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
      setLoadingPosts(false);
      return;
    }
    if (!data) {
      setLoadingPosts(false);
      return;
    }

    // Enhance posts with user info
    const posts = data as StudyBuddyPost[];
    const enhanced = await Promise.all(
      posts.map(async (post) => {
        let userName = "User";
        let userAvatar = "/mascot_purple.svg";
        if (post.user_id) {
          const { data: userRow } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", post.user_id)
            .single();
          if (userRow) {
            userName = userRow.name || "User";
            userAvatar = userRow.avatar || "/mascot_purple.svg";
          }
        }

        let userSchoolName = "";
        if (post.school_id) {
          const foundSchool = allSchools.find((s) => s.id === post.school_id);
          userSchoolName = foundSchool ? foundSchool.name : "";
        }

        return {
          ...post,
          userName,
          userAvatar,
          userSchoolName,
        };
      })
    );

    // Apply filters
    let filtered = enhanced;
    if (filterPurpose) {
      filtered = filtered.filter((p) => p.purpose === filterPurpose);
    }
    if (schoolSearchTerm.trim()) {
      const term = schoolSearchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.userSchoolName?.toLowerCase().includes(term)
      );
    }

    setAllPostsRaw(filtered);
    setLoadingPosts(false);
  };

  useEffect(() => {
    if (!currentUser || activeTab !== "allPosts") return;
    setCurrentPage(0);
    loadAllPosts();
  }, [activeTab, currentUser, filterPurpose, schoolSearchTerm]);

  // Pagination
  const startIndex = currentPage * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const displayedPosts = allPostsRaw.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allPostsRaw.length / POSTS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  };

  // 4) Create new post
  async function handleCreatePost() {
    setCreationError("");

    if (!postPurpose) {
      setCreationError("Bir çalışma amacı seçmelisiniz.");
      return;
    }
    const trimmedReason = postReason.trim();
    if (!trimmedReason) {
      setCreationError("Açıklama boş olamaz.");
      return;
    }
    if (trimmedReason.length > 256) {
      setCreationError("Açıklama 256 karakteri geçemez.");
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
      setCreationError("Aylık 2 gönderi sınırına ulaştınız.");
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
      .eq("participants", JSON.stringify(participants));

    if (!existingChats || existingChats.length === 0) {
      // Limit user to 2 new chat partners in last 30 days
      const thirtyDaysAgo = new Date(
        Date.now() - THIRTY_DAYS_IN_MS
      ).toISOString();
      const { data: recentChats } = await supabase
        .from("study_buddy_chats")
        .select("*")
        .contains("participants", [currentUser.id])
        .gt("last_updated", thirtyDaysAgo);

      const distinctPartners = new Set<string>();
      recentChats?.forEach((chat: StudyBuddyChat) => {
        const other = chat.participants.find((uid) => uid !== currentUser.id);
        if (other) distinctPartners.add(other);
      });

      if (distinctPartners.size >= 2) {
        showWarning(
          "Her ay en fazla 2 farklı kişiyle sohbet başlatabilirsiniz!"
        );
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

  // 6) My Posts
  async function loadMyPosts() {
    setLoadingMyPosts(true);
    const { data, error } = await supabase
      .from("study_buddy_posts")
      .select("*")
      .eq("user_id", currentUser?.id || "")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading my posts:", error);
    } else if (data) {
      setMyPosts(data as StudyBuddyPost[]);
    }
    setLoadingMyPosts(false);
  }

  useEffect(() => {
    if (!currentUser || activeTab !== "myPosts") return;
    loadMyPosts();
  }, [activeTab, currentUser]);

  // 7) Real-time subscription for "study_buddy_chats"
  useEffect(() => {
    if (!currentUser || activeTab !== "chats") return;

    // The filter must use participants=cs.["USER_ID"] for JSON array containment
    const filterStr = `participants=cs.["${currentUser.id}"]`; // Correct JSON array format

    const chatChannel = supabase
      .channel(`realtime-chats-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_buddy_chats",
          filter: filterStr,
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
        .filter("participants", "cs", `["${currentUser.id}"]`) // Correct JSON array filter
        .order("last_updated", { ascending: false });

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
    if (!selectedChat) return;
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) {
      showWarning("Mesaj 200 karakteri aşamaz!");
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
      showWarning("Aylık 100 mesaj sınırına ulaştınız.");
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

  // 10) UI Helpers
  function truncatedMessage(message: string, maxLength = 40): string {
    if (!message) return "";
    return message.length > maxLength
      ? message.slice(0, maxLength) + "..."
      : message;
  }

  // 11) Render
  if (loadingUser) return <div>Loading user...</div>;
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
                    <div>Loading posts...</div>
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
              <div className="h-full flex flex-col">
                <div className="flex-1 mt-2 border-2 rounded-md p-4 bg-white overflow-y-auto mx-1 scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200">
                  <h2 className="text-xl font-bold mb-4">Gönderilerim</h2>
                  {loadingMyPosts ? (
                    <div>Loading my posts...</div>
                  ) : myPosts.length === 0 ? (
                    <div>Hiç postunuz yok.</div>
                  ) : (
                    myPosts.map((post: StudyBuddyPost) => {
                      const createdAtDate = new Date(post.created_at);
                      return (
                        <div
                          key={post.id}
                          className="border-b last:border-none py-3"
                        >
                          <div className="text-sm text-gray-500">
                            Oluşturulma Zamanı: {createdAtDate.toLocaleString()}
                          </div>
                          <div className="text-sm font-semibold">
                            Çalışma Amacı: {post.purpose}
                          </div>
                          <div className="text-sm text-gray-700">
                            Açıklama: {post.reason}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CHATS TAB */}
            {activeTab === "chats" && (
              <div className="h-full flex flex-col md:flex-row gap-4">
                {/* Chat List */}
                <div className="border-2 rounded-md p-4 bg-white w-full md:w-1/3 overflow-y-auto scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200">
                  <h2 className="text-xl font-bold mb-2">Sohbetler</h2>
                  {loadingChats ? (
                    <div>Loading chats...</div>
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

      {/* Warning Modal */}
      {warningOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <p>{warningMessage}</p>
            <Button onClick={() => setWarningOpen(false)}>Kapat</Button>
          </div>
        </div>
      )}
    </>
  );
}
