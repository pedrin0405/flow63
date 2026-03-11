"use client";

import { useState } from "react";
import BioEditor from "@/components/central63/bio-editor";
import { Sidebar } from "@/components/central63/sidebar";

export default function NewBioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bio-admin");

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab: string) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <BioEditor />
      </main>
    </div>
  );
}
