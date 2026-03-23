import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { messageAPI } from "../api/axios";
import { useToast } from "../context/ToastContext";
import "../styles/Chat.css";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

const API_BASE = "http://localhost:5000";

const getMsgTime = (msg) =>
  msg?.createdAt || msg?.created_at || msg?.created_at_local || msg?.created || null;

const formatTime = (raw) => {
  if (!raw) return "";
  const d = dayjs(raw);
  return d.isValid() ? d.format("h:mm A") : "";
};

const formatRelativeTime = (raw) => {
  if (!raw) return "";
  const d = dayjs(raw);
  if (!d.isValid()) return "";
  const diff = dayjs().diff(d, "minute");
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.format("MMM D");
};

const formatDateLabel = (raw) => {
  if (!raw) return "";
  const d = dayjs(raw);
  if (!d.isValid()) return "";
  if (d.isToday()) return "Today";
  if (d.isYesterday()) return "Yesterday";
  return d.format("dddd, MMMM D");
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [conversations, setConversations]           = useState([]);
  const [messages, setMessages]                     = useState([]);
  const [activePartner, setActivePartner]           = useState(null);
  const [newMessage, setNewMessage]                 = useState("");
  const [loading, setLoading]                       = useState(true);
  const [sending, setSending]                       = useState(false);
  const [onlineUsers, setOnlineUsers]               = useState(new Set());
  const [partnerLoadedFromUrl, setPartnerLoadedFromUrl] = useState(false);

  // ✅ Image upload state
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightbox, setLightbox]         = useState(null);

  const messagesEndRef   = useRef(null);
  const socketRef        = useRef(null);
  const activePartnerRef = useRef(null);
  const textareaRef      = useRef(null);
  const fileInputRef     = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // ── SOCKET SETUP ──────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (currentUser.user_id) socket.emit("join_user", currentUser.user_id);
    });

    socket.on("online_users", (userIds) => {
      setOnlineUsers(new Set(userIds.map(Number)));
    });
    socket.on("user_online",  (userId) => setOnlineUsers((p) => new Set([...p, Number(userId)])));
    socket.on("user_offline", (userId) => {
      setOnlineUsers((p) => { const n = new Set(p); n.delete(Number(userId)); return n; });
    });

    socket.on("new_message", (message) => {
      const partner = activePartnerRef.current;
      const isRelevant =
        message.sender_id === partner?.partner_id ||
        message.receiver_id === partner?.partner_id;
      if (isRelevant) {
        setMessages((prev) => [...prev, message]);
        markAsRead(partner?.partner_id);
      }
      fetchConversations();
    });

    socket.on("message_read", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === currentUser.user_id ? { ...m, is_read: true } : m
        )
      );
    });

    socket.on("auction_won", (data) => {
      toast.success(`🎉 You won "${data.auction_title}"! Check your messages.`);
      fetchConversations();
    });

    fetchConversations();
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── URL partner param ──────────────────────────────────────
  useEffect(() => {
    const partnerId = searchParams.get("partner");
    if (!partnerId || partnerLoadedFromUrl) return;
    const numId = parseInt(partnerId);
    const found = conversations.find((c) => Number(c.partner_id) === numId);
    if (found) { selectConversation(found); setPartnerLoadedFromUrl(true); return; }
    setActivePartner({ partner_id: numId, partner_name: "Artisan", partner_image: null, unread_count: 0 });
    setPartnerLoadedFromUrl(true);
    messageAPI.getMessages(numId).then((res) => {
      if (res.data.success) setMessages(res.data.data);
    }).catch(() => {});
  }, [searchParams, conversations, partnerLoadedFromUrl]);

  useEffect(() => {
    const partnerId = searchParams.get("partner");
    if (!partnerId || !activePartner) return;
    const numId = parseInt(partnerId);
    const found = conversations.find((c) => Number(c.partner_id) === numId);
    if (found && activePartner.partner_name === "Artisan") {
      setActivePartner((p) => ({ ...p, partner_name: found.partner_name, partner_image: found.partner_image }));
    }
  }, [conversations, searchParams, activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API ──────────────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await messageAPI.getConversations();
      if (res.data.success) setConversations(res.data.data);
    } catch (err) {
      console.error("fetchConversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (partnerId) => {
    if (!partnerId) return;
    try {
      socketRef.current?.emit("messages_read", {
        reader_id: currentUser.user_id,
        partner_id: partnerId,
      });
    } catch (_) {}
  };

  const selectConversation = async (partner) => {
    setActivePartner(partner);
    setMessages([]);
    clearImageSelection();
    try {
      const res = await messageAPI.getMessages(partner.partner_id);
      if (res.data.success) {
        setMessages(res.data.data);
        setConversations((prev) =>
          prev.map((c) => c.partner_id === partner.partner_id ? { ...c, unread_count: 0 } : c)
        );
        markAsRead(partner.partner_id);
      }
    } catch (err) {
      console.error("selectConversation:", err);
    }
  };

  // ✅ Image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImageSelection = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Send — handles both text-only and image (multipart)
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text && !imageFile) return;
    if (!activePartner || sending) return;

    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);

    try {
      let res;

      if (imageFile) {
        // Use multipart/form-data
        const fd = new FormData();
        fd.append("receiver_id", activePartner.partner_id);
        if (text) fd.append("message_text", text);
        fd.append("image", imageFile);
        res = await messageAPI.sendMessageWithImage(fd);
      } else {
        res = await messageAPI.sendMessage({
          receiver_id: activePartner.partner_id,
          message_text: text,
        });
      }

      if (res.data.success) {
        clearImageSelection();
        setMessages((prev) => [...prev, res.data.data]);
        fetchConversations();
      }
    } catch (err) {
      console.error("handleSend:", err);
      toast.error("Failed to send message");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── HELPERS ──────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name || name === "Artisan") return "?";
    return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getMyImage = () => currentUser.profile_image || null;
  const getMyName  = () => currentUser.full_name || currentUser.name || "Me";
  const isOnline   = (userId) => onlineUsers.has(Number(userId));

  const getMessageStatus = (msg, isLastMine) => {
    if (msg.sender_id !== currentUser.user_id) return null;
    if (msg.is_read)
      return { ticks: "✓✓", tickColor: "#10B981", label: isLastMine ? "Seen" : null, labelColor: "#10B981" };
    if (msg.message_id)
      return { ticks: "✓✓", tickColor: "#9CA3AF", label: isLastMine ? "Delivered" : null, labelColor: "#9CA3AF" };
    return { ticks: "✓", tickColor: "#9CA3AF", label: isLastMine ? "Sent" : null, labelColor: "#9CA3AF" };
  };

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastKey = null;
    msgs.forEach((msg) => {
      const rawTime = getMsgTime(msg);
      const d = dayjs(rawTime);
      const key = d.isValid() ? d.format("YYYY-MM-DD") : "unknown";
      if (key !== lastKey) { groups.push({ type: "date", dateStr: rawTime }); lastKey = key; }
      groups.push({ type: "msg", data: msg });
    });
    return groups;
  };

  const getLastMineId = (msgs) => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender_id === currentUser.user_id) return msgs[i].message_id;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="chat-spinner" />
        <p>Loading messages...</p>
      </div>
    );
  }

  const grouped    = groupMessagesByDate(messages);
  const lastMineId = getLastMineId(messages);
  const myImage    = getMyImage();
  const myName     = getMyName();

  return (
    <div className="chat-page">
      <h1 className="chat-page-title">Messages</h1>

      <div className="chat-container">
        {/* ── SIDEBAR ── */}
        <div className={`chat-sidebar ${activePartner ? "hide-mobile" : ""}`}>
          <div className="chat-sidebar-header">
            <span>Conversations</span>
            {conversations.some((c) => c.unread_count > 0) && (
              <span className="total-unread">
                {conversations.reduce((s, c) => s + (c.unread_count || 0), 0)}
              </span>
            )}
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>No messages yet</p>
                <small>Click "Chat with Artisan" on any product to start</small>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.partner_id}
                  className={`conversation-item ${activePartner?.partner_id === conv.partner_id ? "active" : ""}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-avatar-wrap">
                    <div className="conv-avatar">
                      {conv.partner_image
                        ? <img src={`${API_BASE}${conv.partner_image}`} alt={conv.partner_name} />
                        : <span>{getInitials(conv.partner_name)}</span>}
                    </div>
                    {isOnline(conv.partner_id) && <div className="conv-online-dot" />}
                  </div>

                  <div className="conv-info">
                    <div className="conv-header-row">
                      <span className="conv-name">{conv.partner_name}</span>
                      <span className="conv-time">{formatRelativeTime(conv.last_message_time)}</span>
                    </div>
                    <div className="conv-preview">
                      <span className={`conv-last-msg ${conv.unread_count > 0 ? "unread-msg" : ""}`}>
                        {conv.last_message || "Start a conversation"}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className={`chat-main ${!activePartner ? "hide-mobile" : ""}`}>
          {!activePartner ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose from the left to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <button className="back-btn" onClick={() => { setActivePartner(null); setMessages([]); clearImageSelection(); }}>
                  ←
                </button>
                <div className="chat-header-avatar">
                  {activePartner.partner_image
                    ? <img src={`${API_BASE}${activePartner.partner_image}`} alt="" />
                    : <span>{getInitials(activePartner.partner_name)}</span>}
                </div>
                <div className="chat-header-info">
                  <h3>{activePartner.partner_name}</h3>
                  <span className={`partner-status ${isOnline(activePartner.partner_id) ? "is-online" : "is-offline"}`}>
                    {isOnline(activePartner.partner_id) ? "● Online" : "● Offline"}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-msg-avatar">
                      {activePartner.partner_image
                        ? <img src={`${API_BASE}${activePartner.partner_image}`} alt="" />
                        : <span>{getInitials(activePartner.partner_name)}</span>}
                    </div>
                    <p className="no-msg-name">{activePartner.partner_name}</p>
                    <p className="no-msg-hint">No messages yet — say hello! 👋</p>
                  </div>
                ) : (
                  grouped.map((item, i) => {
                    if (item.type === "date") {
                      return (
                        <div key={`date-${i}`} className="date-divider">
                          <span>{formatDateLabel(item.dateStr)}</span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    const isMine     = msg.sender_id === currentUser.user_id;
                    const isLastMine = isMine && msg.message_id === lastMineId;
                    const status     = getMessageStatus(msg, isLastMine);
                    const timeStr    = formatTime(getMsgTime(msg));

                    return (
                      <div
                        key={msg.message_id || `m-${i}`}
                        className={`message-wrapper ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="msg-avatar">
                          {isMine
                            ? myImage
                              ? <img src={`${API_BASE}${myImage}`} alt="me" />
                              : <span>{getInitials(myName)}</span>
                            : activePartner.partner_image
                              ? <img src={`${API_BASE}${activePartner.partner_image}`} alt="" />
                              : <span>{getInitials(activePartner.partner_name)}</span>}
                        </div>

                        <div className="message-bubble-group">
                          <div className={`message-bubble ${isMine ? "bubble-mine" : "bubble-theirs"}`}>
                            {/* ✅ Image inside bubble */}
                            {msg.image_url && (
                              <img
                                src={`${API_BASE}${msg.image_url}`}
                                alt="shared"
                                className="msg-image"
                                onClick={() => setLightbox(`${API_BASE}${msg.image_url}`)}
                              />
                            )}
                            {/* Text below image if both present */}
                            {msg.message_text && (
                              <span className={msg.image_url ? "msg-text-below-img" : ""}>
                                {msg.message_text}
                              </span>
                            )}
                          </div>

                          <div className="message-meta">
                            {timeStr && <span className="message-time">{timeStr}</span>}
                            {status && (
                              <>
                                <span className="message-ticks" style={{ color: status.tickColor }}>
                                  {status.ticks}
                                </span>
                                {status.label && (
                                  <span className="message-status-label" style={{ color: status.labelColor }}>
                                    {status.label}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ✅ Image preview strip above input */}
              {imagePreview && (
                <div className="chat-image-preview">
                  <div className="chat-image-preview-inner">
                    <img src={imagePreview} alt="preview" />
                    <button className="chat-image-preview-rm" onClick={clearImageSelection} title="Remove">
                      ×
                    </button>
                  </div>
                  <span className="chat-image-preview-label">Image ready to send</span>
                </div>
              )}

              {/* Input */}
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  {/* ✅ Image upload button */}
                  <button
                    className="chat-img-btn"
                    type="button"
                    title="Send image"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    hidden
                    onChange={handleImageSelect}
                  />

                  <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={imageFile ? "Add a caption... (optional)" : "Type your message..."}
                    rows="1"
                  />

                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={sending || (!newMessage.trim() && !imageFile)}
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/*  Image lightbox */}
      {lightbox && (
        <div className="chat-lightbox" onClick={() => setLightbox(null)}>
          <button className="chat-lightbox-x">×</button>
          <img src={lightbox} alt="full size" className="chat-lightbox-img" />
        </div>
      )}
    </div>
  );
};

export default Chat;