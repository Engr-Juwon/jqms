import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  Users,
  MapPin,
  Calendar,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  Sparkles,
} from "lucide-react";
import { dbService } from "../../lib/db";
import { writeAudit } from "../../lib/audit";
import { useProjectStore } from "../../stores/useProjectStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { Project, UserProfile, DEFAULT_BIM_SETTINGS } from "../../types";
import { isGlobalManagerRole, isQAQCEngineerRole } from "../../lib/permissions";
import { uploadMultiple } from "../../lib/cloudinary";
import { toast } from "react-hot-toast";
import { ProjectAssignmentMatrix } from "./ProjectAssignmentMatrix";

export const ProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveProject, loadProjects } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    company?.id || currentUser?.companyId || "";

  const [activeTab, setActiveTab] = useState<"details" | "matrix">("details");
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
  const [contractorName, setContractorName] = useState(
    company?.name || "COLLECTION DEVELOPMENTS LTD",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
  );
  const [status, setStatus] = useState<Project["status"]>("ACTIVE");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [excludedStaffIds, setExcludedStaffIds] = useState<string[]>([]);

  // Automatically initialize assigned staff with all Managers + QAQC Engineers (excluding SUPER_ADMIN)
  useEffect(() => {
    const initStaff = async () => {
      try {
        const rawStaff = await dbService.getUsers(currentCompId);
        const staffList = rawStaff.filter((u) => u.role !== "SUPER_ADMIN");
        if (
          currentUser &&
          currentUser.role !== "SUPER_ADMIN" &&
          !staffList.some((u) => u.uid === currentUser.uid)
        ) {
          staffList.unshift(currentUser);
        }
        const defaultUids = staffList
          .filter(
            (u) => isGlobalManagerRole(u.role) || isQAQCEngineerRole(u.role),
          )
          .map((u) => u.uid);
        setAssignedStaff(defaultUids);
      } catch (err) {
        console.warn("Could not prefill assigned staff:", err);
      }
    };
    initStaff();
  }, [currentCompId, currentUser]);

  const handleUploadCoverImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/projects/new/cover`,
      );
      if (results.length > 0) {
        setImageUrl(results[0].url);
        toast.success("Cover photo uploaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload cover photo");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingIcon(true);
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/projects/new/icon`,
      );
      if (results.length > 0) {
        setIconUrl(results[0].url);
        toast.success("Icon uploaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Please specify project name and code");
      return;
    }

    setSaving(true);
    try {
      const resolvedCode = code.trim().toUpperCase();
      const newProjId = `proj-${resolvedCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
      const resolvedType =
        type === "Other" ? customType.trim() || "General" : type;

      const newProj: Project = {
        id: newProjId,
        companyId: currentCompId,
        companyName: company?.name || company?.legalName || "Organization",
        name: name.trim(),
        code: resolvedCode,
        type: resolvedType,
        location: location.trim(),
        address: location.trim(),
        country: country.trim(),
        clientName: clientName.trim(),
        consultantName: consultantName.trim(),
        contractorName: contractorName.trim(),
        status,
        startDate,
        endDate,
        description: description.trim(),
        progress: Number(progress) || 0,
        iconUrl: iconUrl.trim(),
        imageUrl: imageUrl.trim(),
        coverImageUrl: imageUrl.trim(),
        assignedStaff,
        assignedStaffIds: assignedStaff,
        excludedStaffIds,
        currentLevelId: `lvl-${newProjId}-gf`,
        currentLevelName: "Ground Floor",
        createdBy: currentUser?.uid || "",
        enableBim: true,
        bimSettings: { ...DEFAULT_BIM_SETTINGS },
        createdAt: Date.now(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveProject(newProj);

      // Provision standard baseline ISO structural levels
      const defaultLevels = [
        {
          id: `lvl-${newProjId}-b1`,
          projectId: newProjId,
          companyId: currentCompId,
          name: "Basement 1",
          elevation: -3.5,
          order: 1,
        },
        {
          id: `lvl-${newProjId}-gf`,
          projectId: newProjId,
          companyId: currentCompId,
          name: "Ground Floor",
          elevation: 0.0,
          order: 2,
        },
        {
          id: `lvl-${newProjId}-l1`,
          projectId: newProjId,
          companyId: currentCompId,
          name: "01 - First Floor",
          elevation: 4.2,
          order: 3,
        },
        {
          id: `lvl-${newProjId}-l2`,
          projectId: newProjId,
          companyId: currentCompId,
          name: "02 - Second Floor",
          elevation: 7.8,
          order: 4,
        },
        {
          id: `lvl-${newProjId}-rf`,
          projectId: newProjId,
          companyId: currentCompId,
          name: "Roof Level",
          elevation: 11.4,
          order: 5,
        },
      ];

      for (const lvl of defaultLevels) {
        await dbService.saveLevel(lvl);
      }

      if (currentUser) {
        await writeAudit({
          companyId: currentCompId,
          projectId: newProjId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "CREATE_PROJECT",
          module: "Settings",
          details: `Provisioned new project ${name} (${resolvedCode}) with ${assignedStaff.length} assigned personnel and ${defaultLevels.length} structural floor levels`,
          newValue: newProj,
        });
      }

      await loadProjects();
      setActiveProject(newProj);
      toast.success(`Project ${newProj.name} provisioned successfully`);
      navigate(`/project/${newProj.id}/dashboard`);
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error("Failed to create project workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-200">
      {/* ═══ Header Bar ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate("/company/projects")}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Provision New Construction Project
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Initialize a multi-tenant QA/QC engineering workspace, team
              assignment matrix, and BIM floor levels.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Provisioning..." : "Provision Workspace"}</span>
        </button>
      </div>

      {/* ═══ Navigation Tabs ═══ */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "details"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4 text-brand-600" />
          <span>1. Profile &amp; Specifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "matrix"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-purple-500" />
          <span>2. Team Assignment Matrix</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
            {assignedStaff.length} Pre-Selected
          </span>
        </button>
      </div>

      {/* ═══ TAB 1: Profile & Specification ═══ */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g. Bankside"
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
                  Project Type
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
                  Operational Status
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
                placeholder="Scope of works, structural framework, concrete grade targets, and quality standards..."
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

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Project Timeline</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Project Icon / Avatar (Square)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt="Project Icon"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-slate-400" />
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
                  Site Hero Photo (Landscape)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Project Cover"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-slate-400" />
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/company/projects")}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition"
            >
              <span>Next: Customize Team Matrix →</span>
            </button>
          </div>
        </form>
      )}

      {/* ═══ TAB 2: Personnel Assignment Matrix ═══ */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <ProjectAssignmentMatrix
            assignedStaff={assignedStaff}
            onChange={(updated) => setAssignedStaff(updated)}
            excludedStaffIds={excludedStaffIds}
            onExcludedChange={(updatedExcluded) =>
              setExcludedStaffIds(updatedExcluded)
            }
            companyId={currentCompId}
            projectName={name || "New Project"}
            projectCode={code || "NEW"}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              ← Back to Details
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving ? "Provisioning..." : "Provision Project Workspace"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCreate;
