import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import {
  ChatChannel,
  ChatMessage,
  ChatMember,
  ChatAttachment,
  UserProfile,
  ChatGroupPermissions,
} from "@/types";
import { getUserSigningTitle, ROLE_TITLES } from "@/lib/permissions";
import { toast } from "react-hot-toast";
import {
  MessageSquare,
  Users,
  User,
  Plus,
  Search,
  Send,
  Paperclip,
  Smile,
  X,
  Check,
  CheckCheck,
  Trash2,
  Reply,
  ShieldCheck,
  ShieldAlert,
  Building2,
  HardHat,
  Sparkles,
  Info,
  Image as ImageIcon,
  FileText,
  Download,
  Phone,
  Video,
  Hash,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  UserMinus,
  AlertCircle,
  Eye,
  CornerDownRight,
  Layers,
  Clock,
  Settings as SettingsIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pin,
  Share2,
  Copy,
  Play,
  Pause,
  ArrowDown,
  Camera,
  Flame,
  ThumbsUp,
  Heart,
  AlertTriangle,
  MoreVertical,
  LogOut,
  Lock,
  Edit2,
  Shield,
  Palette,
} from "lucide-react";

// Web Audio synthesizer for native chat sound effects
const playChatSound = (type: "send" | "receive") => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(784, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // Ignore autoplay or audio context errors
  }
};

