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
} from "firebase/firestore";

// Types for schools
type SchoolItem = {
  id: number;
  name: string;
};

// Pagination settings
const POSTS_PER_PAGE = 10;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default function StudyBuddyPage() {
  const db = getFirestore();

  // ==============================
  // Auth
  // ==============================
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Tabs: allPosts, myPosts, chats
  const [activeTab, setActiveTab] = useState<"allPosts" | "myPosts" | "chats">(
    "allPosts"
  );

  // ==============================
  // School data + Filters
  // ==============================
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const PURPOSE_OPTIONS = [
    "YKS sınavı",
    "TUS Sınavı",
    "ALES Sınavı",
    "KPSS Sınavı",
    "LGS sınavı",
    "Üniversite Vizeleri",
    "Kitap okuma",
    "Yazılım Öğrenme",
    "Tez Çalışması",
    "Yüksek Lisans Çalışması",
    "Lise okul sınavı",
    "Diğer",
  ];
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterSchoolId, setFilterSchoolId] = useState("");

  // ==============================
  // 1) All Posts (with local pagination)
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
  // Auth effect
  // ==============================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // ==============================
  // Load all schools
  // ==============================
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
  // 1) All Posts: we fetch everything at once based on filters
  // ==============================
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== "allPosts") return;

    // We reset pagination
    setCurrentPage(0);
    loadAllPosts();
  }, [activeTab, currentUser, filterPurpose, filterSchoolId]);

  async function loadAllPosts() {
    setLoadingPosts(true);
    // We'll do a single Firestore query that sorts by createdAt desc
    // Then we do local filtering or handle the filtering in the query if you store schoolId in post doc.
    try {
      const postsRef = collection(db, "studyBuddyPosts");
      let qBase = query(postsRef, orderBy("createdAt", "desc"));
      // If you do store the schoolId in the doc, you can do:
      // if (filterSchoolId) qBase = query(qBase, where("schoolId", "==", Number(filterSchoolId)));
      // if (filterPurpose) qBase = query(qBase, where("purpose", "==", filterPurpose));

      const snap = await getDocs(qBase);
      const postPromises = snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let userName = "User";
        let userSchoolId = data.schoolId ?? null;

        // If we do not store the schoolId in the doc, fetch from user doc:
        if (data.userId) {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            userName = userDoc.data().userName || "User";
            userSchoolId = userDoc.data().schoolId || null;
          }
        }

        return {
          id: docSnap.id,
          ...data,
          userName,
          userSchoolId,
        };
      });
      const allPostsFetched = await Promise.all(postPromises);

      // client-side filter:
      let filtered = allPostsFetched;
      if (filterPurpose) {
        filtered = filtered.filter((p) => (p as { purpose?: string }).purpose === filterPurpose);
      }
      if (filterSchoolId) {
        filtered = filtered.filter(
          (p) => String(p.userSchoolId) === filterSchoolId
        );
      }

      setAllPostsRaw(filtered);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
    setLoadingPosts(false);
  }

  // Now we slice the raw array for the current page
  const startIndex = currentPage * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const displayedPosts = allPostsRaw.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allPostsRaw.length / POSTS_PER_PAGE);

  function goToNextPage() {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  }
  function goToPrevPage() {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  // ==============================
  // Create Post (one per month limit)
  // ==============================
  async function handleCreatePost() {
    setCreationError("");
    if (!postPurpose) {
      setCreationError("Bir çalışma amacı seçmelisiniz.");
      return;
    }
    // check last post date
    const userPostsRef = collection(db, "studyBuddyPosts");
    const qUser = query(
      userPostsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      fsLimit(1)
    );
    const snap = await getDocs(qUser);
    if (!snap.empty) {
      const lastPost = snap.docs[0].data();
      const lastTime = lastPost.createdAt?.toDate?.();
      if (lastTime) {
        const diff = Date.now() - lastTime.getTime();
        if (diff < THIRTY_DAYS_IN_MS) {
          const daysRemaining = Math.ceil(
            (THIRTY_DAYS_IN_MS - diff) / (1000 * 60 * 60 * 24)
          );
          setCreationError(
            `Son 30 gün içinde bir post oluşturdunuz. ${daysRemaining} gün daha beklemelisiniz.`
          );
          return;
        }
      }
    }

    // create doc
    await addDoc(userPostsRef, {
      userId: currentUser.uid,
      purpose: postPurpose,
      reason: postReason.trim(),
      createdAt: serverTimestamp(),
      // optionally store schoolId if you want
      // schoolId: ...
    });
    setPostPurpose("");
    setPostReason("");
    setShowNewPostForm(false);
    setCreationError("");

    // re-load
    loadAllPosts();
  }

  // open chat from post
  async function handleOpenChat(post: any) {
    if (post.userId === currentUser.uid) return;
    setActiveTab("chats");

    const participants = [currentUser.uid, post.userId].sort();
    const cRef = collection(db, "studyBuddyChats");
    const qCheck = query(cRef, where("participants", "==", participants));
    const existing = await getDocs(qCheck);

    let chatRef = null;
    if (!existing.empty) {
      chatRef = existing.docs[0].ref;
    } else {
      const newChatObj = {
        participants,
        participantsData: {},
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      };
      chatRef = await addDoc(cRef, newChatObj);
    }
    if (chatRef) {
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists()) {
        setSelectedChat({ id: docSnap.id, ...docSnap.data() });
      }
    }
  }

  // ==============================
  // My Posts
  // ==============================
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== "myPosts") return;
    loadMyPosts();
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
      const results = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
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
    await updateDoc(doc(db, "studyBuddyPosts", postId), {
      purpose: editPurpose,
      reason: editReason,
    });
    // update local state
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
      const newChats = await Promise.all(
        rawChats.map(async (c: any) => {
          const newParts: any = {};
          for (const uid of c.participants) {
            const ud = await getDoc(doc(db, "users", uid));
            if (ud.exists()) {
              newParts[uid] = {
                userName: ud.data()?.userName || "User",
              };
            } else {
              newParts[uid] = { userName: "User" };
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

  async function handleSendMessage() {
    if (!selectedChat || !newMessage.trim()) return;
    const chatId = selectedChat.id;
    await addDoc(collection(db, "studyBuddyMessages"), {
      chatId,
      sender: currentUser.uid,
      content: newMessage.trim(),
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "studyBuddyChats", chatId), {
      lastMessage: newMessage.trim(),
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

  // Now we can render
  return (
    <div className="max-w-[1200px] mx-auto p-4 flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "allPosts" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("allPosts")}
        >
          All Posts
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "myPosts" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("myPosts")}
        >
          My Posts
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "chats" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
      </div>

      {/* ALL POSTS TAB */}
      {activeTab === "allPosts" && (
        <div className="flex flex-col gap-4">
          {/* Filter Panel */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-100 rounded">
            <div>
              <label className="block text-sm font-semibold">Amaç</label>
              <select
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
                className="border p-2 rounded"
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
              <label className="block text-sm font-semibold">Okul</label>
              <select
                value={filterSchoolId}
                onChange={(e) => setFilterSchoolId(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">Hepsi</option>
                {allSchools.map((sch) => (
                  <option key={sch.id} value={String(sch.id)}>
                    {sch.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="ml-auto bg-blue-600 text-white px-3 py-2 rounded"
            >
              Create New Post
            </button>
          </div>

          {/* Create New Post Form */}
          {showNewPostForm && (
            <div className="p-4 border bg-white rounded">
              <h3 className="text-lg font-bold mb-2">Create a Post</h3>
              {creationError && (
                <div className="text-red-500 text-sm mb-2">{creationError}</div>
              )}
              <div className="mb-2">
                <label className="block text-sm font-semibold">Amaç</label>
                <select
                  className="border p-2 rounded w-full"
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
              <div className="mb-2">
                <label className="block text-sm font-semibold">Açıklama</label>
                <textarea
                  className="border p-2 rounded w-full"
                  value={postReason}
                  onChange={(e) => setPostReason(e.target.value)}
                  placeholder="Neden çalışma arkadaşı arıyorsun?"
                />
              </div>
              <button
                onClick={handleCreatePost}
                className="bg-green-600 text-white px-3 py-2 rounded"
              >
                Gönder
              </button>
            </div>
          )}

          {/* Displayed Posts (currentPage slice) */}
          <div className="bg-white border p-4 rounded min-h-[200px]">
            {loadingPosts ? (
              <div>Yükleniyor...</div>
            ) : (
              <>
                {displayedPosts.length === 0 ? (
                  <div>Post yok (veya filtreye uyan yok).</div>
                ) : (
                  displayedPosts.map((post) => {
                    // Find userSchoolId => school name
                    let schoolName = "";
                    if (post.userSchoolId) {
                      const found = allSchools.find(
                        (s) => s.id === post.userSchoolId
                      );
                      schoolName = found ? found.name : "";
                    }
                    const createdAtDate = post.createdAt?.toDate
                      ? post.createdAt.toDate()
                      : null;
                    return (
                      <div
                        key={post.id}
                        className="border-b last:border-none py-3"
                      >
                        <div className="text-sm text-gray-500">
                          Tarih:{" "}
                          {createdAtDate
                            ? createdAtDate.toLocaleString()
                            : "N/A"}
                        </div>
                        <div className="font-semibold">
                          Gönderen: {post.userName}
                        </div>
                        {schoolName && (
                          <div className="text-sm">Okul: {schoolName}</div>
                        )}
                        {post.purpose && (
                          <div className="text-sm">Amaç: {post.purpose}</div>
                        )}
                        <div className="text-sm text-gray-700">
                          Açıklama: {post.reason}
                        </div>
                        {post.userId !== currentUser.uid && (
                          <button
                            onClick={() => handleOpenChat(post)}
                            className="mt-1 px-2 py-1 bg-green-500 text-white text-sm rounded"
                          >
                            Mesaj At
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                {/* Pagination Buttons */}
                <div className="flex justify-between mt-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                    className="px-3 py-1 bg-blue-200 rounded disabled:opacity-50"
                  >
                    Önceki Sayfa
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 bg-blue-200 rounded disabled:opacity-50"
                  >
                    Sonraki Sayfa
                  </button>
                </div>
                <div className="text-sm text-gray-700 mt-2">
                  Sayfa {currentPage + 1} / {totalPages}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MY POSTS TAB */}
      {activeTab === "myPosts" && (
        <div className="bg-white border p-4 rounded min-h-[200px]">
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
                    Tarih:{" "}
                    {createdAtDate ? createdAtDate.toLocaleString() : "N/A"}
                  </div>
                  {!isEditing && (
                    <>
                      <div className="text-sm font-semibold">
                        Amaç: {post.purpose}
                      </div>
                      <div className="text-sm text-gray-700">
                        Açıklama: {post.reason}
                      </div>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <label className="block text-sm font-semibold">
                        Amaç
                      </label>
                      <select
                        className="border p-1 rounded w-full"
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
                      <label className="block text-sm font-semibold mt-2">
                        Açıklama
                      </label>
                      <textarea
                        className="border p-1 rounded w-full"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                      />
                    </>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {!isEditing && !isDeleting && (
                      <>
                        <button
                          onClick={() => startEditingPost(post)}
                          className="px-2 py-1 bg-yellow-300 rounded text-black text-sm"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => startDeletePost(post.id)}
                          className="px-2 py-1 bg-red-500 rounded text-white text-sm"
                        >
                          Sil
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => saveEditPost(post.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={cancelEditPost}
                          className="px-2 py-1 bg-gray-300 rounded text-sm"
                        >
                          İptal
                        </button>
                      </>
                    )}
                    {isDeleting && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>Silmek istediğinize emin misiniz?</span>
                        <button
                          onClick={confirmDeletePost}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                        >
                          Evet, sil
                        </button>
                        <button
                          onClick={cancelDeletePost}
                          className="px-2 py-1 bg-gray-300 rounded"
                        >
                          İptal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CHATS TAB */}
      {activeTab === "chats" && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Chat List */}
          <div className="w-full md:w-1/3 border p-4 rounded space-y-2">
            <h2 className="text-xl font-bold mb-2">Sohbetler</h2>
            {loadingChats ? (
              <div>Yükleniyor...</div>
            ) : chats.length === 0 ? (
              <div>Hiç sohbet yok.</div>
            ) : (
              <ul className="space-y-3">
                {chats.map((chat) => {
                  const otherUid = chat.participants.find(
                    (id: string) => id !== currentUser.uid
                  );
                  const otherName =
                    chat.participantsData[otherUid]?.userName || "User";
                  return (
                    <li
                      key={chat.id}
                      className="border p-3 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="font-semibold">{otherName}</div>
                      <div className="text-sm text-gray-600">
                        {chat.lastMessage || ""}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Chat Messages */}
          <div className="w-full md:w-2/3 border p-4 rounded flex flex-col">
            {!selectedChat ? (
              <div className="text-gray-500">
                Bir sohbet seçmek için sol listeden tıklayın.
              </div>
            ) : (
              <>
                <div className="pb-2 mb-2 border-b">
                  <h3 className="text-lg font-semibold">Chat</h3>
                  <p className="text-sm text-gray-600">
                    {selectedChat.participants
                      .filter((uid: string) => uid !== currentUser.uid)
                      .map(
                        (uid: string) => selectedChat.participantsData[uid]?.userName
                      )
                      .join(", ")}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-2">
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
                          className={`p-2 rounded mb-1 max-w-xs ${
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

                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border p-2 rounded"
                    placeholder="Mesaj..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Gönder
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
