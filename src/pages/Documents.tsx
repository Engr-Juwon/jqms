import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { uploadDocument, UploadResult } from "@/lib/cloudinary";
import { DocumentRecord } from "@/types";
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  X,
  FileCode,
  ExternalLink,
  FileSpreadsheet,
  FileImage,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const Documents: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-apex-civil";
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";
  const canUploadDoc = hasPermission(
    currentUser?.role,
    "UPLOAD_CONTROLLED_DOCUMENT",
  );

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New Doc Form
  const [docNumber, setDocNumber] = useState("MS-STR-005");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<any>("Method Statement");
  const [discipline, setDiscipline] = useState<any>("Civil/Structural");
  const [revision, setRevision] = useState<any>("Rev A");
  const [remarks, setRemarks] = useState("Approved by Supervising Consultant.");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    const list = await dbService.getDocuments(currentProjId, currentCompId);
    setDocuments(sortByNewestFirst(list));
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  const filtered = sortByNewestFirst(
    documents.filter((d) => {
      const matchCat =
        categoryFilter === "ALL" || d.category === categoryFilter;
      const matchSearch =
        (d.docNumber || d.documentNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        d.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    }),
  );

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUploadDoc) {
      toast.error(
        "You do not have permission to upload controlled documents (Level 3+ required)",
      );
      return;
    }
    setUploading(true);
    const toastId = toast.loading("Uploading document to Cloudinary...");

    try {
      let fileUrl = "#";
      let fileSizeMb = 1.0;
      let fileName = selectedFile?.name || `${docNumber}.pdf`;

      if (selectedFile) {
        const uploadRes: UploadResult = await uploadDocument(
          selectedFile,
          `jqms/documents/${currentProjId}`,
        );
        fileUrl = uploadRes.url;
        fileSizeMb = Number((selectedFile.size / (1024 * 1024)).toFixed(2));
      }

      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        projectId: currentProjId,
        companyId: company?.id || "comp-apex-civil",
        docNumber,
        documentNumber: docNumber,
        title,
        category,
        discipline,
        revision,
        status: "APPROVED",
        uploadDate: new Date().toISOString().split("T")[0],
        uploadedBy: currentUser?.fullName || "Document Controller",
        fileSizeMb,
        fileUrl,
        fileName,
        remarks,
        createdAt: new Date().toISOString(),
      };

      await dbService.saveDocument(newDoc);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: company?.id || "comp-apex-civil",
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPLOAD_DOCUMENT",
          module: "Documents",
          details: `Uploaded controlled document ${docNumber} (${revision}): ${title}`,
          newValue: newDoc,
        });
      }

      toast.success("Controlled document uploaded and registered!", {
        id: toastId,
      });
      setShowAddModal(false);
      setSelectedFile(null);
      setTitle("");
      loadData();
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      toast.error(`Upload failed: ${error?.message || "Error occurred"}`, {
        id: toastId,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
              <FolderLock className="w-4 h-4" />
              <span>Document Control & Controlled Quality Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Project Document Control
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inspection & Test Plans (ITPs), Method Statements, IFC Structural
              Drawings, Specs, and Calibration Certificates
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={!canUploadDoc}
            title={
              !canUploadDoc
                ? "Level 3+ authority required to upload controlled documents"
                : undefined
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Register Document</span>
          </button>
        </div>
      </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search document # or title..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            {[
              "ALL",
              "Method Statement",
              "ITP",
              "Structural Drawing",
              "Specification",
              "Calibration Certificate",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${categoryFilter === cat ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-bold">
              No controlled documents found
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
              Click &quot;Register Document&quot; above to upload controlled
              drawings, specifications, and method statements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Doc Number</th>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {doc.docNumber || doc.documentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{doc.title}</div>
                      {doc.remarks && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {doc.remarks}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {doc.discipline}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-300">
                      {doc.revision}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{doc.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <div>{doc.uploadedBy}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {doc.uploadDate || doc.createdAt}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {doc.fileUrl && doc.fileUrl !== "#" ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-600/20 hover:bg-brand-100 dark:hover:bg-brand-600/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 transition text-[11px] font-bold"
                          title="Open Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                          Archived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Document Modal with Cloudinary Upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Register Controlled Document</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Document # *
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Revision *
                  </label>
                  <select
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  >
                    <option value="Rev 0">Rev 0</option>
                    <option value="Rev A">Rev A</option>
                    <option value="Rev B">Rev B</option>
                    <option value="Rev C">Rev C</option>
                    <option value="Rev 1">Rev 1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Method Statement for Deep Raft Concrete Pour"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Method Statement">Method Statement</option>
                    <option value="ITP">Inspection & Test Plan (ITP)</option>
                    <option value="Structural Drawing">
                      Structural IFC Drawing
                    </option>
                    <option value="Specification">
                      Contract Specification
                    </option>
                    <option value="Calibration Certificate">
                      Calibration Certificate
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Discipline
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Civil/Structural">Civil/Structural</option>
                    <option value="Architectural">Architectural</option>
                    <option value="MEP">MEP</option>
                    <option value="QA/QC">QA/QC</option>
                  </select>
                </div>
              </div>

              {/* Cloudinary File Upload Box */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Attach Controlled Document File *
                </label>
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center gap-2">
                  <Upload className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  <div className="text-center">
                    {selectedFile ? (
                      <span className="font-semibold text-brand-600 dark:text-brand-300 text-xs">
                        {selectedFile.name}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        PDF, Drawing, Image, or Doc (Uploaded directly to
                        Cloudinary)
                      </span>
                    )}
                  </div>
                  <label className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg cursor-pointer text-xs font-semibold">
                    <span>{selectedFile ? "Change File" : "Browse File"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.jpg,.jpeg,.png,.webp"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Remarks / Approval Note
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !canUploadDoc}
                  title={
                    !canUploadDoc ? "Level 3+ authority required" : undefined
                  }
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg transition"
                >
                  {uploading
                    ? "Uploading to Cloudinary..."
                    : "Register Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
