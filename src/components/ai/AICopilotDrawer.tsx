import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Paperclip,
  Trash2,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  ChevronDown,
  BookOpen,
  AlertTriangle,
  FileCheck2,
  Loader2,
  ArrowRight,
  ClipboardList,
  CalendarCheck,
  FileText,
  Boxes,
  PlusCircle,
  ExternalLink,
  Calendar,
  Table,
  Mail,
  FolderOpen,
  RotateCw,
  Reply,
  Edit3,
  CornerDownLeft,
  History,
  Plus,
  MessageSquare,
  Database,
  FlaskConical,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { getUserSigningTitle } from "@/lib/permissions";
import { askGeminiCopilot, AIChatMessage, AIActionProposal } from "@/lib/aiService";
import { buildProjectDatabaseContext } from "@/lib/aiProjectContextService";
import {
  saveAICopilotSession,
  getAICopilotSessions,
  deleteAICopilotSession,
  AICopilotSession,
} from "@/lib/aiSessionService";
import { dbService } from "@/lib/db";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { CopilotMarkdown } from "./CopilotMarkdown";
import { GoogleWorkspaceSyncModal } from "./GoogleWorkspaceSyncModal";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import {
  syncToGoogleCalendar,
  exportToGoogleSheets,
  exportToGoogleDocs,
  openGoogleDrive,
  sendViaGmail,
} from "@/lib/googleSyncService";
import {
  NonConformanceReport,
  DailySiteLog,
  SiteInstruction,
  SiteCommentReport,
  StructuralElement,
  WeeklyReport,
} from "@/types";

const QUICK_PROMPTS = [
  {
    icon: Database,
    title: "Audit Open NCRs",
    prompt: "Scan our project database and summarize all open and under-review NCRs, including root causes, severity levels, and grid locations.",
  },
  {
    icon: FlaskConical,
    title: "Cube Strength Audit",
    prompt: "Audit our concrete cube compressive test results from the database. List recent 7d and 28d strength breaks and highlight any non-compliant failures.",
  },
  {
    icon: CalendarCheck,
    title: "Pending Permits to Pour",
    prompt: "What permits to pour (PTP) are currently active, approved, or awaiting clearance signatures in our project database?",
  },
  {
    icon: FileText,
    title: "Latest Site Diary & Logs",
    prompt: "Retrieve the latest recorded daily site logs, weather conditions, total manpower counts, and any recorded delays from the project database.",
  },
  {
    icon: AlertTriangle,
    title: "Draft & Log NCR",
    prompt: "Create an NCR for honeycombing defect discovered on Grid B-3 Level 2 Column C4 following formwork stripping.",
  },
  {
    icon: FileText,
    title: "Issue Site Instruction",
    prompt: "Issue a Site Instruction to the Main Contractor to rectify insufficient rebar cover (measured 15mm vs required 35mm) on Level 1 retaining wall before concrete pour.",
  },
  {
    icon: Boxes,
    title: "Structural Elements BIM",
    prompt: "List our registered structural elements for this project by level, concrete grade, and volume.",
  },
  {
    icon: BookOpen,
    title: "Compile Weekly Report",
    prompt: "Compile a weekly quality summary report highlighting passed cube tests, closed NCRs, and site progress based on our live database.",
  },
];

const resolveRouteInfo = (pathname: string) => {
  let currentModule = "Civil QA/QC Platform";
  let currentDocumentId: string | undefined = undefined;

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Determine if URL contains an active document ID
  if (
    lastSegment &&
    !["create", "edit", "dashboard", "new", "list", "schedule", "mto", "profile", "chat"].includes(lastSegment.toLowerCase()) &&
    (lastSegment.startsWith("WQR-") ||
      lastSegment.startsWith("NCR-") ||
      lastSegment.startsWith("PTP-") ||
      lastSegment.startsWith("SI-") ||
      lastSegment.startsWith("SC-") ||
      lastSegment.startsWith("WIR-") ||
      lastSegment.startsWith("RFI-") ||
      lastSegment.startsWith("MAR-") ||
      lastSegment.startsWith("MIR-") ||
      lastSegment.includes("-") ||
      lastSegment.length >= 8)
  ) {
    currentDocumentId = lastSegment;
  }

  const p = pathname.toLowerCase();
  if (p.includes("weekly-report")) currentModule = "Weekly QA/QC Reports";
  else if (p.includes("ncr")) currentModule = "Non-Conformance Reports (NCR)";
  else if (p.includes("site-instruction")) currentModule = "Site Instructions (SI)";
  else if (p.includes("site-comment")) currentModule = "Site Observations & Comments";
  else if (p.includes("permit-to-pour") || p.includes("ptp")) currentModule = "Permits to Pour (PTP)";
  else if (p.includes("concrete") || p.includes("cube")) currentModule = "Concrete & Cube Tests";
  else if (p.includes("inspection")) currentModule = "Work Inspections (WIR)";
  else if (p.includes("element") || p.includes("bim")) currentModule = "Structural Elements (BIM)";
  else if (p.includes("daily-site-log") || p.includes("site-diary") || p.includes("diary")) currentModule = "Daily Site Diary & Logs";
  else if (p.includes("rfi")) currentModule = "Requests for Information (RFI)";
  else if (p.includes("mar")) currentModule = "Material Approval Requests (MAR)";
  else if (p.includes("mir")) currentModule = "Material Inspection Requests (MIR)";
  else if (p.includes("punch")) currentModule = "Snag & Punch Items";
  else if (p.includes("itp")) currentModule = "Inspection & Test Plans (ITP)";
  else if (p.includes("method-statement")) currentModule = "Method Statements";
  else if (p.includes("mto") || p.includes("takeoff")) currentModule = "Material Take-Off (MTO)";
  else if (p.includes("grid")) currentModule = "Gridlines & Spatial Plan";
  else if (p.includes("level")) currentModule = "Floor Levels";
  else if (p.includes("dashboard")) currentModule = "Project Executive Dashboard";

  return { currentModule, currentDocumentId, currentRoute: pathname };
};

