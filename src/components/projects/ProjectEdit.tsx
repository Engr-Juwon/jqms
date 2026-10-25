import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  Users,
  Layers,
  MapPin,
  Calendar,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Percent,
  FileText,
  AlertTriangle,
  Box,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle,
  RotateCcw,
  CheckCheck,
} from "lucide-react";
import { dbService } from "../../lib/db";
import { useProjectStore } from "../../stores/useProjectStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { writeAudit } from "../../lib/audit";
import { Project, Level, BimModuleSettings, DEFAULT_BIM_SETTINGS } from "../../types";
import {
  hasMinRole,
  isGlobalManagerRole,
  isQAQCEngineerRole,
  canManageProjectFeatures,
} from "../../lib/permissions";
import { uploadMultiple } from "../../lib/cloudinary";
import { toast } from "react-hot-toast";
import { ProjectAssignmentMatrix } from "./ProjectAssignmentMatrix";

export const ProjectEdit: React.FC = () => {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const targetId = id || projectId;
  const navigate = useNavigate();
  const { activeProject, setActiveProject, loadProjects, selectProjectById } =
    useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "";

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"details" | "matrix" | "levels" | "bim">(
    tabParam === "matrix" ? "matrix" : tabParam === "levels" ? "levels" : tabParam === "bim" ? "bim" : "details",
  );

  useEffect(() => {
    if (tabParam === "matrix" || tabParam === "levels" || tabParam === "details" || tabParam === "bim") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [enableBim, setEnableBim] = useState(false);
  const [bimSettings, setBimSettings] = useState<Required<BimModuleSettings>>({
    ...DEFAULT_BIM_SETTINGS,
  });
  const [type, setType] = useState("High-rise Residential");
  const [customType, setCustomType] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [clientName, setClientName] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<Project["status"]>("ACTIVE");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [excludedStaffIds, setExcludedStaffIds] = useState<string[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState("");
  const [currentLevelName, setCurrentLevelName] = useState("");

  // Levels state for Tab 3
  const [levels, setLevels] = useState<Level[]>([]);
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelElevation, setNewLevelElevation] = useState<number>(0);

  const canEdit = hasMinRole(currentUser?.role, 3);
  const canManageBim = canManageProjectFeatures(currentUser, project);

  const loadData = async () => {
    setLoading(true);
    try {
      const allProjects = await dbService.getProjects(currentCompId);
      // Find by param ID, or fallback to active project, or first project
      const foundProject = targetId
        ? allProjects.find((p) => p.id === targetId) || null
        : activeProject || (allProjects.length > 0 ? allProjects[0] : null);

      if (foundProject) {
        setProject(foundProject);
        setName(foundProject.name || "");
        setCode(foundProject.code || "");

        const standardTypes = [
          "High-rise Residential",
          "Commercial",
          "Infrastructure",
          "Industrial",
          "Healthcare",
          "Educational",
          "Mixed-Use",
          "Residential",
        ];
        if (standardTypes.includes(foundProject.type)) {
          setType(foundProject.type);
          setCustomType("");
        } else {
          setType("Other");
          setCustomType(foundProject.type || "");
        }

        setLocation(foundProject.location || foundProject.address || "");
        setCountry(foundProject.country || "Nigeria");
        setClientName(foundProject.clientName || "");
        setConsultantName(foundProject.consultantName || "");
        setContractorName(foundProject.contractorName || "");
        setStartDate(foundProject.startDate || "");
        setEndDate(foundProject.endDate || "");
        setStatus(foundProject.status || "ACTIVE");
        setDescription(foundProject.description || "");
        setProgress(
          typeof foundProject.progress === "number" ? foundProject.progress : 0,
        );
        setIconUrl(foundProject.iconUrl || "");
        setImageUrl(foundProject.imageUrl || foundProject.coverImageUrl || "");
        setCurrentLevelId(foundProject.currentLevelId || "");
        setCurrentLevelName(foundProject.currentLevelName || "");
        const existingBim = foundProject.bimSettings || {};
        const loadedBim: Required<BimModuleSettings> = {
          enable2D: existingBim.enable2D ?? DEFAULT_BIM_SETTINGS.enable2D,
          enable3D: existingBim.enable3D ?? DEFAULT_BIM_SETTINGS.enable3D,
          enable4D: existingBim.enable4D ?? DEFAULT_BIM_SETTINGS.enable4D,
          enable5D: existingBim.enable5D ?? DEFAULT_BIM_SETTINGS.enable5D,
          enable6D: existingBim.enable6D ?? DEFAULT_BIM_SETTINGS.enable6D,
          enable7D: existingBim.enable7D ?? DEFAULT_BIM_SETTINGS.enable7D,
          enableMTO: existingBim.enableMTO ?? DEFAULT_BIM_SETTINGS.enableMTO,
          enableGridlines: existingBim.enableGridlines ?? DEFAULT_BIM_SETTINGS.enableGridlines,
          enableLevels: existingBim.enableLevels ?? DEFAULT_BIM_SETTINGS.enableLevels,
          enablePackages: existingBim.enablePackages ?? DEFAULT_BIM_SETTINGS.enablePackages,
        };
        setBimSettings(loadedBim);
        setEnableBim(
          foundProject.bimSettings
            ? Object.values(loadedBim).some(Boolean)
            : (foundProject.enableBim ?? true),
        );

        // Load assigned staff with defaults
        let staff =
          foundProject.assignedStaff || foundProject.assignedStaffIds || [];
        if (!Array.isArray(staff)) staff = [];
        setAssignedStaff(staff);

        let excluded = foundProject.excludedStaffIds || [];
        if (!Array.isArray(excluded)) excluded = [];
        setExcludedStaffIds(excluded);

        // Load project levels
        const projLevels = await dbService.getLevels(foundProject.id);
        setLevels(projLevels.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
      toast.error("Failed to load project configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId, currentCompId]);

  // Image upload handlers
  const handleUploadCoverImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;
    setUploadingImage(true);
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/projects/${project.id}/cover`,
      );
      if (results.length > 0) {
        setImageUrl(results[0].url);
        toast.success("Project cover image uploaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;
    setUploadingIcon(true);
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/projects/${project.id}/icon`,
      );
      if (results.length > 0) {
        setIconUrl(results[0].url);
        toast.success("Project icon uploaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  // Add Level
  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelName.trim() || !project) return;
    try {
      const newLvl: Level = {
        id: `lvl-${project.id}-${Date.now().toString().slice(-6)}`,
        projectId: project.id,
        companyId: project.companyId || currentCompId,
        name: newLevelName.trim(),
        elevation: Number(newLevelElevation) || 0,
        order: levels.length + 1,
      };
      await dbService.saveLevel(newLvl);
      setLevels([...levels, newLvl]);
      setNewLevelName("");
      setNewLevelElevation(0);
      toast.success(`Level ${newLvl.name} added`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add level");
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!project) return;
    if (!window.confirm("Are you sure you want to remove this floor level?"))
      return;
    try {
      await dbService.deleteLevel(levelId);
      setLevels(levels.filter((l) => l.id !== levelId));
      toast.success("Level removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete level");
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setSaving(true);
    try {
      const resolvedType =
        type === "Other" ? customType.trim() || "General" : type;

      const updated: Project = {
        ...project,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type: resolvedType,
        location: location.trim(),
        address: location.trim(),
        country: country.trim(),
        clientName: clientName.trim(),
        contractorName: contractorName.trim(),
        consultantName: consultantName.trim(),
        startDate,
        endDate,
        status,
        description: description.trim(),
        progress: Number(progress) || 0,
        iconUrl: iconUrl.trim(),
        imageUrl: imageUrl.trim(),
        coverImageUrl: imageUrl.trim(),
        assignedStaff,
        assignedStaffIds: assignedStaff,
        excludedStaffIds,
        currentLevelId,
        currentLevelName,
        enableBim: Object.values(bimSettings).some(Boolean),
        bimSettings: { ...bimSettings },
        companyId: project.companyId || currentCompId,
        companyName: project.companyName || company?.name || "",
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveProject(updated);

      // Sync user documents so user.projectAccess and user.projectIds match project.assignedStaff
      try {
        const companyUsers = await dbService.getUsers(currentCompId);
        const assignedSet = new Set(assignedStaff);
        const excludedSet = new Set(excludedStaffIds);

        for (const u of companyUsers) {
          if (isGlobalManagerRole(u.role)) continue; // Managers automatically assigned

          if (isQAQCEngineerRole(u.role)) {
            // QA/QC Engineers: assigned automatically across all projects unless excluded by Level 5
            const isExcluded = excludedSet.has(u.uid);
            const currentAccess = u.projectAccess?.[project.id];
            if (isExcluded && currentAccess !== false) {
              const nextAccess = {
                ...(u.projectAccess || {}),
                [project.id]: false,
              };
              const nextIds = (u.projectIds || []).filter(
                (id) => id !== project.id,
              );
              await dbService.saveUser({
                ...u,
                projectAccess: nextAccess,
                projectIds: nextIds,
              });
            } else if (!isExcluded && currentAccess === false) {
              const nextAccess = { ...(u.projectAccess || {}) };
              delete nextAccess[project.id];
              await dbService.saveUser({
                ...u,
                projectAccess: nextAccess,
              });
            }
            continue;
          }

          const isAssigned = assignedSet.has(u.uid);
          const hadAccess =
            u.projectAccess?.[project.id] === true ||
            u.projectIds?.includes(project.id);

          if (isAssigned && !hadAccess) {
            const nextAccess = {
              ...(u.projectAccess || {}),
              [project.id]: true,
            };
            const nextIds = Array.from(
              new Set([
                ...(u.projectIds || []).filter((id) => id !== "*"),
                project.id,
              ]),
            );
            await dbService.saveUser({
              ...u,
              projectAccess: nextAccess,
              projectIds: nextIds,
            });
          } else if (!isAssigned && hadAccess) {
            const nextAccess = { ...(u.projectAccess || {}) };
            delete nextAccess[project.id];
            const nextIds = (u.projectIds || []).filter(
              (id) => id !== project.id && id !== "*",
            );
            const nextActiveProj =
              u.lastActiveProjectId === project.id ? "" : u.lastActiveProjectId;
            await dbService.saveUser({
              ...u,
              projectAccess: nextAccess,
              projectIds: nextIds,
              lastActiveProjectId: nextActiveProj,
            });
          }
        }
      } catch (syncErr) {
        console.warn("Could not sync user project access flags:", syncErr);
      }

      if (currentUser) {
        await writeAudit({
          companyId: currentCompId,
          projectId: project.id,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_PROJECT",
          module: "Settings",
          details: `Updated specification and assignment matrix for ${updated.name} (${updated.code}). Assigned personnel count: ${assignedStaff.length}`,
          newValue: updated,
        });
      }

      await loadProjects();
      const isTargetActive =
        activeProject?.id === project.id ||
        activeProject?.code === project.code ||
        localStorage.getItem("jqms_active_project_id") === project.id;

      if (isTargetActive) {
        setActiveProject(updated);
      }

      const { projects: currentProjects } = useProjectStore.getState();
      useProjectStore.setState({
        projects: currentProjects.map((p) =>
          p.id === updated.id ? updated : p,
        ),
        activeProject: isTargetActive
          ? updated
          : useProjectStore.getState().activeProject,
      });

      toast.success(`Project ${updated.name} updated successfully`);
      setProject(updated);
    } catch (err) {
      console.error("Failed to update project:", err);
      toast.error("Failed to save project changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <div className="w-8 h-8 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading Project Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Project Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          The requested project record could not be loaded or you do not have
          sufficient permissions.
        </p>
        <button
          onClick={() => navigate("/company/projects")}
          className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition"
        >
          Return to Projects Directory
        </button>
      </div>
    );
  }

  const isCurrentActive =
    activeProject?.id === project.id ||
    activeProject?.code === project.code ||
    localStorage.getItem("jqms_active_project_id") === project.id;
  const activeBimCount = Object.values(bimSettings).filter(Boolean).length;

  // Persists BIM module changes immediately to Cloud Firestore and syncs useProjectStore
  const applyAndPersistBimSettings = async (
    nextBimSettings: Required<BimModuleSettings>,
    successMessage: string,
  ) => {
    if (!canManageBim || !project) return;

    setBimSettings(nextBimSettings);
    const anyEnabled = Object.values(nextBimSettings).some(Boolean);
    setEnableBim(anyEnabled);

    const updatedProject: Project = {
      ...project,
      enableBim: anyEnabled,
      bimSettings: { ...nextBimSettings },
      updatedAt: new Date().toISOString(),
    };

    setProject(updatedProject);

    try {
      // 1. Immediately persist to Cloud Firestore & Local Cache
      await dbService.saveProject(updatedProject);

      // 2. Immediately update useProjectStore activeProject and projects list
      const isTargetActive =
        activeProject?.id === project.id ||
        activeProject?.code === project.code ||
        localStorage.getItem("jqms_active_project_id") === project.id ||
        !activeProject;

      if (isTargetActive) {
        setActiveProject(updatedProject);
      }

      const { projects: currentProjects } = useProjectStore.getState();
      useProjectStore.setState({
        projects: currentProjects.map((p) =>
          p.id === updatedProject.id ? updatedProject : p,
        ),
        activeProject: isTargetActive
          ? updatedProject
          : useProjectStore.getState().activeProject,
      });

      toast.success(successMessage);
    } catch (saveErr) {
      console.error("Could not persist BIM settings:", saveErr);
      toast.error("Failed to persist BIM configuration to cloud database.");
    }
  };

  const handleResetBimDefaults = () => {
    if (!canManageBim) {
      toast.error("Permission Denied: Only Level 5 authority or Project Admin can configure BIM modules.");
      return;
    }
    applyAndPersistBimSettings(
      { ...DEFAULT_BIM_SETTINGS },
      "BIM modules reset to defaults (2D, 3D, 7D, MTO, Gridlines, Levels, Packages ON; 4D, 5D, 6D OFF)",
    );
  };

  const handleEnableAllBim = () => {
    if (!canManageBim) {
      toast.error("Permission Denied: Only Level 5 authority or Project Admin can configure BIM modules.");
      return;
    }
    applyAndPersistBimSettings(
      {
        enable2D: true,
        enable3D: true,
        enable4D: true,
        enable5D: true,
        enable6D: true,
        enable7D: true,
        enableMTO: true,
        enableGridlines: true,
        enableLevels: true,
        enablePackages: true,
      },
      "All 10 BIM modules enabled and active across navigation & routing",
    );
  };

  const handleDisableAllBim = () => {
    if (!canManageBim) {
      toast.error("Permission Denied: Only Level 5 authority or Project Admin can configure BIM modules.");
      return;
    }
    applyAndPersistBimSettings(
      {
        enable2D: false,
        enable3D: false,
        enable4D: false,
        enable5D: false,
        enable6D: false,
        enable7D: false,
        enableMTO: false,
        enableGridlines: false,
        enableLevels: false,
        enablePackages: false,
      },
      "All 10 BIM modules disabled and blocked across navigation & routing",
    );
  };

  const handleToggleBimModule = (key: keyof BimModuleSettings) => {
    if (!canManageBim) {
      toast.error("Permission Denied: Only Level 5 authority or Project Admin can configure BIM modules.");
      return;
    }
    const nextVal = !bimSettings[key];
    const nextBim: Required<BimModuleSettings> = {
      ...bimSettings,
      [key]: nextVal,
    };
    const config = BIM_MODULE_CONFIGS.find((c) => c.key === key);
    const label = config ? `${config.dimension} (${config.title})` : key;
    applyAndPersistBimSettings(
      nextBim,
      `${label} ${nextVal ? "enabled" : "disabled and blocked"} across navigation`,
    );
  };

  const BIM_MODULE_CONFIGS: {
    key: keyof BimModuleSettings;
    dimension: string;
    title: string;
    description: string;
    route: string;
    defaultState: boolean;
    color: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    {
      key: "enable2D",
      dimension: "2D BIM",
      title: "Interactive Grid Plan",
      description: "Interactive architectural/structural CAD floor plans with live element pins.",
      route: "/project/grid-plan",
      defaultState: true,
      color: "border-blue-500/30 dark:border-blue-500/20",
      badgeBg: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
      badgeText: "CAD & Plans",
    },
    {
      key: "enable3D",
      dimension: "3D BIM",
      title: "3D Structural Twin Viewer",
      description: "WebGL Three.js 3D structural model with quality status overlays and inspection pins.",
      route: "/project/bim-3d",
      defaultState: true,
      color: "border-indigo-500/30 dark:border-indigo-500/20",
      badgeBg: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
      badgeText: "Digital Twin",
    },
    {
      key: "enable7D",
      dimension: "7D BIM",
      title: "Asset Register & Passports",
      description: "Master structural element directory, physical QR asset passports, and lifecycle logs.",
      route: "/project/elements",
      defaultState: true,
      color: "border-purple-500/30 dark:border-purple-500/20",
      badgeBg: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
      badgeText: "Asset Register",
    },
    {
      key: "enableMTO",
      dimension: "MTO",
      title: "Material Take-Off (MTO)",
      description: "Concrete pour volume schedules, element dimension matrices, and rebar schedules.",
      route: "/project/mto",
      defaultState: true,
      color: "border-sky-500/30 dark:border-sky-500/20",
      badgeBg: "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
      badgeText: "Take-Off",
    },
    {
      key: "enableGridlines",
      dimension: "Spatial Matrix",
      title: "Gridlines & Axis Matrix",
      description: "Structural coordinate axis grid, column coordinates, and gridline spacing.",
      route: "/project/gridlines",
      defaultState: true,
      color: "border-teal-500/30 dark:border-teal-500/20",
      badgeBg: "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
      badgeText: "Axis Matrix",
    },
    {
      key: "enableLevels",
      dimension: "Spatial Matrix",
      title: "Floor Levels & Vertical Zones",
      description: "Building elevation hierarchy, storeys, datum heights, and floor sequences.",
      route: "/project/levels",
      defaultState: true,
      color: "border-cyan-500/30 dark:border-cyan-500/20",
      badgeBg: "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
      badgeText: "Levels",
    },
    {
      key: "enablePackages",
      dimension: "Spatial Matrix",
      title: "Work Packages & Disciplines",
      description: "Contractor discipline scopes, trades decomposition, and package assignments.",
      route: "/project/packages",
      defaultState: true,
      color: "border-rose-500/30 dark:border-rose-500/20",
      badgeBg: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
      badgeText: "Packages",
    },
    {
      key: "enable4D",
      dimension: "4D BIM",
      title: "4D Construction Planner",
      description: "Milestone timeline schedule, lookahead Gantt, and background planner reminders.",
      route: "/project/planner",
      defaultState: false,
      color: "border-orange-500/30 dark:border-orange-500/20",
      badgeBg: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
      badgeText: "Planner & Time",
    },
    {
      key: "enable5D",
      dimension: "5D BIM",
      title: "5D Cost Takeoff & BOQ",
      description: "Bill of quantities, elemental unit rates, cost projections, and commercial modeling.",
      route: "/project/5d-cost",
      defaultState: false,
      color: "border-amber-500/30 dark:border-amber-500/20",
      badgeBg: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
      badgeText: "Cost & BOQ",
    },
    {
      key: "enable6D",
      dimension: "6D BIM",
      title: "6D Carbon & Sustainability ESG",
      description: "Embodied carbon calculations, concrete & rebar CO2 footprints, and green rating metrics.",
      route: "/project/6d-carbon",
      defaultState: false,
      color: "border-emerald-500/30 dark:border-emerald-500/20",
      badgeBg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
      badgeText: "Carbon & ESG",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-200">
      {/* ═══ Header Bar ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                {project.code}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                }`}
              >
                {status}
              </span>
              {isCurrentActive && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  Active Workspace
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
              Edit {name || project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveProject(project);
              navigate(`/project/${project.id}/dashboard`);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Workspace</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canEdit}
            className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/20 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>

      {/* ═══ Navigation Tabs ═══ */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
            activeTab === "details"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4 text-brand-600" />
          <span>Profile &amp; Specification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
            activeTab === "matrix"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-purple-500" />
          <span>Personnel Assignment Matrix</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
            {assignedStaff.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("levels")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
            activeTab === "levels"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4 text-blue-500" />
          <span>Structural Levels</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
            {levels.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bim")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
            activeTab === "bim"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Box className="w-4 h-4 text-amber-500" />
          <span>BIM (2D - 7D) Controls</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeBimCount > 0
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
            }`}
          >
            {activeBimCount > 0 ? `${activeBimCount}/10 ACTIVE` : "ALL DISABLED"}
          </span>
        </button>
      </div>

      {/* ═══ TAB 1: Profile & Specification ═══ */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity & Core Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Project Identity &amp; Classification</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bankside Commercial Complex"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CDL-BS"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs uppercase font-mono font-bold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Category / Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="High-rise Residential">
                    High-rise Residential
                  </option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Educational">Educational</option>
                  <option value="Residential">Residential</option>
                  <option value="Other">Other (Custom Classification)</option>
                </select>
                {type === "Other" && (
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom project classification..."
                    className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Lifecycle Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="ACTIVE">
                    ACTIVE — Under Construction &amp; QA/QC Control
                  </option>
                  <option value="ON_HOLD">
                    ON_HOLD — Works Suspended Temporarily
                  </option>
                  <option value="COMPLETED">
                    COMPLETED — Handed Over &amp; Closed Out
                  </option>
                  <option value="ARCHIVED">
                    ARCHIVED — Historical Records Vault
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Site Physical Location / Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. No 16, Alhaji Kanike Close, Ikoyi, Lagos"
                    className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Country / Region
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Scope Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Summary of construction scope, structural systems, foundation type, and quality criteria..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Stakeholders & Contractors */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Key Stakeholders &amp; Contractors</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Developer Entity
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. COLLECTION DEVELOPMENTS LTD"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Main Contractor Organization
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. COLLECTION DEVELOPMENTS LTD"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Consultant / Architect / QAQC Lead
                </label>
                <input
                  type="text"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  placeholder="e.g. Engr. Lekan Akindele"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Project Timeline &amp; Progress Metric</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Planned Commencement Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Handover / Completion Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Overall Progress Percentage
                  </label>
                  <span className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400">
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="flex-1 accent-[#ea580c]"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media & Visual Identity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>Project Visual Assets &amp; Cover Media</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Icon */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Icon / Brand Avatar (Square)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="Project Icon"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={iconUrl}
                      onChange={(e) => setIconUrl(e.target.value)}
                      placeholder="Icon URL (e.g. Cloudinary)..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition border border-slate-200 dark:border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingIcon ? "Uploading..." : "Upload Avatar"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingIcon}
                        onChange={handleUploadIcon}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Site Hero Cover Photo (Landscape)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Project Cover"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Cover Image URL (e.g. Cloudinary)..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition border border-slate-200 dark:border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingImage ? "Uploading..." : "Upload Site Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleUploadCoverImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !canEdit}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ═══ TAB 2: Personnel Assignment Matrix ═══ */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <ProjectAssignmentMatrix
            assignedStaff={assignedStaff}
            onChange={(updated) => {
              setAssignedStaff(updated);
            }}
            excludedStaffIds={excludedStaffIds}
            onExcludedChange={(updatedExcluded) => {
              setExcludedStaffIds(updatedExcluded);
            }}
            readOnly={!canEdit}
            companyId={project.companyId || currentCompId}
            projectName={name || project.name}
            projectCode={code || project.code}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {assignedStaff.length} specific user(s) explicitly assigned in
              project manifest.
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !canEdit}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Matrix Assignments"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: Structural Floor Levels ═══ */}
      {activeTab === "levels" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Structural Floor Levels &amp; Spatial Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage vertical construction elevations for 3D BIM elements,
                  concrete pours, and inspection checklists.
                </p>
              </div>

              {/* Default active level selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Default Level:
                </span>
                <select
                  value={currentLevelId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setCurrentLevelId(selId);
                    const matching = levels.find((l) => l.id === selId);
                    if (matching) setCurrentLevelName(matching.name);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">None Selected</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} (
                      {lvl.elevation > 0
                        ? `+${lvl.elevation}m`
                        : `${lvl.elevation}m`}
                      )
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Level Form */}
            {canEdit && (
              <form
                onSubmit={handleAddLevel}
                className="flex flex-wrap items-end gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Level Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder="e.g. 02 - Second Floor"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Elevation (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLevelElevation}
                    onChange={(e) =>
                      setNewLevelElevation(Number(e.target.value))
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Level</span>
                </button>
              </form>
            )}

            {/* Levels List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {levels.length > 0 ? (
                levels.map((lvl, idx) => (
                  <div
                    key={lvl.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-500">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {lvl.name}
                        </span>
                        {lvl.id === currentLevelId && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Active Default
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-slate-500">
                        {lvl.elevation > 0
                          ? `+${lvl.elevation}m`
                          : `${lvl.elevation}m`}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLevel(lvl.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 rounded transition"
                          title="Delete Level"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No floor levels registered for this project.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !canEdit}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Configuration"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: BIM (2D-7D) Feature Controls ═══ */}
      {activeTab === "bim" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Header & Quick Presets */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>BIM &amp; Spatial Twin Governance (2D - 7D)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure granular per-page accessibility for {project.name}. You can keep 2D or any dimension on and turn off the rest.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Status Pill */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Active Suite:
                  </span>
                  <span className="text-xs font-mono font-black text-brand-600 dark:text-brand-400">
                    {activeBimCount} / 10 Modules
                  </span>
                </div>

                {canManageBim && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetBimDefaults}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                      title="Reset to Recommended: 2D, 3D, 7D, MTO, Gridlines, Levels, Packages ON; 4D, 5D, 6D OFF"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEnableAllBim}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Enable All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisableAllBim}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold transition"
                    >
                      <span>Disable All</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Permission Guard Notice */}
            {!canManageBim && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Restricted Feature Management
                  </div>
                  <div className="text-amber-700 dark:text-amber-400 leading-relaxed">
                    Only the <strong>Project Administrator</strong> (Project Manager or Creator) or someone on <strong>Level 5</strong> (Super Admin, Quality Director, Executive Management, Quality Manager, QAQC Manager) is authorized to toggle BIM dimensions on this project.
                  </div>
                </div>
              </div>
            )}

            {/* Policy Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-white">
                  Individual Navigation &amp; Routing Isolation
                </div>
                <p>
                  Any page switched OFF is <strong>immediately hidden and blocked</strong> across all navigation systems (Sidebar rail, secondary drawer, mobile bottom nav, Mega Directory catalog, dashboard quick links, and BIM dimension tabs). Direct URL attempts are stopped with an authorized notice.
                </p>
              </div>
            </div>

            {/* Controlled BIM Modules Cards Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Individual BIM Pages &amp; Dimensions (10 Total)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Defaults: 2D, 3D, 7D, MTO, Gridlines, Levels, Packages ON • 4D, 5D, 6D OFF
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BIM_MODULE_CONFIGS.map((config) => {
                  const isEnabled = Boolean(bimSettings[config.key]);
                  return (
                    <div
                      key={config.key}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isEnabled
                          ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
                          : "bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 opacity-70"
                      }`}
                    >
                      {/* Top Row: Badges & Switch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${config.badgeBg}`}
                          >
                            {config.dimension}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {config.badgeText}
                          </span>
                        </div>

                        {/* Interactive Toggle */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase ${
                              isEnabled
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-400"
                            }`}
                          >
                            {isEnabled ? "Visible" : "Hidden"}
                          </span>

                          <button
                            type="button"
                            disabled={!canManageBim}
                            onClick={() => handleToggleBimModule(config.key)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                              isEnabled
                                ? "bg-emerald-600"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                            role="switch"
                            aria-checked={isEnabled}
                            title={
                              canManageBim
                                ? isEnabled
                                  ? `Click to disable ${config.title}`
                                  : `Click to enable ${config.title}`
                                : "Only Project Administrator or Level 5 Authorities can toggle this page"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                isEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            >
                              {isEnabled ? (
                                <Eye className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-2.5 h-2.5 text-slate-400" />
                              )}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{config.title}</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {config.description}
                        </p>
                      </div>

                      {/* Route Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        <span>{config.route}</span>
                        <span>{config.defaultState ? "Default: ON" : "Default: OFF"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !canManageBim}
                className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Configuration"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEdit;
