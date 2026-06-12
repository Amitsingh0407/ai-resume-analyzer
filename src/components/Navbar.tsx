import { useAuth } from "../context/AuthContext";
import { LogOut, FileText, Cpu, Database } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Alignment */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
            <Cpu className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              AI Resume Analyzer
            </h1>
            <p className="text-[10px] font-medium text-slate-400">
              ATS Keyword Optimization
            </p>
          </div>
        </div>

        {/* User Session Metadata & Actions */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Database indicator badge */}
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 md:flex">
              <Database className="h-3 w-3 text-indigo-500" />
              <span>{(user as any).dbMode || "Active Mode"}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-sm font-semibold text-slate-800">
                  {user.name}
                </span>
                <span className="text-xs text-slate-400">
                  {user.email}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              id="logout-btn"
              onClick={logout}
              className="group flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