export const AICopilotDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { standards, companyId, generateDocNumber, getPrefix } = useCompany();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const userFirst = currentUser?.fullName?.split(" ")[0] || "Engineer";
  const userRoleTitle = getUserSigningTitle(currentUser);
  const storageKey = currentUser?.uid
    ? `jqms_copilot_chat_${currentUser.uid}_${activeProject?.id || "global"}`
    : "jqms_copilot_chat_guest";

  const getInitialWelcomeMessage = (userName?: string, projName?: string, roleName?: string): AIChatMessage => ({
    id: "welcome",
    role: "model",
    text: `Hello ${userName || "Engineer"}! I am your **Jay-QMS Civil Engineering Copilot**.

I have **complete, unrestricted access to all 24 project database registries and records** (including NCRs, Concrete Cubes, PTPs, Site Diaries, Material Deliveries, Weekly Reports, and BIM Elements) for **${projName || activeProject?.name || "First Floor Bankside"}**.

You can ask me to:
- 🔍 **Live Database Queries**: *"What NCRs are currently open?"*, *"Show me cube tests awaiting 28-day break"*, *"What permits to pour are pending signatures?"*, *"Summarize yesterday's daily site log"*
- 🚨 **Draft & Log NCRs** with ISO 9001 root cause & containment
- 📅 **Generate Daily Site Logs** (weather, manpower, work activities)
- 📝 **Issue Contractual Site Instructions (SI)** with remediation deadlines
- 🧱 **Inspect or Register Structural Elements** (BIM spatial twin)
- 📊 **Compile Weekly Quality Progress Reports**

How can I assist your site operations, quality audit, or database queries today?`,
    timestamp: Date.now(),
  });

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed loading saved chat history:", e);
    }
    return [getInitialWelcomeMessage(userFirst, activeProject?.name, userRoleTitle)];
  });

  // Reload history whenever user or project changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed loading user chat history:", e);
    }
    setMessages([getInitialWelcomeMessage(userFirst, activeProject?.name, userRoleTitle)]);
  }, [storageKey]);

  // Multi-Device Cloud Sessions
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem(`jqms_active_session_${currentUser?.uid || "guest"}`) || `sess-${Date.now()}`;
  });
  const [pastSessions, setPastSessions] = useState<AICopilotSession[]>([]);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load cloud sessions when drawer opens or user/project changes
  const loadSessions = async () => {
    if (!currentUser?.uid) return;
    setIsLoadingSessions(true);
    try {
      const sess = await getAICopilotSessions(currentUser.uid, activeProject?.id);
      setPastSessions(sess);
    } catch (e) {
      console.warn("Failed loading sessions:", e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      loadSessions();
    }
  }, [isOpen, currentUser?.uid, activeProject?.id]);

  // Sync active session to cloud whenever messages update
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn("Failed saving user chat history:", e);
    }

    // Cloud Firestore Sync across all devices
    if (currentUser?.uid && messages.length > 1) {
      const firstUserPrompt = messages.find((m) => m.role === "user")?.text;
      const title = firstUserPrompt
        ? firstUserPrompt.length > 40
          ? firstUserPrompt.slice(0, 40) + "..."
          : firstUserPrompt
        : "QA/QC Inspection Session";

      const sessionObj: AICopilotSession = {
        id: currentSessionId,
        userId: currentUser.uid,
        companyId: currentUser.companyId || activeProject?.companyId || "global",
        projectId: activeProject?.id || "global",
        projectName: activeProject?.name || "Civil Works",
        title,
        messages,
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
      };

      saveAICopilotSession(sessionObj);
      localStorage.setItem(`jqms_active_session_${currentUser.uid}`, currentSessionId);
    }
  }, [messages, storageKey, currentSessionId, currentUser?.uid, activeProject?.id]);

  // Handler to start a brand new conversation
  const handleStartNewChat = () => {
    const newId = `sess-${Date.now()}`;
    setCurrentSessionId(newId);
    if (currentUser?.uid) {
      localStorage.setItem(`jqms_active_session_${currentUser.uid}`, newId);
    }
    const fresh = [getInitialWelcomeMessage(userFirst, activeProject?.name, userRoleTitle)];
    setMessages(fresh);
    setShowPastSessions(false);
    toast.success("Started new conversation session");
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Handler to resume a past session
  const handleSelectSession = (session: AICopilotSession) => {
    setCurrentSessionId(session.id);
    if (currentUser?.uid) {
      localStorage.setItem(`jqms_active_session_${currentUser.uid}`, session.id);
    }
    setMessages(session.messages || [getInitialWelcomeMessage(userFirst, activeProject?.name, userRoleTitle)]);
    setShowPastSessions(false);
    toast.success(`Loaded "${session.title}"`);
    setTimeout(() => scrollToBottom(), 150);
  };

  // Handler to delete a past session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation session?")) return;
    await deleteAICopilotSession(sessionId);
    setPastSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleStartNewChat();
    }
    toast.success("Conversation deleted");
  };

  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; role: "user" | "model"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image file exceeds 4MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageAttachment(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReply = (msg: AIChatMessage) => {
    setReplyingTo({
      id: msg.id,
      role: msg.role,
      text: msg.text,
    });
    inputRef.current?.focus();
  };

  const handleEditPrompt = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleRetryPrompt = (text: string, imageBase64?: string) => {
    handleSend(text, imageBase64);
  };

  const handleRegenerateFromModel = (modelMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === modelMsgId);
    if (idx <= 0) return;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        handleSend(messages[i].text, messages[i].imageBase64);
        return;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleSend = async (customPrompt?: string, customImage?: string) => {
    let textToSend = customPrompt !== undefined ? customPrompt.trim() : input.trim();
    const attachedImg = customImage !== undefined ? customImage : imageAttachment;

    if (!textToSend && !attachedImg) return;

    if (replyingTo && customPrompt === undefined) {
      const shortSnippet =
        replyingTo.text.length > 140
          ? replyingTo.text.slice(0, 140) + "..."
          : replyingTo.text;
      textToSend = `> Replying to ${replyingTo.role === "user" ? "user prompt" : "Copilot"}: "${shortSnippet}"\n\n${textToSend}`;
      setReplyingTo(null);
    }

    const userMsg: AIChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: Date.now(),
      imageBase64: attachedImg || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setImageAttachment(null);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const now = new Date();
      const currentDateFormatted = now.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const currentTimeFormatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const routeInfo = resolveRouteInfo(location.pathname);
      const effectiveProj = activeProject || useProjectStore.getState().projects[0] || null;
      const effectiveProjId =
        effectiveProj?.id ||
        (typeof localStorage !== "undefined"
          ? localStorage.getItem("jqms_active_project_id") || ""
          : "");

      // Dynamically compile live project database context with full transparency across all entities
      let projectDataSummary = "";
      if (effectiveProjId) {
        try {
          projectDataSummary = await buildProjectDatabaseContext({
            projectId: effectiveProjId,
            companyId: effectiveProj?.companyId || companyId || undefined,
            user: currentUser,
            activeProject: effectiveProj,
            userPrompt: textToSend,
            currentRoute: routeInfo.currentRoute,
            currentDocumentId: routeInfo.currentDocumentId,
          });
        } catch (dbErr) {
          console.warn("Could not compile live project database snapshot:", dbErr);
        }
      }

      const response = await askGeminiCopilot({
        prompt: textToSend,
        imageBase64: attachedImg || undefined,
        history,
        context: {
          projectName: effectiveProj?.name || "First Floor Bankside",
          projectCode: effectiveProj?.code || "CDL-BS",
          standards: standards || [],
          roleTitle: userRoleTitle,
          userName: currentUser?.fullName || "Site Engineer",
          userRole: currentUser?.role || "ENGINEER",
          currentModule: routeInfo.currentModule,
          currentRoute: routeInfo.currentRoute,
          currentDocumentId: routeInfo.currentDocumentId,
          currentDateTime: now.toISOString(),
          currentDateFormatted,
          currentTimeFormatted,
          timezone,
          projectDataSummary,
        },
      });

      if (response.error) {
        toast.error(response.error);
        setMessages((prev) => [
          ...prev,
          {
            id: "error-" + Date.now(),
            role: "model",
            text: `⚠️ **Error communicating with AI Service:**\n${response.error}\n\n*Please ensure your GEMINI_API_KEY is configured in Netlify environment variables.*`,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "ai-" + Date.now(),
            role: "model",
            text: response.cleanText || response.text,
            actionProposal: response.actionProposal,
            actionExecuted: false,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      toast.error("Failed to generate response");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Directly executes and saves the proposed item into Firestore & offline database
   */
  const handleExecuteAction = async (msgId: string, proposal: AIActionProposal) => {
    if (!activeProject) {
      toast.error("Please select an active project first.");
      return;
    }

    setExecutingActionId(msgId);
    try {
      const pId = activeProject.id;
      const cId = companyId || currentUser?.companyId || "default-comp";
      const uName = currentUser?.fullName || "QA/QC Engineer";
      const uId = currentUser?.uid || "user";
      const uRole = currentUser?.role || "QAQC_ENGINEER";

      switch (proposal.action) {
        case "CREATE_NCR": {
          const ncrNumber = generateDocNumber("NCR");
          const ncrPayload: NonConformanceReport = {
            id: "ncr-" + Date.now(),
            ncrNumber,
            title: proposal.title || "Site Non-Conformance Report",
            status: "OPEN",
            severity: proposal.severity || "MODERATE",
            category: proposal.category || "Workmanship",
            locationLevel: proposal.location || "Site Level",
            location: proposal.location || "Site Level",
            description: proposal.description || proposal.title,
            rootCauseType: "WORKMANSHIP",
            rootCause: proposal.rootCause || "Under Investigation",
            correctiveAction: proposal.correctiveAction || "Remedial works required per approved MS",
            correctiveActions: [
              {
                id: "ca-1",
                actionText: proposal.correctiveAction || "Rectify defective work per specification",
                assignedTo: "Site Contractor",
                targetDate: new Date().toISOString().split("T")[0],
                status: "PENDING",
              },
            ],
            preventiveAction: proposal.preventiveAction || "Enhanced pre-pour check & tool-box talk",
            photos: [],
            projectId: pId,
            projectName: activeProject.name,
            companyId: cId,
            raisedBy: {
              uid: uId,
              name: uName,
              role: uRole,
              date: new Date().toISOString(),
            },
            raisedByName: uName,
            reportedBy: uName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await dbService.saveNCR(ncrPayload);
          toast.success(`NCR ${ncrNumber} created successfully!`);
          break;
        }

        case "CREATE_DAILY_LOG": {
          const todayIso = new Date().toISOString().split("T")[0];
          const logNumber = `DSL-${activeProject.code || "PRJ"}-${todayIso}`;
          const dailyLog: DailySiteLog = {
            id: "dsl-" + Date.now(),
            logNumber,
            projectId: pId,
            projectName: activeProject.name,
            projectCode: activeProject.code,
            companyId: cId,
            status: "DRAFT",
            generalConditions: {
              date: todayIso,
              shift: "DAY",
              weather: "SUNNY",
              tempMin: 22,
              tempMax: 31,
              groundConditions: "Dry",
              workHoursStart: "07:30",
              workHoursEnd: "17:30",
              totalHours: 10,
              siteStatusNotes: proposal.workSummary || "Normal site working operations.",
            },
            activities: Array.isArray(proposal.activities)
              ? proposal.activities.map((a: any, i: number) => ({
                  id: "act-" + i,
                  description: a.description || "Civil Construction Works",
                  location: a.zone || "Site Wide",
                  trade: a.trade || "Civil / Structural",
                  status: "IN_PROGRESS" as const,
                  subcontractor: activeProject.name,
                  progressPercentage: 100,
                }))
              : [
                  {
                    id: "act-1",
                    description: proposal.workSummary || "General Civil Site Construction",
                    location: "Site",
                    trade: "Civil",
                    status: "IN_PROGRESS" as const,
                    subcontractor: "Main Contractor",
                    progressPercentage: 100,
                  },
                ],
            manpower: [
              {
                id: "mp-1",
                tradeName: "General Civil Trades",
                companyOrSubcontractor: activeProject.name,
                headCount: proposal.manpowerCount || 10,
                hoursWorked: 8,
                totalManHours: (proposal.manpowerCount || 10) * 8,
              },
            ],
            equipment: [],
            delays: proposal.delays && proposal.delays !== "None"
              ? [
                  {
                    id: "dl-1",
                    category: "WEATHER" as const,
                    description: proposal.delays,
                    impactHours: 1,
                  },
                ]
              : [],
            quality: {
              inspections: [
                {
                  id: "qi-1",
                  inspectionType: "Routine QA/QC Walkthrough",
                  result: "PASSED",
                  inspectorName: uName,
                  notes: proposal.workSummary || "Inspections verified.",
                },
              ],
              qualityNotes: proposal.workSummary || "Quality inspection confirmed per ITP.",
            },
            materials: {
              deliveries: [],
              concretePours: [],
            },
            hse: {
              incidentsReported: 0,
              housekeepingRating: "GOOD",
              toolboxTalkTopic: "Quality Assurance & Formwork Striking Standards",
              toolboxTalkAttendees: proposal.manpowerCount || 10,
              permitsToWork: [],
            },
            consultant: {
              visitorName: "Site QA Team",
              approvalNotes: "Site monitored by QA/QC team.",
            },
            signOffs: {},
            photos: [],
            createdBy: uId,
            createdByName: uName,
            createdByRole: uRole,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await dbService.saveDailySiteLog(dailyLog);
          toast.success(`Daily Log ${logNumber} recorded!`);
          break;
        }

        case "CREATE_SITE_INSTRUCTION": {
          const siNumber = generateDocNumber("SITE_INSTRUCTION");
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + (Number(proposal.deadlineDays) || 3));

          const si: SiteInstruction = {
            id: "si-" + Date.now(),
            instructionNumber: siNumber,
            title: proposal.title || "Site Quality Directive",
            type: "QUALITY_DIRECTIVE",
            severity: "MEDIUM",
            status: "ISSUED",
            subject: proposal.title || "Site Quality Directive",
            issueSummary: proposal.instruction || proposal.title,
            instructionText: proposal.instruction || proposal.title,
            mandatoryActions: [proposal.instruction || proposal.title],
            complianceDeadline: deadline.toISOString().split("T")[0],
            projectId: pId,
            projectName: activeProject.name,
            companyId: cId,
            contractorName: proposal.issuedTo || "Main Contractor",
            signedBy: {
              uid: uId,
              name: uName,
              role: uRole,
              signedAt: new Date().toISOString(),
            },
            createdBy: uId,
            createdAt: Date.now(),
          };

          await dbService.saveSiteInstruction(si);
          toast.success(`Site Instruction ${siNumber} issued!`);
          break;
        }

        case "CREATE_SITE_COMMENT": {
          const commentNo = generateDocNumber("SITE_COMMENT");
          const sc: SiteCommentReport = {
            id: "sc-" + Date.now(),
            reportNumber: commentNo,
            title: proposal.title || "QA/QC Site Observation",
            projectId: pId,
            companyId: cId,
            inspectionDate: new Date().toISOString().split("T")[0],
            locationDescription: proposal.location || "Site Level",
            observations: [
              {
                id: "obs-1",
                observationText: proposal.comment || proposal.title || "Observation",
                comments: proposal.comment || proposal.title,
                severity: "CONCERN",
                status: "OPEN",
                trade: "Civil / Structural",
              },
            ],
            raisedBy: {
              uid: uId,
              name: uName,
              role: uRole,
            },
            raisedByName: uName,
          };

          await dbService.saveSiteComment(sc);
          toast.success(`Site Observation ${commentNo} registered!`);
          break;
        }

        case "CREATE_ELEMENT": {
          const elId = "elem-" + Date.now();
          const vol = Number(proposal.volumeM3) || 2.0;
          const element: StructuralElement = {
            id: elId,
            projectId: pId,
            elementName: proposal.elementName || "COL-01",
            elementType: proposal.elementType || "COLUMN",
            levelId: "lvl-site",
            levelName: proposal.levelName || "Level 1",
            grid: proposal.grid || "A-1",
            status: "PENDING",
            calculatedVolume: vol,
            volume: vol,
            dimensions: {
              length: 0.5,
              width: 0.5,
              height: 3.0,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await dbService.saveElement(element);
          toast.success(`Structural Element ${element.elementName} registered!`);
          break;
        }

        case "CREATE_WEEKLY_REPORT": {
          const reportNo = generateDocNumber("WEEKLY_REPORT");
          const wr: WeeklyReport = {
            id: "wr-" + Date.now(),
            reportNumber: reportNo,
            projectId: pId,
            companyId: cId,
            title: proposal.title || "QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE",
            executiveSummary: proposal.executiveSummary || "Weekly quality milestones achieved.",
            status: "DRAFT",
            createdAt: Date.now(),
            preparedBy: {
              uid: uId,
              name: uName,
              role: uRole,
              designation: getUserSigningTitle(currentUser),
            },
          };

          await dbService.saveWeeklyReport(wr);
          toast.success(`Weekly Report ${reportNo} created!`);
          break;
        }

        case "SYNC_GOOGLE_CALENDAR": {
          syncToGoogleCalendar({
            title: proposal.title || "Pre-Pour QA/QC Inspection",
            description: proposal.description || "Scheduled via Jay-QMS Technical Copilot",
            location: proposal.location || activeProject.name,
            startDateTime: proposal.startDateTime,
            endDateTime: proposal.endDateTime,
          });
          toast.success("Opened Google Calendar event creator!");
          break;
        }

        case "SYNC_GOOGLE_SHEETS": {
          await exportToGoogleSheets({
            title: proposal.title || `${activeProject.name}_Quality_Register`,
            headers: proposal.headers || ["Item #", "Title", "Status"],
            rows: proposal.rows || [],
          });
          toast.success("Exported to Google Sheets & CSV downloaded!");
          break;
        }

        case "SYNC_GOOGLE_DOCS": {
          await exportToGoogleDocs({
            title: proposal.title || "Technical Document",
            content: proposal.content || "Drafted via Jay-QMS Technical Copilot",
          });
          toast.success("Opened Google Docs! (Content copied to clipboard)");
          break;
        }

        case "SYNC_GOOGLE_DRIVE": {
          openGoogleDrive(activeProject.name, proposal.folderUrl);
          toast.success("Opening Google Drive project folder...");
          break;
        }

        case "SYNC_GMAIL": {
          sendViaGmail({
            to: proposal.to || "",
            subject: proposal.subject || "Jay-QMS Site Quality Directive",
            body: proposal.body || "Notification from Jay-QMS Platform",
          });
          toast.success("Opened Gmail compose window!");
          break;
        }

        default:
          toast.error("Unsupported action type");
          break;
      }

      // Mark message action as executed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, actionExecuted: true } : m,
        ),
      );
    } catch (err: any) {
      console.error("Action execution failure:", err);
      toast.error(err?.message || "Failed to execute database action.");
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
      return;
    }
    // Enter alone naturally creates a new line/paragraph!
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your entire AI chat history? This will clear all saved messages for this project."
      )
    ) {
      const fresh = [getInitialWelcomeMessage(userFirst, activeProject?.name, userRoleTitle)];
      setMessages(fresh);
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn("Failed removing chat history from localStorage:", e);
      }
      toast.success("Chat history deleted.");
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== msgId);
      if (updated.length === 0) {
        return [getInitialWelcomeMessage(userFirst)];
      }
      return updated;
    });
    toast.success("Message removed");
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-tour="ai-copilot-pill"
          className="fixed bottom-20 right-4 sm:right-6 z-40 flex items-center gap-2 p-3 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-600/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-white/20 backdrop-blur-md"
          title="Open Jay-QMS Civil QA/QC AI Copilot"
          aria-label="Open Jay-QMS AI Copilot"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-700 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-700" />
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-tight">
            Jay-QMS Copilot
          </span>
          <span className="hidden md:inline px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-mono uppercase tracking-wider font-extrabold">
            Actions
          </span>
        </button>
      )}

      {/* Slide-out / Modal Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden ${
            isExpanded
              ? "inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[calc(100vw-2rem)] md:w-[680px] h-[92vh] sm:h-[calc(100vh-3rem)] md:h-[750px] rounded-t-3xl sm:rounded-3xl"
              : "inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[440px] h-[85vh] sm:h-[600px] max-h-[100vh] sm:max-h-[calc(100vh-3rem)] rounded-t-3xl sm:rounded-3xl"
          }`}
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-full flex justify-center pt-2 pb-0.5 bg-gradient-to-r from-brand-600 to-brand-700">
            <div className="w-10 h-1 rounded-full bg-white/40" />
          </div>

          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between shrink-0 select-none shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-tight truncate">
                    Jay-QMS Technical Copilot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-mono font-bold tracking-wider">
                    AUTONOMOUS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/85 truncate">
                  <span className="truncate">{activeProject?.name || "Civil Quality Platform"}</span>
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live DB: {userRoleTitle}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* New Conversation Button */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center border border-white/20 shadow-xs active:scale-95"
                title="Start New Conversation"
                aria-label="Start New Conversation"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Past Messages / Session History Menu Button */}
              <button
                type="button"
                onClick={() => {
                  setShowPastSessions(!showPastSessions);
                  if (!showPastSessions) loadSessions();
                }}
                className={`relative p-1.5 rounded-lg transition flex items-center justify-center border border-white/20 shadow-xs active:scale-95 ${
                  showPastSessions ? "bg-white text-brand-700 font-bold" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
                title="Past Conversations & Cloud Sync"
                aria-label="Past Conversations Menu"
              >
                <History className="w-3.5 h-3.5" />
                {pastSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-emerald-400 text-slate-900 text-[8px] font-black flex items-center justify-center font-mono">
                    {pastSessions.length}
                  </span>
                )}
              </button>

              {/* Google Sync Button */}
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="relative p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center border border-white/20 shadow-xs mr-0.5 active:scale-95"
                title="Google Workspace & Products Sync Hub"
                aria-label="Google Workspace & Products Sync Hub"
              >
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                  <GoogleIcon className="w-3.5 h-3.5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-brand-700 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Clear current conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Past Conversations Cloud Menu Overlay */}
          {showPastSessions && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0 max-h-72 overflow-y-auto scrollbar-thin animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Cloud Synced Conversations</span>
                </span>
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="px-2 py-0.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              </div>

              {isLoadingSessions ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                  <span>Syncing with Cloud...</span>
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 space-y-1">
                  <p>No past cloud conversations found yet.</p>
                  <p className="text-[10px] text-slate-500">
                    New conversations auto-sync across all your phones, tablets & laptops.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pastSessions.map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess)}
                        className={`w-full p-2.5 rounded-xl text-left border transition flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? "bg-brand-50/80 dark:bg-brand-950/60 border-brand-300 dark:border-brand-800 text-brand-900 dark:text-white"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-brand-400 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate leading-tight">
                              {sess.title}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-0.5">
                              <span>{new Date(sess.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                              <span>•</span>
                              <span>{sess.messages?.length || 0} msgs</span>
                              {isActive && (
                                <span className="text-emerald-500 font-bold ml-1">● Active</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition shrink-0"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick Technical Prompts */}
          {messages.length === 1 && !showPastSessions && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-1">
                Direct Creation Shortcuts:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(qp.prompt)}
                      className="p-2 rounded-xl text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-xs transition group"
                    >
                      <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-[11px] font-bold truncate">
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{qp.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const hasAction = !!msg.actionProposal;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs space-y-2.5 transition shadow-sm ${
                      isUser
                        ? "bg-brand-600 text-white rounded-tr-xs"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700/60"
                    }`}
                  >
                    {/* Attached Image if any */}
                    {msg.imageBase64 && (
                      <div className="rounded-lg overflow-hidden border border-white/20 max-w-[200px]">
                        <img
                          src={msg.imageBase64}
                          alt="Uploaded attachment"
                          className="w-full h-auto object-cover max-h-40"
                        />
                      </div>
                    )}

                    {/* Text content */}
                    <div className="select-text font-sans leading-relaxed">
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <CopilotMarkdown content={msg.text} />
                      )}
                    </div>

                    {/* Action Execution Proposal Card */}
                    {hasAction && (() => {
                      const action = msg.actionProposal?.action;
                      const isGoogle = action?.startsWith("SYNC_GOOGLE_") || action === "SYNC_GMAIL";

                      let actionTitle = msg.actionProposal?.action.replace("CREATE_", "NEW ");
                      let buttonLabel = "Approve & Save Now";
                      let successLabel = "Created & Saved to Live Database";
                      let productBadge = "Ready for Database";

                      if (action === "SYNC_GOOGLE_CALENDAR") {
                        actionTitle = "Google Calendar Sync";
                        buttonLabel = "Sync to Google Calendar";
                        successLabel = "Synced to Google Calendar";
                        productBadge = "Google Calendar";
                      } else if (action === "SYNC_GOOGLE_SHEETS") {
                        actionTitle = "Google Sheets Export";
                        buttonLabel = "Open in Google Sheets";
                        successLabel = "Exported to Google Sheets";
                        productBadge = "Google Sheets";
                      } else if (action === "SYNC_GOOGLE_DOCS") {
                        actionTitle = "Google Docs Export";
                        buttonLabel = "Open in Google Docs";
                        successLabel = "Opened in Google Docs";
                        productBadge = "Google Docs";
                      } else if (action === "SYNC_GOOGLE_DRIVE") {
                        actionTitle = "Google Drive Sync";
                        buttonLabel = "Open Google Drive";
                        successLabel = "Opened Google Drive";
                        productBadge = "Google Drive";
                      } else if (action === "SYNC_GMAIL") {
                        actionTitle = "Gmail Dispatch";
                        buttonLabel = "Compose in Gmail";
                        successLabel = "Opened in Gmail";
                        productBadge = "Gmail";
                      }

                      return (
                        <div
                          className={`mt-2 p-3 rounded-xl border space-y-2 shadow-xs ${
                            isGoogle
                              ? "bg-blue-50/60 dark:bg-slate-900 border-blue-400/40"
                              : "bg-white dark:bg-slate-900 border-brand-500/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex items-center gap-1.5 font-bold text-[11px] ${
                                isGoogle
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-brand-600 dark:text-brand-400"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {actionTitle}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                isGoogle
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                                  : "bg-brand-500/10 text-brand-600"
                              }`}
                            >
                              {productBadge}
                            </span>
                          </div>

                          {/* Proposal Details Preview */}
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-white/80 dark:bg-slate-950 p-2 rounded-lg font-mono border border-slate-200/50 dark:border-slate-800">
                            {msg.actionProposal?.title && (
                              <div>
                                <strong className="text-slate-400">Title:</strong> {msg.actionProposal.title}
                              </div>
                            )}
                            {msg.actionProposal?.location && (
                              <div>
                                <strong className="text-slate-400">Location:</strong> {msg.actionProposal.location}
                              </div>
                            )}
                            {msg.actionProposal?.startDateTime && (
                              <div>
                                <strong className="text-slate-400">Date/Time:</strong>{" "}
                                {new Date(msg.actionProposal.startDateTime).toLocaleString()}
                              </div>
                            )}
                            {msg.actionProposal?.headers && (
                              <div>
                                <strong className="text-slate-400">Columns:</strong>{" "}
                                {msg.actionProposal.headers.length} headers | {msg.actionProposal.rows?.length || 0} rows
                              </div>
                            )}
                            {msg.actionProposal?.to && (
                              <div>
                                <strong className="text-slate-400">Recipient:</strong> {msg.actionProposal.to}
                              </div>
                            )}
                            {msg.actionProposal?.severity && (
                              <div>
                                <strong className="text-slate-400">Severity:</strong> {msg.actionProposal.severity}
                              </div>
                            )}
                            {msg.actionProposal?.elementName && (
                              <div>
                                <strong className="text-slate-400">Element:</strong> {msg.actionProposal.elementName} (
                                {msg.actionProposal.elementType})
                              </div>
                            )}
                            {msg.actionProposal?.weather && (
                              <div>
                                <strong className="text-slate-400">Weather:</strong> {msg.actionProposal.weather} | Manpower:{" "}
                                {msg.actionProposal.manpowerCount}
                              </div>
                            )}
                          </div>

                          {/* Confirmation Button */}
                          <div className="pt-1 flex items-center justify-end">
                            {msg.actionExecuted ? (
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                                <span>{successLabel}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExecuteAction(msg.id, msg.actionProposal!)}
                                disabled={executingActionId === msg.id}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white font-bold text-xs shadow-md active:scale-95 transition ${
                                  isGoogle
                                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                                    : "bg-brand-600 hover:bg-brand-500 shadow-brand-500/20"
                                }`}
                              >
                                {executingActionId === msg.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isGoogle ? (
                                  <ExternalLink className="w-3.5 h-3.5" />
                                ) : (
                                  <PlusCircle className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {executingActionId === msg.id
                                    ? "Processing..."
                                    : buttonLabel}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Footer Actions */}
                    <div
                      className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                        isUser
                          ? "border-white/20 text-white/70"
                          : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Copy button (both user and model) */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                            isUser
                              ? "hover:bg-white/20 text-white/80 hover:text-white"
                              : "hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-brand-600 dark:hover:text-brand-400"
                          }`}
                          title={isUser ? "Copy prompt" : "Copy response"}
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </button>

                        {/* Reply to message (both user and model) */}
                        <button
                          type="button"
                          onClick={() => handleReply(msg)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                            isUser
                              ? "hover:bg-white/20 text-white/80 hover:text-white"
                              : "hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-brand-600 dark:hover:text-brand-400"
                          }`}
                          title="Reply to message"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        {/* User-only: Edit Prompt */}
                        {isUser && (
                          <button
                            type="button"
                            onClick={() => handleEditPrompt(msg.text)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition"
                            title="Edit prompt in input box"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* User-only: Retry prompt */}
                        {isUser && (
                          <button
                            type="button"
                            onClick={() => handleRetryPrompt(msg.text, msg.imageBase64)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white transition disabled:opacity-40"
                            title="Resend this prompt"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        {/* Model-only: Regenerate / Retry response */}
                        {!isUser && msg.id !== "welcome" && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateFromModel(msg.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-brand-600 dark:hover:text-brand-400 transition disabled:opacity-40"
                            title="Regenerate this response"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        {/* Delete message */}
                        {msg.id !== "welcome" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className={`flex items-center gap-1 p-0.5 rounded transition ${
                              isUser
                                ? "hover:bg-white/20 text-white/60 hover:text-red-300"
                                : "hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-400 hover:text-red-500"
                            }`}
                            title="Delete this message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-500 dark:text-slate-400 text-xs py-2">
                <div className="w-7 h-7 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center border border-brand-500/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <span className="font-semibold text-[11px]">
                    Consulting Civil Standards & Drafting Record...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Attachment Preview */}
          {imageAttachment && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={imageAttachment}
                  alt="Attachment preview"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Photo attached for defect analysis
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Replying Context Banner */}
          {replyingTo && (
            <div className="px-3.5 py-2 bg-brand-50 dark:bg-brand-950/60 border-t border-brand-200 dark:border-brand-900/60 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="truncate text-[11px]">
                  <span className="font-bold text-brand-700 dark:text-brand-300 mr-1.5">
                    Replying to {replyingTo.role === "user" ? "your prompt" : "Copilot"}:
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 italic">
                    "{replyingTo.text.length > 70 ? replyingTo.text.slice(0, 70) + "..." : replyingTo.text}"
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition shrink-0 ml-2"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 focus-within:border-brand-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition shrink-0"
                title="Attach defect photo for visual QA/QC inspection"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask technical question, enter defect notes, or say 'Create an NCR...'"
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 min-h-[36px] max-h-40 py-2 scrollbar-thin"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={(!input.trim() && !imageAttachment) || isLoading}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-md shadow-brand-500/25 transition active:scale-95 shrink-0"
                title="Send to Gemini Copilot (or press Ctrl+Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1 pt-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-600 dark:text-slate-400">Enter ↵ for new line</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400">
                  <CornerDownLeft className="w-2.5 h-2.5" /> Ctrl+Enter to send
                </span>
              </div>
              <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Actions Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Google Workspace & Products Sync Hub Modal */}
      <GoogleWorkspaceSyncModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        activeProject={activeProject}
        onAskCopilot={(promptText) => {
          setIsOpen(true);
          handleSend(promptText);
        }}
      />
    </>
  );
};
