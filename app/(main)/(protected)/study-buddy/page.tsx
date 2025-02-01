"use client";

import React, { useEffect, useState, useRef } from "react";
import { auth } from "@/app/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  limit as fsLimit,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";

// Import our new WarningModal
import { WarningModal } from "@/components/modals/warning-modal";

type SchoolItem = {
  id: number;
  name: string;
};

const POSTS_PER_PAGE = 10;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default function StudyBuddyPage() {
  const db = getFirestore();

  // ==============================
  // Auth
  // ==============================
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"allPosts" | "myPosts" | "chats">(
    "allPosts"
  );

  // ==============================
  // School data + Filters
  // ==============================
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
  const [filterPurpose, setFilterPurpose] = useState("");
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");

  // ==============================
  // 1) All Posts
  // ==============================
  const [allPostsRaw, setAllPostsRaw] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Create post
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [postPurpose, setPostPurpose] = useState("");
  const [postReason, setPostReason] = useState("");
  const [creationError, setCreationError] = useState("");

  // ==============================
  // 2) My Posts
  // ==============================
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPurpose, setEditPurpose] = useState("");
  const [editReason, setEditReason] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ==============================
  // 3) Chats
  // ==============================
  const [chats, setChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // ==============================
  // Warning Modal State
  // ==============================
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  function showWarning(msg: string) {
    setWarningMessage(msg);
    setWarningOpen(true);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // Load all schools
  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data: SchoolItem[]) => {
        setAllSchools(data);
      })
      .catch((err) => {
        console.error("Failed to load schools:", err);
      });
  }, []);

  // ==============================
  // 1) All Posts
  // ==============================
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== "allPosts") return;

    setCurrentPage(0);
    loadAllPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser, filterPurpose, schoolSearchTerm]);

  async function loadAllPosts() {
    setLoadingPosts(true);
    try {
      const postsRef = collection(db, "studyBuddyPosts");
      const qBase = query(postsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(qBase);

      const postPromises = snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let userName = "User";
        let userSchoolId = data.schoolId ?? null;
        let userAvatar: string | null = null;

        if (data.userId) {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            userName = userDoc.data().userName || "User";
            userSchoolId = userDoc.data().schoolId || null;
            userAvatar = userDoc.data().userImageSrc || null;
          }
        }

        // Convert schoolId -> schoolName
        let userSchoolName = "";
        if (userSchoolId) {
          const schObj = allSchools.find((s) => s.id === userSchoolId);
          userSchoolName = schObj ? schObj.name : "";
        }

        return {
          id: docSnap.id,
          ...data,
          userName,
          userSchoolId,
          userSchoolName,
          userAvatar,
        };
      });

      const allPostsFetched = await Promise.all(postPromises);

      // Client-side filter
      let filtered = allPostsFetched;
      if (filterPurpose) {
        filtered = filtered.filter(
          (p) => (p as { purpose?: string }).purpose === filterPurpose
        );
      }
      if (schoolSearchTerm.trim()) {
        const term = schoolSearchTerm.toLowerCase();
        filtered = filtered.filter((p) =>
          p.userSchoolName?.toLowerCase().includes(term)
        );
      }

      setAllPostsRaw(filtered);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
    setLoadingPosts(false);
  }

  // Pagination
  const startIndex = currentPage * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const displayedPosts = allPostsRaw.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allPostsRaw.length / POSTS_PER_PAGE);

  function goToNextPage() {
    if (currentPage < totalPages - 1) setCurrentPage((prev) => prev + 1);
  }
  function goToPrevPage() {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  }

  // ==============================
  // Create Post (2 per month limit)
  // ==============================
  async function handleCreatePost() {
    setCreationError("");

    if (!postPurpose) {
      setCreationError("Bir çalışma amacı seçmelisiniz.");
      return;
    }
    const trimmedReason = postReason.trim();
    if (trimmedReason.length === 0) {
      setCreationError("Açıklama boş olamaz.");
      return;
    }
    if (trimmedReason.length > 256) {
      setCreationError("Açıklama 256 karakteri geçemez.");
      return;
    }

    if (!currentUser) return;

    // 2 posts in the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - THIRTY_DAYS_IN_MS);

    // Query how many posts user has in last 30 days
    const postsRef = collection(db, "studyBuddyPosts");
    const qUser = query(
      postsRef,
      where("userId", "==", currentUser.uid),
      where("createdAt", ">", Timestamp.fromDate(thirtyDaysAgo))
    );
    const snap = await getDocs(qUser);

    if (snap.size >= 2) {
      setCreationError("Aylık 2 gönderi sınırına ulaştınız.");
      return;
    }

    // Ok to create
    await addDoc(postsRef, {
      userId: currentUser.uid,
      purpose: postPurpose,
      reason: postReason.trim(),
      createdAt: serverTimestamp(),
    });
    setPostPurpose("");
    setPostReason("");
    setShowNewPostForm(false);
    setCreationError("");

    loadAllPosts();
  }

  // ==============================
  // Open chat with monthly limit (2 new distinct partners)
  // ==============================
  async function handleOpenChat(post: any) {
    if (!currentUser) return;
    if (post.userId === currentUser.uid) return; // can't chat with self

    setActiveTab("chats");

    // Check if chat with this user already exists
    const participants = [currentUser.uid, post.userId].sort();
    const cRef = collection(db, "studyBuddyChats");
    const qCheck = query(cRef, where("participants", "==", participants));
    const existing = await getDocs(qCheck);

    if (existing.empty) {
      // This is a brand-new chat with a new user => monthly limit check
      const now = Date.now();
      const thirtyDaysAgo = new Date(now - THIRTY_DAYS_IN_MS);

      const qC = query(
        cRef,
        where("participants", "array-contains", currentUser.uid),
        where("lastUpdated", ">", Timestamp.fromDate(thirtyDaysAgo))
      );
      const snapC = await getDocs(qC);

      // Distinct partner IDs
      const distinctPartners = new Set<string>();
      snapC.forEach((docSnap) => {
        const chatData = docSnap.data();
        const ps: string[] = chatData.participants || [];
        const other = ps.find((uid) => uid !== currentUser.uid);
        if (other) distinctPartners.add(other);
      });

      if (distinctPartners.size >= 2) {
        // Instead of alert, we show our WarningModal
        showWarning("Her ay en fazla 2 farklı kişiyle sohbet başlatabilirsiniz!");
        return;
      }

      // otherwise create new chat
      const newChatObj = {
        participants,
        participantsData: {},
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      };
      const newRef = await addDoc(cRef, newChatObj);
      const docSnap = await getDoc(newRef);
      if (docSnap.exists()) {
        setSelectedChat({ id: docSnap.id, ...docSnap.data() });
      }
    } else {
      // Chat already exists, just open it
      const docSnap = existing.docs[0];
      setSelectedChat({ id: docSnap.id, ...docSnap.data() });
    }
  }

  // ==============================
  // My Posts
  // ==============================
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== "myPosts") return;
    loadMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser]);

  async function loadMyPosts() {
    setLoadingMyPosts(true);
    try {
      const postsRef = collection(db, "studyBuddyPosts");
      const qMy = query(
        postsRef,
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(qMy);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyPosts(results);
    } catch (err) {
      console.error("Error loading my posts:", err);
    }
    setLoadingMyPosts(false);
  }

  function startEditingPost(post: any) {
    setEditingPostId(post.id);
    setEditPurpose(post.purpose || "");
    setEditReason(post.reason || "");
    setDeleteConfirmId(null);
  }
  function cancelEditPost() {
    setEditingPostId(null);
    setEditPurpose("");
    setEditReason("");
  }
  async function saveEditPost(postId: string) {
    const trimmedReason = editReason.trim();
    if (trimmedReason.length > 256) {
      setCreationError("Açıklama 256 karakteri geçemez.");
      return;
    }
    await updateDoc(doc(db, "studyBuddyPosts", postId), {
      purpose: editPurpose,
      reason: trimmedReason,
    });
    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, purpose: editPurpose, reason: editReason } : p
      )
    );
    cancelEditPost();
  }
  function startDeletePost(postId: string) {
    setDeleteConfirmId(postId);
    setEditingPostId(null);
  }
  function cancelDeletePost() {
    setDeleteConfirmId(null);
  }
  async function confirmDeletePost() {
    if (!deleteConfirmId) return;
    await deleteDoc(doc(db, "studyBuddyPosts", deleteConfirmId));
    setMyPosts((prev) => prev.filter((p) => p.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  }

  // ==============================
  // Chats
  // ==============================
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== "chats") return;

    setLoadingChats(true);
    const ref = collection(db, "studyBuddyChats");
    const qC = query(
      ref,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastUpdated", "desc")
    );
    const unsub = onSnapshot(qC, async (snap) => {
      const rawChats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // For each chat, fetch participants data (like avatar)
      const newChats = await Promise.all(
        rawChats.map(async (c: any) => {
          const newParts: any = {};
          for (const uid of c.participants) {
            const ud = await getDoc(doc(db, "users", uid));
            if (ud.exists()) {
              newParts[uid] = {
                userName: ud.data()?.userName || "User",
                avatarUrl: ud.data()?.userImageSrc || null,
              };
            } else {
              newParts[uid] = { userName: "User", avatarUrl: null };
            }
          }
          return { ...c, participantsData: newParts };
        })
      );
      setChats(newChats);
      setLoadingChats(false);
    });
    return () => unsub();
  }, [db, currentUser, activeTab]);

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    const msgsRef = collection(db, "studyBuddyMessages");
    const qM = query(
      msgsRef,
      where("chatId", "==", selectedChat.id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(qM, (msgSnap) => {
      const arr = msgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(arr);
    });
    return () => unsub();
  }, [db, selectedChat]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ==============================
  // Send Message (limit 100 per 30 days, each <=200 chars)
  // ==============================
  async function handleSendMessage() {
    if (!selectedChat) return;
    const trimmed = newMessage.trim();
    if (!trimmed) return; // empty
    if (trimmed.length > 200) {
      showWarning("Mesaj 200 karakteri aşamaz!");
      return;
    }

    // Check monthly message limit
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - THIRTY_DAYS_IN_MS);

    const msgsRef = collection(db, "studyBuddyMessages");
    // All messages from currentUser in last 30 days
    const qUserMsgs = query(
      msgsRef,
      where("sender", "==", currentUser.uid),
      where("createdAt", ">", Timestamp.fromDate(thirtyDaysAgo))
    );
    const snap = await getDocs(qUserMsgs);
    if (snap.size >= 100) {
      showWarning("Aylık 100 mesaj sınırına ulaştınız.");
      return;
    }

    // If checks pass, send
    const chatId = selectedChat.id;
    await addDoc(msgsRef, {
      chatId,
      sender: currentUser.uid,
      content: trimmed,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "studyBuddyChats", chatId), {
      lastMessage: trimmed,
      lastUpdated: serverTimestamp(),
    });
    setNewMessage("");
  }

  // ==============================
  // Guard
  // ==============================
  if (loadingUser) {
    return <div className="p-4">Yükleniyor...</div>;
  }
  if (!currentUser) {
    return <div className="p-4">Lütfen giriş yapın.</div>;
  }

  // Helper: Truncate last message
  function truncatedMessage(message: string, maxLength = 40) {
    if (!message) return "";
    return message.length > maxLength
      ? message.slice(0, maxLength) + "..."
      : message;
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-2 rounded-xl p-6 shadow-lg bg-white w-full max-w-[1200px] mx-auto flex-1 flex flex-col">
          {/* Tab Buttons */}
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
                {/* Filter Panel */}
                <div className="p-4 rounded-md bg-gray-100 flex flex-wrap gap-4 items-center">
                  {/* Purpose Filter */}
                  <div>
                    <label className="block text-sm font-medium">Bu Neyin Hazırlığı</label>
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

                  {/* School Search Input */}
                  <div>
                    <label className="block text-sm font-medium">Okula Göre Ara</label>
                    <input
                      type="text"
                      placeholder="Okul ismi..."
                      value={schoolSearchTerm}
                      onChange={(e) => setSchoolSearchTerm(e.target.value)}
                      className="mt-1 block rounded-md p-1 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Create New Post Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setShowNewPostForm(!showNewPostForm)}
                  >
                    Yenİ Gönderİ Oluştur
                  </Button>
                </div>

                {/* Create New Post Form */}
                {showNewPostForm && (
                  <div className="border-2 rounded-md p-4 space-y-3 bg-white mt-4 mx-1">
                    <h3 className="text-lg font-bold">Gönderi Oluştur</h3>
                    {creationError && (
                      <div className="text-red-500 text-sm">{creationError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium">Bu Neyin Hazırlığı</label>
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

                {/* Posts list container */}
                <div
                  className="
                    flex-1 mt-4 mx-1 border-2 rounded-md p-4 bg-white overflow-y-auto
                    scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200
                  "
                >
                  {loadingPosts ? (
                    <div>Yükleniyor...</div>
                  ) : (
                    <>
                      {displayedPosts.length === 0 ? (
                        <div>Post yok (veya filtreye uyan yok).</div>
                      ) : (
                        displayedPosts.map((post) => {
                          const createdAtDate = post.createdAt?.toDate
                            ? post.createdAt.toDate()
                            : null;

                          return (
                            <div
                              key={post.id}
                              className="border-b last:border-none py-3"
                            >
                              <div className="text-sm text-gray-500">
                                Oluşturulma Zamanı:{" "}
                                {createdAtDate
                                  ? createdAtDate.toLocaleString()
                                  : "N/A"}
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
                                  Bu Neyin Hazırlığı: {post.purpose}
                                </div>
                              )}
                              <div className="text-sm text-gray-700">
                                Açıklama: {post.reason}
                              </div>
                              {post.userId !== currentUser?.uid && (
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
                    </>
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
                <div
                  className="
                    flex-1 mt-2 border-2 rounded-md p-4 bg-white overflow-y-auto mx-1
                    scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200
                  "
                >
                  <h2 className="text-xl font-bold mb-4">My Posts</h2>
                  {loadingMyPosts ? (
                    <div>Yükleniyor...</div>
                  ) : myPosts.length === 0 ? (
                    <div>Hiç postunuz yok.</div>
                  ) : (
                    myPosts.map((post) => {
                      const isEditing = editingPostId === post.id;
                      const isDeleting = deleteConfirmId === post.id;
                      const createdAtDate = post.createdAt?.toDate
                        ? post.createdAt.toDate()
                        : null;

                      return (
                        <div
                          key={post.id}
                          className="border-b last:border-none py-3 space-y-2"
                        >
                          <div className="text-sm text-gray-500">
                            Oluşturulma Zamanı:{" "}
                            {createdAtDate
                              ? createdAtDate.toLocaleString()
                              : "N/A"}
                          </div>
                          {!isEditing ? (
                            <>
                              <div className="text-sm font-semibold">
                                Bu Neyin Hazırlığı: {post.purpose}
                              </div>
                              <div className="text-sm text-gray-700">
                                Açıklama: {post.reason}
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="block text-sm font-medium">
                                Bu Neyin Hazırlığı
                              </label>
                              <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={editPurpose}
                                onChange={(e) => setEditPurpose(e.target.value)}
                              >
                                <option value="">-Seç-</option>
                                {PURPOSE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <label className="block text-sm font-medium mt-2">
                                Açıklama
                              </label>
                              <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                              />
                            </>
                          )}

                          {/* Buttons */}
                          <div className="flex gap-2">
                            {!isEditing && !isDeleting && (
                              <>
                                <Button
                                  variant="primaryOutline"
                                  size="sm"
                                  onClick={() => startEditingPost(post)}
                                >
                                  Düzenle
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => startDeletePost(post.id)}
                                >
                                  Sil
                                </Button>
                              </>
                            )}
                            {isEditing && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => saveEditPost(post.id)}
                                >
                                  Kaydet
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditPost}
                                >
                                  İptal
                                </Button>
                              </>
                            )}
                            {isDeleting && (
                              <div className="flex items-center gap-2 text-sm">
                                <span>Silmek istediğinize emin misiniz?</span>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={confirmDeletePost}
                                >
                                  Evet, sil
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelDeletePost}
                                >
                                  İptal
                                </Button>
                              </div>
                            )}
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
                <div
                  className="
                    border-2 rounded-md p-4 bg-white w-full md:w-1/3
                    overflow-y-auto scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200
                  "
                >
                  <h2 className="text-xl font-bold mb-2">Sohbetler</h2>
                  {loadingChats ? (
                    <div>Yükleniyor...</div>
                  ) : chats.length === 0 ? (
                    <div>Hiç sohbet yok.</div>
                  ) : (
                    <ul className="space-y-2">
                      {chats.map((chat) => {
                        // find the other user
                        const otherUid = chat.participants.find(
                          (id: string) => id !== currentUser.uid
                        );
                        const otherData = chat.participantsData[otherUid];
                        const otherName = otherData?.userName || "User";
                        const otherAvatar = otherData?.avatarUrl || "/default.png";

                        const shortLastMsg = truncatedMessage(
                          chat.lastMessage,
                          12
                        );

                        return (
                          <li
                            key={chat.id}
                            className="border rounded p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSelectedChat(chat)}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={otherAvatar}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-semibold">{otherName}</div>
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
                      {/* Header */}
                      <div className="pb-2 mb-2 border-b">
                        <h3 className="text-lg font-semibold">Sohbet</h3>
                        <p className="text-sm text-gray-600">
                          {selectedChat.participants
                            .filter((uid: string) => uid !== currentUser.uid)
                            .map((uid: string) => {
                              const d = selectedChat.participantsData[uid];
                              return d?.userName || "User";
                            })
                            .join(", ")}
                        </p>
                      </div>

                      {/* Messages area (max ~15 lines) */}
                      <div
                        className="
                          overflow-y-auto overflow-x-hidden space-y-2 pr-2
                          scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200
                          max-h-80
                        "
                      >
                        {messages.map((msg) => {
                          const isMine = msg.sender === currentUser.uid;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`
                                  p-2 rounded mb-1 max-w-sm
                                  whitespace-pre-wrap break-words
                                  ${
                                    isMine
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-200 text-gray-800"
                                  }
                                `}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messageEndRef} />
                      </div>

                      {/* Message Input */}
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

      {/* Our WarningModal, displayed if warningOpen === true */}
      <WarningModal
        open={warningOpen}
        message={warningMessage}
        onClose={() => setWarningOpen(false)}
      />
    </>
  );
}
