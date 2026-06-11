interface WorkerFilterTabsProps {
 activeTab: string;
 onTabChange: (tab: string) => void;
}

export function WorkerFilterTabs({ activeTab, onTabChange }: WorkerFilterTabsProps) {
 const tabs = [
 { id: "all", label: "Todos" },
 { id: "available", label: "Disponibles" },
 { id: "assigned", label: "Ocupados" },
 ];

 return (
 <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => onTabChange(tab.id)}
 className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
 activeTab === tab.id
 ? "bg-secondary text-white shadow-sm"
 : "bg-muted text-muted-foreground hover:bg-slate-200"
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 );
}
