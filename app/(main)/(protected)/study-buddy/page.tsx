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
} from "firebase/firestore";

export default function StudyBuddyPage() {
  const db = getFirestore();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState<"posts" | "chats">("posts");

  // Posts
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postSchool, setPostSchool] = useState("");
  const [postReason, setPostReason] = useState("");

  // Chats
  const [chats, setChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Selected chat
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 1) Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // 2) Listen to Posts
  useEffect(() => {
    if (activeTab === "posts") {
      setLoadingPosts(true);
      const postsRef = collection(db, "studyBuddyPosts");
      const qPosts = query(postsRef, orderBy("createdAt", "desc"));

      const unsubPosts = onSnapshot(qPosts, async (snapshot) => {
        const rawPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // We assume each doc has { userId, school, reason, createdAt }
        // We'll fetch user doc from Firestore => users/{userId} to get "userName"
        const newPosts = await Promise.all(
          rawPosts.map(async (p) => {
            const userDoc = await getDoc(doc(db, "users", p.userId));
            let userName = "User";
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData?.userName || "User";
            }
            return { ...p, userName };
          })
        );

        setPosts(newPosts);
        setLoadingPosts(false);
      });

      return () => unsubPosts();
    }
  }, [db, activeTab]);

  // 3) Listen to Chats
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === "chats") {
      setLoadingChats(true);
      const chatsRef = collection(db, "studyBuddyChats");
      const qChats = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid),
        orderBy("lastUpdated", "desc")
      );

      const unsubChats = onSnapshot(qChats, async (snapshot) => {
        const rawChats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // For each participant in each chat, fetch user doc => userName
        const newChats = await Promise.all(
          rawChats.map(async (chatObj) => {
            const newParticipantsData: any = {};
            for (const uid of chatObj.participants) {
              const userDoc = await getDoc(doc(db, "users", uid));
              newParticipantsData[uid] = {
                userName: userDoc.exists()
                  ? userDoc.data()?.userName || "User"
                  : "User",
              };
            }
            return {
              ...chatObj,
              participantsData: newParticipantsData,
            };
          })
        );

        setChats(newChats);
        setLoadingChats(false);
      });

      return () => unsubChats();
    }
  }, [db, currentUser, activeTab]);

  // 4) Listen to Messages
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    const msgsRef = collection(db, "studyBuddyMessages");
    const qMsgs = query(msgsRef, where("chatId", "==", selectedChat.id), orderBy("createdAt", "asc"));

    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(arr);
    });
    return () => unsubMsgs();
  }, [db, selectedChat]);

  // Auto-scroll
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loadingUser) {
    return <div className="p-4">Kullanıcı kontrol ediliyor...</div>;
  }
  if (!currentUser) {
    return <div className="p-4">Lütfen giriş yapın.</div>;
  }

  // CREATE POST (store only userId => we'll fetch user from "users/{uid}")
  const handleCreatePost = async () => {
    if (!currentUser) return;
    const newPost = {
      userId: currentUser.uid,
      school: postSchool.trim(),
      reason: postReason.trim(),
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "studyBuddyPosts"), newPost);
    setPostSchool("");
    setPostReason("");
    setShowPostForm(false);
  };

  // Open Chat from a Post
  const handleOpenChat = async (post: any) => {
    if (post.userId === currentUser.uid) return;
    setActiveTab("chats");

    const participants = [currentUser.uid, post.userId].sort();
    const qCheck = query(
      collection(db, "studyBuddyChats"),
      where("participants", "==", participants)
    );
    const existing = await getDocs(qCheck);

    let chatRef = null;
    if (!existing.empty) {
      chatRef = existing.docs[0].ref;
    } else {
      // Basic doc => no "userName" fields
      const newChatObj = {
        participants,
        participantsData: {}, // We'll fill from "users/{uid}" automatically
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      };
      chatRef = await addDoc(collection(db, "studyBuddyChats"), newChatObj);
    }

    if (chatRef) {
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists()) {
        setSelectedChat({ id: docSnap.id, ...docSnap.data() });
      }
    }
  };

  const openChatFromList = (chat: any) => {
    setSelectedChat(chat);
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !currentUser || !newMessage.trim()) return;
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
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* LEFT COLUMN */}
      <div className="w-full md:w-1/3 border rounded p-4 space-y-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={
              activeTab === "posts"
                ? "bg-green-500 text-white px-3 py-1 rounded"
                : "bg-gray-200 px-3 py-1 rounded"
            }
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={
              activeTab === "chats"
                ? "bg-green-500 text-white px-3 py-1 rounded"
                : "bg-gray-200 px-3 py-1 rounded"
            }
          >
            Chats
          </button>
        </div>

        {activeTab === "posts" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Study Buddy Posts</h2>
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="px-3 py-2 bg-green-500 text-white rounded"
              >
                New Post
              </button>
            </div>
            {showPostForm && (
              <div className="border rounded p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Okul/Üniversite adı..."
                  value={postSchool}
                  onChange={(e) => setPostSchool(e.target.value)}
                  className="w-full border rounded p-2"
                />
                <textarea
                  placeholder="Neden çalışma arkadaşı arıyorsun?"
                  value={postReason}
                  onChange={(e) => setPostReason(e.target.value)}
                  className="w-full border rounded p-2"
                />
                <button
                  onClick={handleCreatePost}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Gönderiyi Oluştur
                </button>
              </div>
            )}

            {loadingPosts ? (
              <div>Yükleniyor...</div>
            ) : posts.length === 0 ? (
              <div>Henüz hiç gönderi yok.</div>
            ) : (
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="border p-3 rounded space-y-1">
                    <div className="text-sm text-gray-500">
                      Tarih:{" "}
                      {p.createdAt?.toDate
                        ? p.createdAt.toDate().toLocaleString()
                        : "N/A"}
                    </div>
                    <div className="font-semibold">Gönderen: {p.userName}</div>
                    {p.school && <div className="text-sm">Okul: {p.school}</div>}
                    <div className="text-sm text-gray-700">Açıklama: {p.reason}</div>
                    {p.userId !== currentUser.uid && (
                      <button
                        onClick={() => handleOpenChat(p)}
                        className="mt-1 px-2 py-1 bg-green-500 text-white text-sm rounded"
                      >
                        Mesaj At
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "chats" && (
          <>
            <h2 className="text-xl font-bold mb-2">Sohbetler</h2>
            {loadingChats ? (
              <div>Yükleniyor...</div>
            ) : chats.length === 0 ? (
              <div>Hiç sohbet yok.</div>
            ) : (
              <ul className="space-y-3">
                {chats.map((chat) => {
                  // The other participant's userName is in chat.participantsData
                  const otherUid = chat.participants.find(
                    (id: string) => id !== currentUser.uid
                  );
                  const otherName =
                    chat.participantsData[otherUid]?.userName || "User";

                  return (
                    <li
                      key={chat.id}
                      className="border p-3 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => openChatFromList(chat)}
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
          </>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full md:w-2/3 border rounded p-4 flex flex-col">
        {!selectedChat ? (
          <div className="text-gray-500">
            Bir sohbet seçin veya bir gönderi aracılığıyla sohbet başlatın.
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
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
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
  );
}
