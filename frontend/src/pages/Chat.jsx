import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { messageAPI } from "../api/axios";
import "../styles/Chat.css";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

// Register dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// Supports createdAt OR created_at 
const getMsgTime = (msg) =>
  msg?.createdAt ||
  msg?.created_at ||
  msg?.created_at_local ||
  msg?.created ||
  null;

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
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [partnerLoadedFromUrl, setPartnerLoadedFromUrl] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activePartnerRef = useRef(null);
  const textareaRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // ── SOCKET SETUP ────────────────────────────────────────────
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
      if (currentUser.user_id) {
        socket.emit("join_user", currentUser.user_id);
      }
    });

    socket.on("online_users", (userIds) => {
      setOnlineUsers(new Set(userIds.map(Number)));
    });

    socket.on("user_online", (userId) => {
      setOnlineUsers((prev) => new Set([...prev, Number(userId)]));
    });

    socket.on("user_offline", (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(Number(userId));
        return next;
      });
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
      alert(`🎉 You won "${data.auction_title}"! Check your messages.`);
      fetchConversations();
    });

    fetchConversations();

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── "Chat with Artisan" button (URL partner param) ──────────
  useEffect(() => {
    const partnerId = searchParams.get("partner");
    if (!partnerId || partnerLoadedFromUrl) return;

    const numId = parseInt(partnerId);
    const found = conversations.find((c) => Number(c.partner_id) === numId);

    if (found) {
      selectConversation(found);
      setPartnerLoadedFromUrl(true);
      return;
    }

    // Temporary partner if convo not loaded yet
    setActivePartner({
      partner_id: numId,
      partner_name: "Artisan",
      partner_image: null,
      unread_count: 0,
    });
    setPartnerLoadedFromUrl(true);

    messageAPI
      .getMessages(numId)
      .then((res) => {
        if (res.data.success) setMessages(res.data.data);
      })
      .catch(() => {});
  }, [searchParams, conversations, partnerLoadedFromUrl]);

  // Update placeholder partner name once conversations load
  useEffect(() => {
    const partnerId = searchParams.get("partner");
    if (!partnerId || !activePartner) return;
    const numId = parseInt(partnerId);
    const found = conversations.find((c) => Number(c.partner_id) === numId);

    if (found && activePartner.partner_name === "Artisan") {
      setActivePartner((prev) => ({
        ...prev,
        partner_name: found.partner_name,
        partner_image: found.partner_image,
      }));
    }
  }, [conversations, searchParams, activePartner]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API CALLS 
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
      if (messageAPI.markAsRead) await messageAPI.markAsRead(partnerId);
      socketRef.current?.emit("messages_read", {
        reader_id: currentUser.user_id,
        partner_id: partnerId,
      });
    } catch (_) {}
  };

  const selectConversation = async (partner) => {
    setActivePartner(partner);
    setMessages([]);
    try {
      const res = await messageAPI.getMessages(partner.partner_id);
      if (res.data.success) {
        setMessages(res.data.data);
        setConversations((prev) =>
          prev.map((c) =>
            c.partner_id === partner.partner_id ? { ...c, unread_count: 0 } : c
          )
        );
        markAsRead(partner.partner_id);
      }
    } catch (err) {
      console.error("selectConversation:", err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activePartner || sending) return;
    const text = newMessage.trim();
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);

    try {
      const res = await messageAPI.sendMessage({
        receiver_id: activePartner.partner_id,
        message_text: text,
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        fetchConversations();
      }
    } catch (err) {
      console.error("handleSend:", err);
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

  // ── HELPERS 
  const getInitials = (name) => {
    if (!name || name === "Artisan") return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMyImage = () => currentUser.profile_image || null;
  const getMyName = () => currentUser.full_name || currentUser.name || "Me";
  const isOnline = (userId) => onlineUsers.has(Number(userId));

  // Sent = ✓ gray | Delivered = ✓✓ gray | Seen = ✓✓ green
  const getMessageStatus = (msg, isLastMine) => {
    if (msg.sender_id !== currentUser.user_id) return null;
    if (msg.is_read)
      return {
        ticks: "✓✓",
        tickColor: "#10B981",
        label: isLastMine ? "Seen" : null,
        labelColor: "#10B981",
      };

    if (msg.message_id)
      return {
        ticks: "✓✓",
        tickColor: "#9CA3AF",
        label: isLastMine ? "Delivered" : null,
        labelColor: "#9CA3AF",
      };

    return {
      ticks: "✓",
      tickColor: "#9CA3AF",
      label: isLastMine ? "Sent" : null,
      labelColor: "#9CA3AF",
    };
  };

  // Group messages by date for dividers
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastKey = null;

    msgs.forEach((msg) => {
      const rawTime = getMsgTime(msg);
      const d = dayjs(rawTime);
      const key = d.isValid() ? d.format("YYYY-MM-DD") : "unknown";

      if (key !== lastKey) {
        groups.push({ type: "date", dateStr: rawTime });
        lastKey = key;
      }

      groups.push({ type: "msg", data: msg });
    });

    return groups;
  };

  // ID of the last message I sent (shows Seen/Delivered/Sent label)
  const getLastMineId = (msgs) => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].sender_id === currentUser.user_id) return msgs[i].message_id;
    }
    return null;
  };

  // ── LOADING 
  if (loading) {
    return (
      <div className="chat-loading">
        <div className="chat-spinner" />
        <p>Loading messages...</p>
      </div>
    );
  }

  // Quick debug in console 
  console.log(
    "CHAT_FIRST_MSG_TIME:",
    messages?.[0]?.createdAt,
    messages?.[0]?.created_at
  );

  const grouped = groupMessagesByDate(messages);
  const lastMineId = getLastMineId(messages);
  const myImage = getMyImage();
  const myName = getMyName();

  // ── RENDER 
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
                  className={`conversation-item ${
                    activePartner?.partner_id === conv.partner_id ? "active" : ""
                  }`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-avatar-wrap">
                    <div className="conv-avatar">
                      {conv.partner_image ? (
                        <img
                          src={`http://localhost:5000${conv.partner_image}`}
                          alt={conv.partner_name}
                        />
                      ) : (
                        <span>{getInitials(conv.partner_name)}</span>
                      )}
                    </div>
                    {isOnline(conv.partner_id) && (
                      <div className="conv-online-dot" />
                    )}
                  </div>

                  <div className="conv-info">
                    <div className="conv-header-row">
                      <span className="conv-name">{conv.partner_name}</span>
                      <span className="conv-time">
                        {formatRelativeTime(conv.last_message_time)}
                      </span>
                    </div>
                    <div className="conv-preview">
                      <span
                        className={`conv-last-msg ${
                          conv.unread_count > 0 ? "unread-msg" : ""
                        }`}
                      >
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
                <button
                  className="back-btn"
                  onClick={() => {
                    setActivePartner(null);
                    setMessages([]);
                  }}
                >
                  ←
                </button>

                <div className="chat-header-avatar">
                  {activePartner.partner_image ? (
                    <img
                      src={`http://localhost:5000${activePartner.partner_image}`}
                      alt=""
                    />
                  ) : (
                    <span>{getInitials(activePartner.partner_name)}</span>
                  )}
                </div>

                <div className="chat-header-info">
                  <h3>{activePartner.partner_name}</h3>
                  <span
                    className={`partner-status ${
                      isOnline(activePartner.partner_id)
                        ? "is-online"
                        : "is-offline"
                    }`}
                  >
                    {isOnline(activePartner.partner_id) ? "● Online" : "● Offline"}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-msg-avatar">
                      {activePartner.partner_image ? (
                        <img
                          src={`http://localhost:5000${activePartner.partner_image}`}
                          alt=""
                        />
                      ) : (
                        <span>{getInitials(activePartner.partner_name)}</span>
                      )}
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
                    const isMine = msg.sender_id === currentUser.user_id;
                    const isLastMine = isMine && msg.message_id === lastMineId;
                    const status = getMessageStatus(msg, isLastMine);

                    const raw = getMsgTime(msg);
                    const timeStr = formatTime(raw);

                    return (
                      <div
                        key={msg.message_id || `m-${i}`}
                        className={`message-wrapper ${isMine ? "mine" : "theirs"}`}
                      >
                        {/* Avatar — both sides */}
                        <div className="msg-avatar">
                          {isMine ? (
                            myImage ? (
                              <img
                                src={`http://localhost:5000${myImage}`}
                                alt="me"
                              />
                            ) : (
                              <span>{getInitials(myName)}</span>
                            )
                          ) : activePartner.partner_image ? (
                            <img
                              src={`http://localhost:5000${activePartner.partner_image}`}
                              alt=""
                            />
                          ) : (
                            <span>{getInitials(activePartner.partner_name)}</span>
                          )}
                        </div>

                        <div className="message-bubble-group">
                          <div
                            className={`message-bubble ${
                              isMine ? "bubble-mine" : "bubble-theirs"
                            }`}
                          >
                            {msg.message_text}
                          </div>

                          {/* Time + ticks + Sent/Delivered/Seen */}
                          <div className="message-meta">
                            {timeStr && (
                              <span className="message-time">{timeStr}</span>
                            )}
                            {status && (
                              <>
                                <span
                                  className="message-ticks"
                                  style={{ color: status.tickColor }}
                                >
                                  {status.ticks}
                                </span>
                                {status.label && (
                                  <span
                                    className="message-status-label"
                                    style={{ color: status.labelColor }}
                                  >
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

              {/* Input */}
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows="1"
                  />
                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
