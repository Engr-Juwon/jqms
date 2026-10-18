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
} from "lucide-react";
import { dbService } from "../../lib/db";
import { useProjectStore } from "../../stores/useProjectStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { writeAudit } from "../../lib/audit";
import { Project, Level } from "../../types";
import {
  hasMinRole,
  isGlobalManagerRole,
  isQAQCEngineerRole,
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
    currentUser?.companyId || company?.id || "comp-apex-civil";

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"details" | "matrix" | "levels">(
    tabParam === "matrix" ? "matrix" : tabParam === "levels" ? "levels" : "details",
  );

  useEffect(() => {
    if (tabParam === "matrix" || tabParam === "levels" || tabParam === "details") {
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
      if (activeProject?.id === project.id) {
        setActiveProject(updated);
      }

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

  const isCurrentActive = activeProject?.id === project.id;

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
    </div>
  );
};

export default ProjectEdit;
