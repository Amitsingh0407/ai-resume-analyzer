import { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Resume, AnalysisReport } from "../types";
import api from "../services/api";
import {
  UploadCloud,
  FileText,
  Trash2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Search,
  BookOpen,
  Check,
  AlertOctagon,
  Calendar,
  X,
  FileCode,
  Sparkles,
  RefreshCw,
  Menu,
  Database,
  LogOut,
  Bell,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Selected State variables
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  // Form input variables
  const [jobDescription, setJobDescription] = useState<string>("");
  const [targetFile, setTargetFile] = useState<File | null>(null);
  
  // Operation variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Theme support local states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Tabs for switching details view
  const [activeTab, setActiveTab] = useState<"analysis" | "text">("analysis");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes list on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async (selectNewest = false) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await api.get("/resume/list");
      const listData: Resume[] = res.data;
      setResumes(listData);
      
      if (listData.length > 0) {
        if (selectNewest) {
          // Select the newly uploaded item
          setSelectedResume(listData[0]);
        } else if (!selectedResume) {
          // Select default item
          setSelectedResume(listData[0]);
        } else {
          // Keep current selection synced
          const current = listData.find((r) => r.id === selectedResume.id);
          if (current) {
            setSelectedResume(current);
          } else {
            setSelectedResume(listData[0]);
          }
        }
      } else {
        setSelectedResume(null);
      }
    } catch (err: any) {
      console.error("Failed to load resumes:", err);
      setErrorMessage("Could not load historic resume data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop Handles
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Invalid file type. Only PDF resumes are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds size limit of 10MB. Please use a smaller file.");
      return;
    }
    setTargetFile(file);
  };

  // Upload actions
  const handleUploadSubmit = async () => {
    if (!targetFile) {
      setErrorMessage("Please select or drop a PDF file first.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("resume", targetFile);
    formData.append("jobDescription", jobDescription);

    try {
      const res = await api.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setSuccessMessage("Resume uploaded and analyzed successfully!");
      setTargetFile(null);
      setJobDescription("");
      
      // Clear file inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Re-fetch resumes and select the newly uploaded resume
      await fetchResumes(true);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(
        err.response?.data?.error || "Error analyzing resume. Please ensure the PDF has readable text."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Retrieve full details of a resume (including extracted text)
  const handleViewDetails = async (resume: Resume) => {
    setErrorMessage("");
    try {
      const res = await api.get(`/resume/${resume.id}`);
      setSelectedResume(res.data);
      setActiveTab("analysis");
    } catch (err: any) {
      setErrorMessage("Unable to retrieve report details. Please try again.");
    }
  };

  // Delete resume
  const handleDeleteResume = async (id: string, e: any) => {
    e.stopPropagation(); // Prevent selection
    if (!confirm("Are you sure you want to permanently delete this resume analysis?")) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.delete(`/resume/${id}`);
      setSuccessMessage("Resume analysis deleted successfully.");
      
      if (selectedResume && selectedResume.id === id) {
        setSelectedResume(null);
      }
      
      fetchResumes();
    } catch (err: any) {
      console.error("Delete error:", err);
      setErrorMessage("Could not delete resume record.");
    }
  };

  // Color mapper for ATS score indicator
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-100";
    if (score >= 55) return "text-amber-600 bg-amber-50 border-amber-100 ring-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100 ring-rose-100";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 55) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Formatting historical coordinates for charts
  const getChartData = () => {
    return [...resumes]
      .reverse() // Chronological order
      .map((item) => ({
        name: new Date(item.uploadDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        Score: item.ATSScore,
        FileName: item.fileName.substring(0, 15),
      }));
  };

  // Stats summaries
  const totalResumes = resumes.length;
  const highestScore = resumes.length > 0 ? Math.max(...resumes.map((r) => r.ATSScore)) : 0;
  const averageScore =
    resumes.length > 0
      ? Math.round(resumes.reduce((acc, r) => acc + r.ATSScore, 0) / resumes.length)
      : 0;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* 1. MOBILE BACKDROP OVERLAY */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 flex w-68 flex-col justify-between bg-white border-r border-slate-200 py-6 px-4 lg:hidden"
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 block">Vantage ATS</span>
                    <span className="text-[10px] font-semibold text-slate-400 block -mt-1">AI Resume Optimizer</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm"
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  Dashboard Console
                </button>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  <UploadCloud className="w-4.5 h-4.5" />
                  Upload New Resume
                </button>
                <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  System Mode
                </div>
                <div className="mx-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/30 px-3 py-2 text-xs font-semibold text-indigo-700">
                  <Database className="w-3.5 h-3.5" />
                  <span>{(user as any)?.dbMode || "Dual Connection Mode"}</span>
                </div>
              </nav>
            </div>

            <div className="space-y-4">
              {/* Premium upgrade promo block */}
              <div className="bg-indigo-600 rounded-xl p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-85 mb-1.5">Pro Account</p>
                <p className="text-xs leading-relaxed mb-3.5">Enhance your job hunt with unlimited smart AI scans.</p>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    setShowUpgradeModal(true);
                  }}
                  className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold text-xs uppercase transition active:scale-95 hover:bg-slate-50"
                >
                  Upgrade Now
                </button>
              </div>

              {/* User logout section */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 3. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden lg:flex w-68 bg-white border-r border-slate-200 flex-col justify-between py-6 px-4 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <FileCode className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block">Vantage ATS</span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1">AI Resume Optimizer</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm"
            >
              <Sparkles className="w-4.5 h-4.5" />
              Dashboard Console
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-indigo-50/40 hover:text-indigo-600 rounded-lg text-sm font-semibold transition animate-fade-in"
            >
              <UploadCloud className="w-4.5 h-4.5" />
              Upload New
            </button>
            <div className="px-3 py-2.5 flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
              System Configuration
            </div>
            <div className="mx-3 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/55 px-3 py-2 text-[10px] font-semibold text-slate-500">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">{ (user as any)?.dbMode || "Active Schema" }</span>
            </div>
          </nav>
        </div>

        <div className="space-y-4">
          {/* Upgrade account block */}
          <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-md shadow-indigo-600/10">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-85 mb-1.5">Pro Account</p>
            <p className="text-xs leading-relaxed mb-3.5">Enhance your job hunt with unlimited smart AI scans.</p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold text-xs uppercase transition duration-150 active:scale-95 hover:bg-slate-50"
            >
              Upgrade Now
            </button>
          </div>

          {/* User Profile Block */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4f46e5&color=fff`}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-slate-100 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate" title={user?.name}>{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate" title={user?.email}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 4. MAIN CENTRAL VIEWSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Dynamic header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden transition"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell mock */}
            <div className="relative">
              <button className="p-2 text-slate-400 hover:text-indigo-600 transition touch-manipulation">
                <Bell className="w-5.5 h-5.5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Candidate Pro
                </p>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=4f46e5&color=fff`}
                alt="Profile Avatar"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Central scrolling layout view */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-8">
          
          {/* System alerts / messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircleIcon className="h-5 w-5 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage("")} className="text-rose-400 hover:text-rose-600 p-1">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage("")} className="text-emerald-400 hover:text-emerald-600 p-1">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats overview cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processed Resumes</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalResumes}</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top ATS Score</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{highestScore}%</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Match Grade</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{averageScore}%</h3>
              </div>
            </div>
          </div>

          {/* Combined Grid columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 content-start">
            
            {/* Left Hand Column: upload block and metrics history */}
            <div className="space-y-6 lg:col-span-4 flex flex-col">
              
              {/* Upload console */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900">Upload Resume</h3>
                </div>
                <p className="text-xs text-slate-400 mb-5">
                  Optimize format layout gaps using Gemini context engines
                </p>

                {/* Upload click/drag PDF zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-50/50"
                      : targetFile
                      ? "border-emerald-500 bg-emerald-50/10"
                      : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {targetFile ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 max-w-xs truncate">{targetFile.name}</p>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">Ready for analysis ({(targetFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">Click or drag PDF</p>
                      <p className="text-xs text-slate-400">Max file size: 10MB</p>
                    </>
                  )}
                </div>

                {/* Optional target description pasting */}
                <div className="mt-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Target Job Description (Optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste your target job listing here to check for missing keywords and custom skills match ratio..."
                    rows={4}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  />
                </div>

                <button
                  id="submit-analysis-btn"
                  onClick={handleUploadSubmit}
                  disabled={isUploading || !targetFile}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none transition duration-150"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      <span>Analyzing resume...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Start Analysis Scan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Recent scans history list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-905 text-slate-900">Recent Scans</h3>
                  <span className="text-xs font-semibold text-slate-400">{resumes.length} total</span>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl bg-slate-50/50 border border-slate-100 px-4">
                    <FileText className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">No scans yet</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Upload standard PDF resumes to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {resumes.map((resume) => {
                      const isSelected = selectedResume && selectedResume.id === resume.id;
                      const scoreBadgeColor = resume.ATSScore >= 80 ? "text-emerald-600 bg-emerald-50 font-bold" : resume.ATSScore >= 55 ? "text-amber-500 bg-amber-50 font-bold" : "text-rose-500 bg-rose-50 font-bold";
                      return (
                        <div
                          id={`resume-item-${resume.id}`}
                          key={resume.id}
                          onClick={() => handleViewDetails(resume)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/20"
                              : "border-slate-50 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs shrink-0 ${scoreBadgeColor}`}>
                              {resume.ATSScore}%
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate" title={resume.fileName}>{resume.fileName}</p>
                              <p className="text-[10px] text-slate-400">{new Date(resume.uploadDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <button
                            id={`delete-resume-${resume.id}`}
                            onClick={(e) => handleDeleteResume(resume.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition shrink-0"
                            title="Delete Analysis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recharts score graph */}
              {resumes.length > 1 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">ATS Match Trajectory</h3>
                  <p className="text-xs text-slate-400 mb-4">Chronological optimizer improvements</p>
                  <div className="h-44 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Score"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorScore)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>

            {/* Right Hand Column: Detailed Selected Analysis Reports */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col space-y-6">
              <AnimatePresence mode="wait">
                {selectedResume ? (
                  <motion.div
                    key={selectedResume.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    
                    {/* Selected details header with dynamic circular progress gauge */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-6 gap-6">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div>
                          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider block w-fit">
                            Active Analysis
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 truncate" title={selectedResume.fileName}>
                            {selectedResume.fileName}
                          </h2>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm font-semibold truncate leading-relaxed">
                          Target Listing: {selectedResume.analysisReport?.summary ? (selectedResume.jobDescription ? selectedResume.jobDescription.substring(0, 50) + "..." : "General Industry Benchmarks") : "Parsing metadata..."}
                        </p>
                      </div>

                      {/* Dynamic circular SVG Match Score ring */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="11" fill="transparent" />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke={selectedResume.ATSScore >= 80 ? "#10b981" : selectedResume.ATSScore >= 55 ? "#f59e0b" : "#f43f5e"}
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray="301.59"
                            strokeDashoffset={301.59 - (selectedResume.ATSScore / 100) * 301.59}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                            {selectedResume.ATSScore}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            ATS Score
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Executive Summary Block */}
                    <div className="rounded-xl bg-indigo-50/15 border border-indigo-100/50 p-4 sm:p-5">
                      <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2 mb-2 uppercase tracking-wider">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                        Executive Parsing Summary
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {selectedResume.analysisReport?.summary || "Parsing resume segments..."}
                      </p>
                    </div>

                    {/* View switcher tabs */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => setActiveTab("analysis")}
                        className={`py-2 px-4 text-xs font-bold border-b-2 transition duration-150 ${
                          activeTab === "analysis"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        ATS Report breakdowns
                      </button>
                      <button
                        onClick={() => setActiveTab("text")}
                        className={`py-2 px-4 text-xs font-bold border-b-2 transition duration-150 ${
                          activeTab === "text"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Extracted raw PDF text
                      </button>
                    </div>

                    {activeTab === "analysis" ? (
                      <div className="space-y-6">
                        
                        {/* Missing Keywords Section */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Missing Industry Keywords
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Integrating these high frequency search matchers may automatically bypass initial parsing filters:
                          </p>
                          {selectedResume.analysisReport?.missingKeywords?.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectedResume.analysisReport.missingKeywords.map((word, i) => (
                                <span
                                  key={i}
                                  className="rounded-full px-3 py-1 text-xs font-semibold font-mono border border-amber-200 bg-amber-50 text-amber-700"
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit p-2 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Core matchers are fully optimized! Beautiful alignment.
                            </p>
                          )}
                        </div>

                        {/* Missing Soft/Hard Skills Section */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <BookOpen className="h-4 w-4 text-indigo-500" />
                            Core Capabilities & Skill Gaps
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Key operational elements absent from current file comparisons:
                          </p>
                          {selectedResume.analysisReport?.missingSkills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectedResume.analysisReport.missingSkills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="rounded-full px-3 py-1 text-xs font-semibold border border-indigo-100 bg-indigo-50/70 text-indigo-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit p-2 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Key competency matching is complete. Perfect!
                            </p>
                          )}
                        </div>

                        {/* Strengths and Weaknesses segment grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-5">
                          {/* Strengths list */}
                          <div className="space-y-3.5">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1">
                              Strengths
                            </h4>
                            <ul className="space-y-3">
                              {selectedResume.analysisReport?.strengths?.map((str, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                                  <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 rounded bg-emerald-50 border border-emerald-100 p-0.5" />
                                  <span>{str}</span>
                                </li>
                              )) || (
                                <li className="text-slate-400 italic text-xs">No analysis metrics compiled.</li>
                              )}
                            </ul>
                          </div>

                          {/* Weaknesses list */}
                          <div className="space-y-3.5">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1">
                              Critical Gaps
                            </h4>
                            <ul className="space-y-3">
                              {selectedResume.analysisReport?.weaknesses?.map((w, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 rounded bg-rose-50 border border-rose-100 p-0.5" />
                                  <span>{w}</span>
                                </li>
                              )) || (
                                <li className="text-slate-400 italic text-xs">No formatting anomalies catalogued.</li>
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Formatting Suggestions layout suggestions */}
                        <div className="space-y-3 border-t border-slate-100 pt-5">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                            Formatting & Layout Suggestions
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {selectedResume.analysisReport?.formattingSuggestions?.map((sug, i) => (
                              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-50 bg-slate-50/50 p-3 text-xs text-slate-600 font-medium">
                                <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="truncate" title={sug}>{sug}</span>
                              </div>
                            )) || <p className="text-slate-400 italic text-xs p-1">Format scoring achieved high ranks.</p>}
                          </div>
                        </div>

                        {/* Action details group buttons */}
                        <div className="mt-4 border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex gap-2 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">+ Quantifiable Impact</span>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">+ Active Action Verbs</span>
                            {selectedResume.ATSScore < 85 && (
                              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">! Needs Structural Polish</span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              const outputText = `REPORT METRICS ANALYSIS:\n${selectedResume.fileName}\nScore: ${selectedResume.ATSScore}%\n\nSummary:\n${selectedResume.analysisReport?.summary}\n\nKeywords Missing:\n${selectedResume.analysisReport?.missingKeywords?.join(", ") || "None"}\n\nStrengths:\n- ${selectedResume.analysisReport?.strengths?.join("\n- ") || "None"}\n\nWeaknesses:\n- ${selectedResume.analysisReport?.weaknesses?.join("\n- ") || "None"}`;
                              navigator.clipboard.writeText(outputText);
                              setSuccessMessage("Copying analysis summary details directly to clipboard!");
                            }}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition active:scale-[0.98]"
                          >
                            Download Summary Report
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>

                      </div>
                    ) : (
                      /* Text output parsed reader container */
                      <div className="space-y-3.5">
                        <p className="text-[11px] text-slate-400">
                          Extracted readable textual segment sequences parsed from PDF binary structure. Verify that character alignments represent consistent patterns:
                        </p>
                        <div className="w-full max-h-96 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[10.5px] text-slate-600 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                          {selectedResume.extractedText || "No text patterns resolved inside PDF sequence tags."}
                        </div>
                      </div>
                    )}

                  </motion.div>
                ) : (
                  /* Standard initial empty placeholder layout banner */
                  <div className="flex flex-col items-center justify-center p-12 sm:p-20 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50/50 text-indigo-500 mb-4 animate-pulse">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No active scan selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Upload your resume PDF in the left column console to instantly process ATS keywords, or select an existing history item to review.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

      {/* 5. GORGEOUS PREMIUM UPGRADE DIALOGUE */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Developer License Authorized</h3>
                <p className="mt-2 text-xs text-indigo-600 font-semibold tracking-wide uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
                  Unlimited Live scan active
                </p>
                <p className="mt-3.5 text-xs text-slate-500 leading-relaxed max-w-xs">
                  Your Vantage ATS Developer privileges are fully active! Enjoy unlimited 10MB PDF resume scans, ultra-fast Gemini 3.5 evaluations, and automated target-desc optimization.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-slate-800 transition"
                >
                  Dismiss Dialog
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Minimal inline icons to support pure fallback
function AlertCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