// Custom Audio Voice Note Player Component
const AudioVoicePlayer: React.FC<{
  url: string;
  duration?: number;
  isMe?: boolean;
}> = ({ url, duration = 0, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[200px] max-w-[280px] shadow-2xs ${
        isMe
          ? "bg-emerald-700/80 text-white"
          : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition shadow-sm active:scale-95 ${
          isMe
            ? "bg-white text-emerald-700 hover:bg-slate-100"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Visual Waveform Simulator */}
        <div className="flex items-center gap-0.5 h-4 overflow-hidden">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 65, 85, 35, 75, 55, 90].map(
            (val, idx) => {
              const active = (idx / 16) * 100 <= progressPct;
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    active
                      ? isMe
                        ? "bg-white"
                        : "bg-emerald-600 dark:bg-emerald-400"
                      : isMe
                        ? "bg-emerald-400/40"
                        : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  style={{ height: `${val}%` }}
                />
              );
            },
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export const ChatPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject, projects, setActiveProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId =
    activeProject?.id ||
    projectId ||
    localStorage.getItem("jqms_active_project_id") ||
    localStorage.getItem("currentProjectId") ||
    projects[0]?.id ||
    "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  // Responsive View State: 'CHANNELS' or 'CHAT' (for mobile navigation)
  const [mobileView, setMobileView] = useState<"CHANNELS" | "CHAT">("CHANNELS");

  // Core Chat State
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Unread tracking & Last Read timestamps: channelId -> timestamp
  const [channelLastReadMap, setChannelLastReadMap] = useState<
    Record<string, number>
  >(() => {
    try {
      const saved = localStorage.getItem("jqms_chat_last_read_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active Reaction Bar state
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<
    string | null
  >(null);

  // Live Typing Indicators
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { name: string; timestamp: number }>
  >({});
  const lastTypingBroadcastRef = useRef<number>(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<
    "ALL" | "PROJECT" | "GROUPS" | "DIRECT"
  >("ALL");
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");

  // Sound & Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Composer State
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<
    ChatAttachment[]
  >([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Voice Note Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Modals & Panels
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNewDirectModal, setShowNewDirectModal] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [infoTab, setInfoTab] = useState<
    "OVERVIEW" | "MEMBERS" | "MEDIA" | "SETTINGS"
  >("OVERVIEW");

  // Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupType, setNewGroupType] = useState<
    "GROUP" | "QAQC_ALERTS" | "TRADE" | "TOPIC" | "PROJECT_GENERAL"
  >("GROUP");
  const [newGroupColor, setNewGroupColor] = useState("bg-emerald-600");
  const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Group Edit Settings State (for Info Drawer)
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [editGroupColor, setEditGroupColor] = useState("bg-emerald-600");
  const [editOnlyAdminsSend, setEditOnlyAdminsSend] = useState(false);
  const [editOnlyAdminsEditInfo, setEditOnlyAdminsEditInfo] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Scroll & DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Check if current user is an admin of the active channel
  const isChannelAdmin = useMemo(() => {
    if (!selectedChannel || !currentUser) return false;
    if (
      ["SUPER_ADMIN", "QUALITY_DIRECTOR", "QUALITY_MANAGER", "QAQC_MANAGER", "PROJECT_MANAGER"].includes(
        currentUser.role,
      )
    ) {
      return true;
    }
    if (selectedChannel.createdBy === currentUser.uid) return true;
    const member = selectedChannel.members?.find(
      (m) => m.uid === currentUser.uid,
    );
    return Boolean(member?.isAdmin);
  }, [selectedChannel, currentUser]);

  // Sync active project if needed
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) setActiveProject(match);
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  // Initialize edit form when selected channel changes
  useEffect(() => {
    if (selectedChannel) {
      setEditGroupName(selectedChannel.name || "");
      setEditGroupDesc(selectedChannel.description || "");
      setEditGroupColor(selectedChannel.color || "bg-emerald-600");
      setEditOnlyAdminsSend(
        Boolean(selectedChannel.permissions?.onlyAdminsCanSendMessages),
      );
      setEditOnlyAdminsEditInfo(
        Boolean(selectedChannel.permissions?.onlyAdminsCanEditGroupInfo),
      );
    }
  }, [selectedChannel]);

  // Listen to cross-tab / local typing events
  useEffect(() => {
    const handleTypingEvent = (e: any) => {
      const { channelId, uid, name } = e.detail || {};
      if (channelId && uid && uid !== currentUser?.uid) {
        setTypingUsers((prev) => ({
          ...prev,
          [channelId]: { name: name || "Colleague", timestamp: Date.now() },
        }));
      }
    };

    window.addEventListener("jqms-chat-typing", handleTypingEvent);
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(next).forEach(([cid, data]) => {
          if (now - data.timestamp > 3500) {
            delete next[cid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener("jqms-chat-typing", handleTypingEvent);
      clearInterval(interval);
    };
  }, [currentUser?.uid]);

  // Broadcast typing status
  const broadcastTyping = () => {
    if (!selectedChannel || !currentUser) return;
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current > 2000) {
      lastTypingBroadcastRef.current = now;
      window.dispatchEvent(
        new CustomEvent("jqms-chat-typing", {
          detail: {
            channelId: selectedChannel.id,
            uid: currentUser.uid,
            name: currentUser.fullName || "Colleague",
          },
        }),
      );
    }
  };

  // Load channels & users
  useEffect(() => {
    let unsubChannels: (() => void) | undefined;

    const initChat = async () => {
      setLoadingChannels(true);
      try {
        const [fetchedUsers] = await Promise.all([
          dbService.getUsers(currentCompId).catch(() => []),
          dbService.ensureDefaultChannels(
            currentCompId,
            currentProjId,
            activeProject?.name,
            currentUser,
          ),
        ]);
        setUsers(fetchedUsers);

        unsubChannels = dbService.listenToChatChannels(
          currentCompId,
          currentProjId,
          (chanList) => {
            // Sort: Default project channels first, then project general, then groups, then DMs
            const sorted = [...chanList].sort((a, b) => {
              if (a.isDefaultProjectGroup && !b.isDefaultProjectGroup) return -1;
              if (!a.isDefaultProjectGroup && b.isDefaultProjectGroup) return 1;
              if (a.projectId === currentProjId && b.projectId !== currentProjId)
                return -1;
              if (a.projectId !== currentProjId && b.projectId === currentProjId)
                return 1;
              return (b.updatedAt || 0) - (a.updatedAt || 0);
            });

            setChannels(sorted);
            setSelectedChannel((prev) => {
              if (prev) {
                const updated = sorted.find((c) => c.id === prev.id);
                return updated || prev;
              }
              if (window.innerWidth >= 1024) {
                return sorted[0] || null;
              }
              return null;
            });
            setLoadingChannels(false);
          },
        );
      } catch (err) {
        console.warn("Failed to init chat:", err);
        setLoadingChannels(false);
      }
    };

    initChat();

    return () => {
      if (unsubChannels) unsubChannels();
    };
  }, [currentCompId, currentProjId]);

  // Listen to messages of selected channel & mark as read
  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const now = Date.now();

    // Update last read map for unread calculations
    setChannelLastReadMap((prev) => {
      const updated = { ...prev, [selectedChannel.id]: now };
      localStorage.setItem(
        "jqms_chat_last_read_map",
        JSON.stringify(updated),
      );
      return updated;
    });

    if (currentUser?.uid) {
      dbService.markMessagesAsRead(selectedChannel.id, currentUser.uid);
    }

    const unsubMessages = dbService.listenToChatMessages(
      selectedChannel.id,
      (msgList) => {
        setMessages(msgList);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);

        if (msgList.length > 0) {
          const lastMsg = msgList[msgList.length - 1];
          if (
            currentUser &&
            lastMsg.senderId !== currentUser.uid &&
            Date.now() - lastMsg.timestamp < 4000
          ) {
            playChatSound("receive");
          }

          if (currentUser?.uid) {
            dbService.markMessagesAsRead(selectedChannel.id, currentUser.uid);
            const nowTs = Date.now();
            setChannelLastReadMap((prev) => {
              const updated = { ...prev, [selectedChannel.id]: nowTs };
              try {
                localStorage.setItem(
                  "jqms_chat_last_read_map",
                  JSON.stringify(updated),
                );
              } catch {}
              return updated;
            });
          }
        }
      },
    );

    return () => {
      unsubMessages();
    };
  }, [selectedChannel?.id]);

  // Calculate unread count for a given channel
  const getChannelUnreadCount = (chan: ChatChannel) => {
    if (selectedChannel?.id === chan.id) {
      return 0;
    }
    const lastRead = channelLastReadMap[chan.id] || 0;
    return dbService.getChannelUnreadCount(
      chan.id,
      currentUser?.uid || "",
      lastRead,
      chan.lastMessage,
    );
  };

  // Total unread count across all channels
  const totalUnreadCount = useMemo(() => {
    return channels.reduce((sum, chan) => sum + getChannelUnreadCount(chan), 0);
  }, [channels, channelLastReadMap, currentUser?.uid, selectedChannel?.id]);

  // Filter unread counts
  const filterUnreadCounts = useMemo(() => {
    const counts = {
      ALL: totalUnreadCount,
      PROJECT: 0,
      GROUPS: 0,
      DIRECT: 0,
    };
    channels.forEach((c) => {
      const u = getChannelUnreadCount(c);
      if (u > 0) {
        if (c.isDefaultProjectGroup || c.type === "PROJECT_GENERAL") counts.PROJECT += u;
        else if (c.type === "DIRECT") counts.DIRECT += u;
        else counts.GROUPS += u;
      }
    });
    return counts;
  }, [channels, totalUnreadCount, channelLastReadMap, currentUser?.uid, selectedChannel?.id]);

  // Broadcast total unread count for header badge
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("jqms-chat-unread-updated", {
        detail: { unreadCount: totalUnreadCount },
      }),
    );
  }, [totalUnreadCount]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottomBtn(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper for channel title & DM avatar
  const getChannelDisplayInfo = (chan: ChatChannel) => {
    if (chan.type === "DIRECT") {
      const otherMember = chan.members?.find(
        (m) => m.uid !== currentUser?.uid,
      );
      return {
        title: otherMember?.name || chan.name,
        role: otherMember?.title || otherMember?.designation || otherMember?.role || "Team Member",
        avatar: otherMember?.avatarUrl || chan.avatarUrl,
        isDM: true,
        online: true,
      };
    }
    return {
      title: chan.name,
      role: `${chan.members?.length || 1} members`,
      avatar: chan.avatarUrl,
      isDM: false,
      online: false,
    };
  };

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((chan) => {
      if (channelFilter === "PROJECT" && chan.type !== "PROJECT_GENERAL" && !chan.isDefaultProjectGroup)
        return false;
      if (channelFilter === "GROUPS" && chan.type === "DIRECT") return false;
      if (channelFilter === "DIRECT" && chan.type !== "DIRECT") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = chan.name.toLowerCase().includes(q);
        const matchesDesc = (chan.description || "").toLowerCase().includes(q);
        const matchesMember = chan.members?.some((m) =>
          m.name.toLowerCase().includes(q),
        );
        return matchesName || matchesDesc || matchesMember;
      }
      return true;
    });
  }, [channels, channelFilter, searchQuery]);

  // In-chat filtered messages
  const displayedMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return messages;
    const q = inChatSearchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q),
    );
  }, [messages, inChatSearchQuery]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !selectedChannel ||
      (!inputText.trim() && selectedAttachments.length === 0)
    )
      return;

    // Check announcement mode permission
    if (
      selectedChannel.permissions?.onlyAdminsCanSendMessages &&
      !isChannelAdmin
    ) {
      toast.error(
        "Only group admins are permitted to post in this announcement channel.",
      );
      return;
    }

    const messageContent = inputText.trim();
    const now = Date.now();
    const senderId = currentUser?.uid || "anonymous";
    const senderName = currentUser?.fullName || "User";
    const senderRole = currentUser?.role || "QAQC_ENGINEER";
    const senderTitle = getUserSigningTitle(currentUser);
    const senderDesignation = currentUser?.designation || currentUser?.title;
    const senderAvatarUrl = currentUser?.avatarUrl;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId: selectedChannel.id,
      companyId: currentCompId,
      projectId: currentProjId,
      senderId,
      senderName,
      senderRole,
      senderTitle,
      senderDesignation,
      senderAvatarUrl,
      content: messageContent,
      attachments:
        selectedAttachments.length > 0 ? selectedAttachments : undefined,
      timestamp: now,
      createdAt: now,
      status: "sent",
      replyToMessageId: replyingTo?.id,
      replyToMessageText: replyingTo?.content,
      replyToSenderName: replyingTo?.senderName,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setSelectedAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setTimeout(scrollToBottom, 50);

    if (soundEnabled) playChatSound("send");

    try {
      await dbService.saveChatMessage(newMsg);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to deliver message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: ChatAttachment[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        const isImg = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";

        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          url,
          type: isImg ? "image" : isPdf ? "pdf" : "document",
          size: file.size,
        });

        if (newAttachments.length === files.length) {
          setSelectedAttachments((prev) => [...prev, ...newAttachments]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Voice Note Recording Methods
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioUrl = reader.result as string;
          const dur = recordingDuration || 1;
          const audioAttachment: ChatAttachment = {
            id: `att-audio-${Date.now()}`,
            name: `Voice Note (${dur}s)`,
            url: audioUrl,
            type: "audio",
            duration: dur,
          };
          setSelectedAttachments((prev) => [...prev, audioAttachment]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Audio recording error:", err);
      toast.error("Microphone access is not supported or was blocked");
    }
  };

  const stopAudioRecording = (cancel = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      if (cancel) {
        audioChunksRef.current = [];
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // Handle Reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChannel || !currentUser?.uid) return;
    try {
      await dbService.toggleMessageReaction(
        selectedChannel.id,
        messageId,
        emoji,
        currentUser.uid,
      );
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  // Toggle Pin message
  const handleTogglePin = async (messageId: string) => {
    if (!selectedChannel) return;
    await dbService.toggleMessagePin(selectedChannel.id, messageId);
    toast.success("Pinned status updated");
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChannel) return;
    if (window.confirm("Are you sure you want to delete this message?")) {
      await dbService.deleteChatMessage(messageId, selectedChannel.id);
      toast.success("Message deleted");
    }
  };

  // Copy message text
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const creatorId = currentUser?.uid || "user";
    const creatorName = currentUser?.fullName || "User";
    const now = Date.now();

    const initialMembers: ChatMember[] = [
      {
        uid: creatorId,
        name: creatorName,
        role: currentUser?.role || "QAQC_ENGINEER",
        title: getUserSigningTitle(currentUser),
        designation: currentUser?.designation || currentUser?.title,
        email: currentUser?.email,
        avatarUrl: currentUser?.avatarUrl,
        isAdmin: true,
        joinedAt: now,
      },
    ];

    selectedMemberUids.forEach((uid) => {
      if (uid !== creatorId) {
        const u = users.find((user) => user.uid === uid);
        if (u) {
          initialMembers.push({
            uid: u.uid,
            name: u.fullName || u.email || "Member",
            role: u.role,
            title: u.title || u.designation || (ROLE_TITLES as any)[u.role] || u.role,
            designation: u.designation || u.title,
            email: u.email,
            avatarUrl: u.avatarUrl,
            isAdmin: false,
            joinedAt: now,
          });
        }
      }
    });

    const newChannel: ChatChannel = {
      id: `chan-grp-${Date.now()}`,
      companyId: currentCompId,
      projectId: currentProjId,
      projectName: activeProject?.name,
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      type: newGroupType,
      color: newGroupColor,
      createdBy: creatorId,
      createdByName: creatorName,
      createdAt: now,
      updatedAt: now,
      memberIds: initialMembers.map((m) => m.uid),
      members: initialMembers,
      permissions: {
        onlyAdminsCanEditGroupInfo: true,
        onlyAdminsCanSendMessages: false,
      },
      lastMessage: {
        text: `Group "${newGroupName}" created by ${creatorName}`,
        senderId: creatorId,
        senderName: creatorName,
        timestamp: now,
      },
    };

    try {
      await dbService.saveChatChannel(newChannel);
      await dbService.saveChatMessage({
        id: `msg-sys-${Date.now()}`,
        channelId: newChannel.id,
        companyId: currentCompId,
        projectId: currentProjId,
        senderId: creatorId,
        senderName: creatorName,
        senderRole: currentUser?.role,
        content: `🎉 Group "${newGroupName}" created by ${creatorName}.`,
        timestamp: now,
        createdAt: now,
        isSystemMessage: true,
      });

      toast.success(`Group "${newGroupName}" created!`);
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedMemberUids([]);
      setSelectedChannel(newChannel);
      setMobileView("CHAT");
    } catch (err) {
      console.error("Failed to create group:", err);
      toast.error("Failed to create group");
    }
  };

  // Start 1-on-1 Direct Message
  const handleStartDirectChat = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    const myUid = currentUser.uid;
    const targetUid = targetUser.uid;

    if (myUid === targetUid) {
      toast.error("You cannot start a direct chat with yourself.");
      return;
    }

    const existing = channels.find(
      (c) =>
        c.type === "DIRECT" &&
        c.memberIds.includes(myUid) &&
        c.memberIds.includes(targetUid),
    );

    if (existing) {
      setSelectedChannel(existing);
      setShowNewDirectModal(false);
      setMobileView("CHAT");
      return;
    }

    const now = Date.now();
    const dmChannel: ChatChannel = {
      id: `chan-dm-${[myUid, targetUid].sort().join("-")}`,
      companyId: currentCompId,
      name: targetUser.fullName || targetUser.email || "User",
      type: "DIRECT",
      avatarUrl: targetUser.avatarUrl || undefined,
      color: "bg-emerald-600",
      createdBy: myUid,
      createdByName: currentUser.fullName,
      createdAt: now,
      updatedAt: now,
      memberIds: [myUid, targetUid],
      members: [
        {
          uid: myUid,
          name: currentUser.fullName,
          role: currentUser.role,
          title: getUserSigningTitle(currentUser),
          designation: currentUser.designation || currentUser.title,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        },
        {
          uid: targetUid,
          name: targetUser.fullName,
          role: targetUser.role,
          title: targetUser.title || targetUser.designation || (ROLE_TITLES as any)[targetUser.role] || targetUser.role,
          designation: targetUser.designation || targetUser.title,
          email: targetUser.email,
          avatarUrl: targetUser.avatarUrl,
        },
      ],
      lastMessage: {
        text: "Direct conversation started",
        senderId: myUid,
        senderName: currentUser.fullName,
        timestamp: now,
      },
    };

    try {
      await dbService.saveChatChannel(dmChannel);
      setSelectedChannel(dmChannel);
      setShowNewDirectModal(false);
      setMobileView("CHAT");
      toast.success(
        `Started chat with ${targetUser.fullName || targetUser.email}`,
      );
    } catch (err) {
      console.error("Failed to start DM:", err);
      toast.error("Failed to initiate conversation");
    }
  };

  // Add Member to existing Group
  const handleAddMemberToGroup = async (userToAdd: UserProfile) => {
    if (!selectedChannel) return;
    if (selectedChannel.memberIds.includes(userToAdd.uid)) {
      toast.error("User is already a member of this channel.");
      return;
    }

    const now = Date.now();
    const newMember: ChatMember = {
      uid: userToAdd.uid,
      name: userToAdd.fullName || userToAdd.email,
      role: userToAdd.role,
      title: userToAdd.title || userToAdd.designation || (ROLE_TITLES as any)[userToAdd.role] || userToAdd.role,
      designation: userToAdd.designation || userToAdd.title,
      email: userToAdd.email,
      avatarUrl: userToAdd.avatarUrl,
      isAdmin: false,
      joinedAt: now,
    };

    const updatedChannel: ChatChannel = {
      ...selectedChannel,
      memberIds: [...selectedChannel.memberIds, userToAdd.uid],
      members: [...(selectedChannel.members || []), newMember],
      updatedAt: now,
    };

    try {
      await dbService.saveChatChannel(updatedChannel);
      await dbService.saveChatMessage({
        id: `msg-sys-${Date.now()}`,
        channelId: selectedChannel.id,
        companyId: currentCompId,
        projectId: currentProjId,
        senderId: currentUser?.uid || "admin",
        senderName: currentUser?.fullName || "Admin",
        content: `👋 ${userToAdd.fullName} was added to the group.`,
        timestamp: now,
        createdAt: now,
        isSystemMessage: true,
      });

      setSelectedChannel(updatedChannel);
      setShowAddMemberModal(false);
      toast.success(`${userToAdd.fullName} added to channel`);
    } catch (err) {
      console.error("Failed to add member:", err);
      toast.error("Failed to add member");
    }
  };

  // Group Admin: Toggle Admin Status
  const handleToggleAdminStatus = async (
    memberUid: string,
    makeAdmin: boolean,
  ) => {
    if (!selectedChannel || !isChannelAdmin) return;
    try {
      await dbService.setMemberAdminStatus(
        selectedChannel.id,
        memberUid,
        makeAdmin,
      );
      const target = selectedChannel.members?.find((m) => m.uid === memberUid);
      toast.success(
        makeAdmin
          ? `${target?.name || "Member"} is now a Group Admin`
          : `${target?.name || "Member"} is no longer a Group Admin`,
      );
      setSelectedChannel((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: (prev.members || []).map((m) =>
            m.uid === memberUid ? { ...m, isAdmin: makeAdmin } : m,
          ),
        };
      });
    } catch (err) {
      console.error("Admin toggle error:", err);
      toast.error("Failed to update admin permissions");
    }
  };

  // Group Admin: Remove Member
  const handleRemoveMember = async (memberUid: string) => {
    if (!selectedChannel || !isChannelAdmin) return;
    const target = selectedChannel.members?.find((m) => m.uid === memberUid);
    if (
      window.confirm(
        `Remove ${target?.name || "this member"} from the group?`,
      )
    ) {
      try {
        await dbService.removeMemberFromChannel(selectedChannel.id, memberUid);
        toast.success("Member removed from group");
        setSelectedChannel((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            memberIds: prev.memberIds.filter((id) => id !== memberUid),
            members: (prev.members || []).filter((m) => m.uid !== memberUid),
          };
        });
      } catch (err) {
        console.error("Remove member error:", err);
        toast.error("Failed to remove member");
      }
    }
  };

  // Member: Leave Channel
  const handleLeaveChannel = async () => {
    if (!selectedChannel || !currentUser) return;
    if (window.confirm(`Are you sure you want to leave "${selectedChannel.name}"?`)) {
      try {
        await dbService.removeMemberFromChannel(
          selectedChannel.id,
          currentUser.uid,
        );
        toast.success("You left the channel");
        const remaining = channels.filter((c) => c.id !== selectedChannel.id);
        setSelectedChannel(remaining[0] || null);
        if (window.innerWidth < 1024) {
          setMobileView("CHANNELS");
        }
      } catch (err) {
        console.error("Leave channel error:", err);
        toast.error("Failed to leave channel");
      }
    }
  };

  // Save Group Settings (Admins only)
  const handleSaveGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !isChannelAdmin) return;

    setSavingSettings(true);
    try {
      const updates: Partial<ChatChannel> = {
        name: editGroupName.trim(),
        description: editGroupDesc.trim(),
        color: editGroupColor,
        permissions: {
          onlyAdminsCanSendMessages: editOnlyAdminsSend,
          onlyAdminsCanEditGroupInfo: editOnlyAdminsEditInfo,
        },
      };

      await dbService.updateChannelSettings(selectedChannel.id, updates);
      setSelectedChannel((prev) => (prev ? { ...prev, ...updates } : prev));
      toast.success("Group settings updated successfully!");
      setInfoTab("OVERVIEW");
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Failed to save group settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (chan: ChatChannel) => {
    if (
      window.confirm(
        `Are you sure you want to delete the group "${chan.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await dbService.deleteChatChannel(chan.id, currentCompId);
        toast.success("Group deleted");
        if (selectedChannel?.id === chan.id) {
          const remaining = channels.filter((c) => c.id !== chan.id);
          setSelectedChannel(remaining[0] || null);
          if (window.innerWidth < 1024) {
            setMobileView("CHANNELS");
          }
        }
      } catch (err) {
        console.error("Failed to delete channel:", err);
      }
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const pinnedMessage = useMemo(() => {
    return messages.find((m) => m.pinned);
  }, [messages]);

  const activeTypingUser = selectedChannel
    ? typingUsers[selectedChannel.id]?.name
    : null;

  const isAnnouncementLocked =
    selectedChannel?.permissions?.onlyAdminsCanSendMessages && !isChannelAdmin;

  return (
    <div
      onClick={() => setActiveReactionMessageId(null)}
      className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden select-none"
    >
      {/* Main Responsive Chat Box */}
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {/* ========================================================= */}
        {/* LEFT COLUMN: CHANNELS & DMS (Full screen on mobile when 'CHANNELS') */}
        {/* ========================================================= */}
        <div
          className={`w-full lg:w-80 xl:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full ${
            mobileView === "CHAT" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top Header & Fast Action Buttons */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>JayQMS Connect</span>
                    {totalUnreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                        {totalUnreadCount} new
                      </span>
                    )}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {activeProject?.name ? `${activeProject.name} QAQC` : "Enterprise Communication"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowNewDirectModal(true)}
                  title="Direct Message"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <User className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  title="Create Group"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 flex items-center gap-1 text-xs font-bold px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Group</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups, topics, colleagues..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-[11px] font-bold">
              {[
                { id: "ALL", label: "All Chats" },
                { id: "PROJECT", label: "Project Groups" },
                { id: "GROUPS", label: "Custom Groups" },
                { id: "DIRECT", label: "Direct (1:1)" },
              ].map((tab) => {
                const count = (filterUnreadCounts as any)[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setChannelFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-xl transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      channelFilter === tab.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                          channelFilter === tab.id
                            ? "bg-white text-emerald-700"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels & DMs List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {loadingChannels ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Syncing conversations...</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  No conversations found
                </p>
                <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                  Create a new group or start a direct message with team members.
                </p>
              </div>
            ) : (
              filteredChannels.map((chan) => {
                const isSelected = selectedChannel?.id === chan.id;
                const info = getChannelDisplayInfo(chan);
                const unreadCount = getChannelUnreadCount(chan);
                const hasTyping = Boolean(typingUsers[chan.id]);

                return (
                  <div
                    key={chan.id}
                    onClick={() => {
                      setSelectedChannel(chan);
                      setMobileView("CHAT");
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 group relative ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent active:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar with Online indicator & Project Group Badge */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs overflow-hidden ${
                            chan.color || "bg-emerald-600"
                          }`}
                        >
                          {info.isDM && info.avatar ? (
                            <img
                              src={info.avatar}
                              alt={info.title}
                              className="w-full h-full object-cover"
                            />
                          ) : info.isDM ? (
                            <User className="w-5 h-5" />
                          ) : chan.type === "QAQC_ALERTS" ? (
                            <ShieldAlert className="w-5 h-5" />
                          ) : chan.type === "PROJECT_GENERAL" || chan.isDefaultProjectGroup ? (
                            <Building2 className="w-5 h-5" />
                          ) : (
                            <Hash className="w-5 h-5" />
                          )}
                        </div>
                        {info.isDM ? (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                        ) : chan.isDefaultProjectGroup ? (
                          <div
                            title="Default Project Group"
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold ring-2 ring-white dark:ring-slate-900"
                          >
                            ★
                          </div>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`text-xs truncate ${
                                unreadCount > 0
                                  ? "font-black text-slate-900 dark:text-white"
                                  : isSelected
                                    ? "font-bold text-emerald-700 dark:text-emerald-300"
                                    : "font-bold text-slate-900 dark:text-white"
                              }`}
                            >
                              {info.title}
                            </span>
                            {chan.isDefaultProjectGroup && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                Project
                              </span>
                            )}
                          </div>
                          {chan.lastMessage && (
                            <span
                              className={`text-[10px] font-mono shrink-0 ${
                                unreadCount > 0
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(
                                chan.lastMessage.timestamp,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p
                            className={`text-[11px] truncate flex-1 ${
                              hasTyping
                                ? "text-emerald-600 dark:text-emerald-400 font-bold animate-pulse"
                                : unreadCount > 0
                                  ? "text-slate-900 dark:text-slate-100 font-bold"
                                  : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {hasTyping ? (
                              <span>
                                {typingUsers[chan.id].name} is typing...
                              </span>
                            ) : chan.lastMessage ? (
                              <span>
                                <strong className="opacity-90">
                                  {chan.lastMessage.senderName.split(" ")[0]}:
                                </strong>{" "}
                                {chan.lastMessage.text}
                              </span>
                            ) : (
                              chan.description || "Tap to chat"
                            )}
                          </p>

                          {/* Unread Message Count Badge */}
                          {unreadCount > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-xs shrink-0 animate-pulse">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}

                          {/* Member count if no unread */}
                          {unreadCount === 0 &&
                            chan.members &&
                            chan.members.length > 0 &&
                            !info.isDM && (
                              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                                {chan.members.length}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION VIEW               */}
        {/* ========================================================= */}
        {selectedChannel ? (
          <div
            className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-w-0 h-full relative ${
              mobileView === "CHANNELS" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* 1. Header Bar with Mobile Back Arrow & Info Action */}
            <div className="h-15 px-3 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobileView("CHANNELS")}
                  className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                  aria-label="Back to channels"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                    selectedChannel.color || "bg-emerald-600"
                  }`}
                >
                  {selectedChannel.type === "DIRECT" ? (
                    <User className="w-5 h-5" />
                  ) : selectedChannel.type === "QAQC_ALERTS" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : selectedChannel.isDefaultProjectGroup || selectedChannel.type === "PROJECT_GENERAL" ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <Hash className="w-5 h-5" />
                  )}
                </div>

                {/* Channel Title & Status Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      {getChannelDisplayInfo(selectedChannel).title}
                    </h2>
                    {selectedChannel.isDefaultProjectGroup && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        Default Project Group
                      </span>
                    )}
                    {selectedChannel.permissions?.onlyAdminsCanSendMessages && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Announcements
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                    {activeTypingUser ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {activeTypingUser} is typing...
                      </span>
                    ) : selectedChannel.type === "DIRECT" ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Online & Active
                      </span>
                    ) : (
                      <span>
                        {selectedChannel.members?.length || 1} team members •{" "}
                        {selectedChannel.description || "Active collaboration"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls in Header */}
              <div className="flex items-center gap-1 shrink-0">
                {/* In-Chat Search Toggle */}
                <button
                  type="button"
                  onClick={() => setInChatSearchOpen(!inChatSearchOpen)}
                  title="Search inside this chat"
                  className={`p-2 rounded-xl transition ${
                    inChatSearchOpen
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Add Member (for groups) */}
                {selectedChannel.type !== "DIRECT" && (
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    title="Add colleague to channel"
                    className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Channel Details / Settings Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    setShowInfoDrawer(!showInfoDrawer);
                    if (!showInfoDrawer) setInfoTab("OVERVIEW");
                  }}
                  title="Group Management & Settings"
                  className={`p-2 rounded-xl transition ${
                    showInfoDrawer
                      ? "bg-emerald-600 text-white"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. In-Chat Search Bar (Expandable) */}
            {inChatSearchOpen && (
              <div className="px-4 py-2 bg-emerald-50/90 dark:bg-slate-900 border-b border-emerald-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="Search messages in this channel..."
                    autoFocus
                    className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  {inChatSearchQuery && (
                    <button
                      onClick={() => setInChatSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setInChatSearchOpen(false);
                    setInChatSearchQuery("");
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            )}

            {/* 3. Pinned Message Banner */}
            {pinnedMessage && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 truncate">
                  <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0 fill-current" />
                  <span className="font-bold shrink-0">Pinned:</span>
                  <span className="truncate opacity-90">
                    {pinnedMessage.content}
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePin(pinnedMessage.id)}
                  title="Unpin"
                  className="p-1 text-amber-600 hover:text-amber-800 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4. Real-time Messages Stream */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 relative"
            >
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading message stream...</p>
                </div>
              ) : displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {inChatSearchQuery
                        ? "No matching messages found"
                        : `Welcome to #${getChannelDisplayInfo(selectedChannel).title}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {inChatSearchQuery
                        ? "Try searching for another keyword or phrase."
                        : "Send a message, record a voice note, or attach a site inspection photo."}
                    </p>
                  </div>
                </div>
              ) : (
                displayedMessages.map((msg, index) => {
                  const isMe = msg.senderId === (currentUser?.uid || "");
                  const showHeader =
                    index === 0 ||
                    displayedMessages[index - 1].senderId !== msg.senderId;
                  const isActionBarActive =
                    activeReactionMessageId === msg.id;

                  if (msg.isSystemMessage) {
                    return (
                      <div
                        key={msg.id}
                        className="flex items-center justify-center my-2"
                      >
                        <div className="px-3.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          <span>{msg.content}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 group relative ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Avatar only for incoming messages */}
                      {!isMe && (
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0 select-none shadow-2xs overflow-hidden ${
                            showHeader ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          {msg.senderAvatarUrl ? (
                            <img
                              src={msg.senderAvatarUrl}
                              alt={msg.senderName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            msg.senderName.charAt(0).toUpperCase()
                          )}
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] space-y-1 relative ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Sender & Timestamp info */}
                        {showHeader && (
                          <div
                            className={`flex items-center gap-1.5 text-[10px] px-1 ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {isMe ? "You" : msg.senderName}
                            </span>
                            {(msg.senderTitle || msg.senderDesignation || msg.senderRole) && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                                {msg.senderTitle || msg.senderDesignation || (ROLE_TITLES as any)[msg.senderRole || ""] || msg.senderRole}
                              </span>
                            )}
                            <span className="text-slate-400 font-mono text-[9px]">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                          </div>
                        )}

                        {/* Quoted Reply if any */}
                        {msg.replyToMessageText && (
                          <div
                            className={`p-2 rounded-xl text-[10px] border-l-2 bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 mb-1 ${
                              isMe
                                ? "border-emerald-500 text-right"
                                : "border-sky-500 text-left"
                            }`}
                          >
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">
                              Replying to {msg.replyToSenderName || "colleague"}:
                            </span>
                            <span className="truncate block opacity-80">
                              {msg.replyToMessageText}
                            </span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`p-3 rounded-2xl text-xs relative group/bubble shadow-xs ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-xs"
                              : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs"
                          }`}
                        >
                          {/* Text Body */}
                          {msg.content && (
                            <p className="whitespace-pre-wrap leading-relaxed break-words font-sans">
                              {msg.content}
                            </p>
                          )}

                          {/* Attachments Stream */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att) => (
                                <div key={att.id}>
                                  {att.type === "image" ? (
                                    <div
                                      onClick={() => setPreviewMediaUrl(att.url)}
                                      className="rounded-xl overflow-hidden cursor-pointer border border-black/10 hover:opacity-95 transition max-w-xs"
                                    >
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="w-full h-auto object-cover max-h-64"
                                      />
                                    </div>
                                  ) : att.type === "audio" ? (
                                    <AudioVoicePlayer
                                      url={att.url}
                                      duration={att.duration || 0}
                                      isMe={isMe}
                                    />
                                  ) : (
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 p-2.5 rounded-xl bg-black/10 dark:bg-black/20 hover:bg-black/20 transition text-[11px] font-semibold"
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate flex-1">
                                        {att.name}
                                      </span>
                                      <Download className="w-3.5 h-3.5 shrink-0" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Bubble Footer info: timestamp & read receipt ticks & reaction trigger */}
                          <div
                            className={`flex items-center justify-between gap-2 mt-1.5 text-[9px] ${
                              isMe ? "text-emerald-100" : "text-slate-400"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionMessageId(
                                  isActionBarActive ? null : msg.id,
                                );
                              }}
                              className={`p-0.5 rounded hover:bg-black/10 transition ${
                                isActionBarActive
                                  ? "opacity-100 text-white"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              title="Reactions & Options"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center gap-1">
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {isMe && (
                                <span>
                                  {msg.readBy && msg.readBy.length > 0 ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-sky-300 fill-current" />
                                  ) : (
                                    <CheckCheck className="w-3.5 h-3.5 opacity-80" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reaction Floating Bar */}
                          <div
                            className={`absolute -top-4.5 z-30 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1 shadow-xl transition-all duration-150 ${
                              isMe ? "right-2" : "left-2"
                            } ${
                              isActionBarActive
                                ? "opacity-100 pointer-events-auto scale-100 flex"
                                : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 hidden group-hover:flex"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {["👍", "❤️", "🚨", "✅", "🔥", "👏"].map(
                              (emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(msg.id, emoji);
                                    setActiveReactionMessageId(null);
                                  }}
                                  className="hover:scale-130 transition-transform text-xs p-0.5 active:scale-95 cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ),
                            )}
                            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                setActiveReactionMessageId(null);
                              }}
                              title="Quote Reply"
                              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyMessage(msg.content);
                                setActiveReactionMessageId(null);
                              }}
                              title="Copy Text"
                              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(msg.id);
                                setActiveReactionMessageId(null);
                              }}
                              title="Pin Message"
                              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            {isMe && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(msg.id);
                                  setActiveReactionMessageId(null);
                                }}
                                title="Delete"
                                className="p-1 rounded-full hover:bg-red-50 text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Display Reactions List */}
                        {msg.reactions &&
                          Object.keys(msg.reactions).length > 0 && (
                            <div
                              className={`flex flex-wrap items-center gap-1 mt-1 ${
                                isMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              {Object.entries(msg.reactions).map(
                                ([emoji, uids]) => {
                                  const hasReacted = uids.includes(
                                    currentUser?.uid || "",
                                  );
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        handleReaction(msg.id, emoji)
                                      }
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition shadow-2xs ${
                                        hasReacted
                                          ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{uids.length}</span>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Scroll to Bottom Button */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-20 right-5 z-30 p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl flex items-center gap-1.5 text-xs font-bold transition animate-in fade-in active:scale-95"
              >
                <ArrowDown className="w-4 h-4" />
                <span className="hidden sm:inline">Latest</span>
              </button>
            )}

            {/* 5. Replying Banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 truncate">
                  <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Replying to {replyingTo.senderName}:
                  </span>
                  <span className="truncate text-slate-500">
                    {replyingTo.content}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 6. Selected Attachments Bar */}
            {selectedAttachments.length > 0 && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {selectedAttachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs shrink-0"
                  >
                    {att.type === "audio" ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="truncate max-w-[130px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAttachments((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-0.5 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 7. Bottom Composer Bar or Announcement Notice */}
            <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              {isAnnouncementLocked ? (
                /* Announcement Mode Locked Banner for Members */
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Only group admins can post messages in this announcement group.</span>
                </div>
              ) : isRecordingAudio ? (
                /* Active Voice Note Recording State */
                <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    <span className="text-xs font-bold">
                      Recording Voice Note: {recordingDuration}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stopAudioRecording(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => stopAudioRecording(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-500 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Attach
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Message Input Form */
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-1.5 sm:gap-2"
                >
                  {/* File Attachment Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Documents or Files"
                    disabled={isUploading}
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Camera Quick Action */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    title="Take Photo"
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Emoji Toggle */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Emojis"
                      className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-40 grid grid-cols-6 gap-1 w-56">
                        {[
                          "👍", "❤️", "🚨", "✅", "🔥", "👏",
                          "🏗️", "📐", "📋", "💯", "⚠️", "⏳",
                          "🧪", "🧱", "🛠️", "🤝", "🚀", "✨",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                              messageInputRef.current?.focus();
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-base text-center transition"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Input Area */}
                  <textarea
                    ref={messageInputRef}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      broadcastTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={`Message #${getChannelDisplayInfo(selectedChannel).title}...`}
                    className="flex-1 max-h-28 px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none transition leading-relaxed"
                  />

                  {/* Voice Note Record Button or Send Button */}
                  {!inputText.trim() && selectedAttachments.length === 0 ? (
                    <button
                      type="button"
                      onClick={startAudioRecording}
                      title="Record Voice Note"
                      className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition shrink-0 active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      title="Send Message"
                      className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition shrink-0 active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Empty State on Desktop */
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Select a Conversation or Start a New Chat
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select any project channel or colleague from the left directory to
              collaborate in real time.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* RIGHT DRAWER: GROUP SETTINGS, ADMINS & MANAGEMENT        */}
        {/* ========================================================= */}
        {showInfoDrawer && selectedChannel && (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto w-full lg:w-88 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right-4 duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Group Management
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 text-xs font-bold overflow-x-auto no-scrollbar">
              {[
                { id: "OVERVIEW", label: "Overview" },
                { id: "MEMBERS", label: `Members (${selectedChannel.members?.length || 1})` },
                { id: "MEDIA", label: "Media" },
                ...(selectedChannel.type !== "DIRECT" && isChannelAdmin
                  ? [{ id: "SETTINGS", label: "Settings" }]
                  : []),
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setInfoTab(t.id as any)}
                  className={`py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
                    infoTab === t.id
                      ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: OVERVIEW */}
              {infoTab === "OVERVIEW" && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 py-3">
                    <div
                      className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-bold text-lg text-white shadow-md ${
                        selectedChannel.color || "bg-emerald-600"
                      }`}
                    >
                      {selectedChannel.type === "DIRECT" ? (
                        <User className="w-7 h-7" />
                      ) : selectedChannel.type === "QAQC_ALERTS" ? (
                        <ShieldAlert className="w-7 h-7" />
                      ) : selectedChannel.isDefaultProjectGroup || selectedChannel.type === "PROJECT_GENERAL" ? (
                        <Building2 className="w-7 h-7" />
                      ) : (
                        <Hash className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {getChannelDisplayInfo(selectedChannel).title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedChannel.description || "No topic specified"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Created By</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedChannel.createdByName || "System Admin"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Group Type</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedChannel.isDefaultProjectGroup
                          ? "Project General"
                          : selectedChannel.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Your Role</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        {isChannelAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Group Admin
                          </>
                        ) : (
                          "Member"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quick Group Actions */}
                  {selectedChannel.type !== "DIRECT" && (
                    <div className="space-y-2 pt-2">
                      {isChannelAdmin && (
                        <button
                          type="button"
                          onClick={() => setInfoTab("SETTINGS")}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Edit Group Settings</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleLeaveChannel}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Leave Group</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEMBERS & ADMIN MANAGEMENT */}
              {infoTab === "MEMBERS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {selectedChannel.members?.length || 1} Participants
                    </span>
                    {selectedChannel.type !== "DIRECT" && isChannelAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowAddMemberModal(true)}
                        className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Member
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedChannel.members?.map((m) => {
                      const isMe = m.uid === currentUser?.uid;
                      return (
                        <div
                          key={m.uid}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                              {m.avatarUrl ? (
                                <img
                                  src={m.avatarUrl}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                m.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {isMe ? `${m.name} (You)` : m.name}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {m.title || m.designation || (ROLE_TITLES as any)[m.role || ""] || m.role || "Team Member"}
                              </p>
                            </div>
                          </div>

                          {/* Admin Tag & Management Action Menu */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.isAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </span>
                            )}

                            {/* Admin Controls on other members */}
                            {isChannelAdmin && !isMe && selectedChannel.type !== "DIRECT" && (
                              <div className="flex items-center gap-1">
                                {m.isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleAdminStatus(m.uid, false)
                                    }
                                    title="Dismiss as Admin"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-[10px]"
                                  >
                                    Dismiss
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleAdminStatus(m.uid, true)
                                    }
                                    title="Make Group Admin"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-[10px]"
                                  >
                                    Make Admin
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.uid)}
                                  title="Remove from group"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & ATTACHMENTS */}
              {infoTab === "MEDIA" && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Shared Images & Documents
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {messages
                      .flatMap((m) => m.attachments || [])
                      .filter((att) => att.type === "image")
                      .map((att) => (
                        <div
                          key={att.id}
                          onClick={() => setPreviewMediaUrl(att.url)}
                          className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-800 hover:opacity-90"
                        >
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: GROUP SETTINGS & PERMISSIONS (Admins only) */}
              {infoTab === "SETTINGS" && isChannelAdmin && (
                <form onSubmit={handleSaveGroupSettings} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Group Description / Purpose
                    </label>
                    <textarea
                      value={editGroupDesc}
                      onChange={(e) => setEditGroupDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Accent Color Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Group Color Tag
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        "bg-emerald-600",
                        "bg-indigo-600",
                        "bg-sky-600",
                        "bg-amber-600",
                        "bg-rose-600",
                        "bg-purple-600",
                      ].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setEditGroupColor(col)}
                          className={`w-7 h-7 rounded-xl ${col} transition flex items-center justify-center text-white ${
                            editGroupColor === col
                              ? "ring-2 ring-slate-900 dark:ring-white scale-110"
                              : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          {editGroupColor === col && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security & Broadcast Permissions */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h6 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Channel Permissions
                    </h6>

                    <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Announcement Mode
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Only Group Admins can post messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editOnlyAdminsSend}
                        onChange={(e) =>
                          setEditOnlyAdminsSend(e.target.checked)
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Protect Group Info
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Only Group Admins can edit name & topic
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editOnlyAdminsEditInfo}
                        onChange={(e) =>
                          setEditOnlyAdminsEditInfo(e.target.checked)
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
                  >
                    {savingSettings ? "Saving Settings..." : "Save Changes"}
                  </button>

                  {/* Danger Zone */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(selectedChannel)}
                      className="w-full p-2.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Channel</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE NEW GROUP                                 */}
      {/* ========================================================= */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Create Team Channel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Concrete Pour QA Team"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Topic / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Live tracking for Block C Level 3 slabs"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Channel Type
                </label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="GROUP">General Team Group</option>
                  <option value="PROJECT_GENERAL">Project Dedicated Group</option>
                  <option value="QAQC_ALERTS">QA/QC Urgent Alerts</option>
                  <option value="TRADE">Trade & Discipline Group</option>
                  <option value="TOPIC">Specific Technical Topic</option>
                </select>
              </div>

              {/* Members Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Members ({selectedMemberUids.length})
                </label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  {users
                    .filter((u) => u.uid !== currentUser?.uid)
                    .map((user) => {
                      const isSelected = selectedMemberUids.includes(user.uid);
                      return (
                        <div
                          key={user.uid}
                          onClick={() => {
                            setSelectedMemberUids((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== user.uid)
                                : [...prev, user.uid],
                            );
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-bold">
                              {user.fullName || user.email}
                            </span>
                            <span className="text-[10px] opacity-75 ml-1.5">
                              ({user.role})
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: START DIRECT MESSAGE (1-on-1)                    */}
      {/* ========================================================= */}
      {showNewDirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Direct Message
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDirectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search colleague by name or role..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {users
                .filter(
                  (u) =>
                    u.uid !== currentUser?.uid &&
                    (u.fullName
                      ?.toLowerCase()
                      .includes(memberSearchQuery.toLowerCase()) ||
                      u.email
                        ?.toLowerCase()
                        .includes(memberSearchQuery.toLowerCase()) ||
                      u.role
                        ?.toLowerCase()
                        .includes(memberSearchQuery.toLowerCase())),
                )
                .map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => handleStartDirectChat(user)}
                    className="p-3 rounded-2xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.fullName?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.fullName || user.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user.title || user.designation || (ROLE_TITLES as any)[user.role] || user.role}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD MEMBER TO GROUP                              */}
      {/* ========================================================= */}
      {showAddMemberModal && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Add Colleague to #{selectedChannel.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {users
                .filter((u) => !selectedChannel.memberIds.includes(u.uid))
                .map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => handleAddMemberToGroup(user)}
                    className="p-3 rounded-2xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.fullName?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.fullName || user.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user.title || user.designation || (ROLE_TITLES as any)[user.role] || user.role}
                        </p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-600" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: IMAGE & ATTACHMENT LIGHTBOX PREVIEW              */}
      {/* ========================================================= */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={previewMediaUrl}
                download="chat-image"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewMediaUrl(null)}
                className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewMediaUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
