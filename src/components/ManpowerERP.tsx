import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManpowerERP() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 leading-none">Manpower Management ERP</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Enterprise Workforce & Payroll System</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {['dashboard', 'projects', 'workers', 'monthly-hours', 'payments', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${
                  activeTab === tab 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Manpower ERP</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            This module is currently being built. Please ensure you have run the `erp_schema.sql` script in your Supabase SQL Editor to set up the necessary database tables.
          </p>
        </div>
      </main>
    </div>
  );
}
