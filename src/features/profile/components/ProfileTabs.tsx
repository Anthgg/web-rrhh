"use client";

import type { ReactNode } from "react";

export type ProfileTabType = "overview" | "personal" | "labor" | "security" | "preferences" | "activity";

export interface TabItem {
 id: ProfileTabType;
 label: string;
 icon?: ReactNode;
}

interface ProfileTabsProps {
 tabs: TabItem[];
 activeTab: ProfileTabType;
 onChangeTab: (tabId: ProfileTabType) => void;
}

export function ProfileTabs({ tabs, activeTab, onChangeTab }: ProfileTabsProps) {
 return (
 <div
 className="flex flex-row items-end gap-0 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap w-full"
 role="tablist"
 aria-label="Secciones del perfil"
 >
 {tabs.map((tab) => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 type="button"
 role="tab"
 aria-selected={isActive}
 onClick={() => onChangeTab(tab.id)}
 className={[
 "relative flex items-center gap-2 px-4 lg:px-5 py-3.5 text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap select-none border-b-2",
 isActive
 ? "text-primary border-primary bg-transparent"
 : "text-muted-foreground border-transparent hover:text-foreground hover:border-border hover:bg-muted/60",
 ].join(" ")}
 >
 {tab.icon && (
 <span className={isActive ? "text-primary" : "text-muted-foreground"}>
 {tab.icon}
 </span>
 )}
 {tab.label}
 </button>
 );
 })}
 </div>
 );
}
