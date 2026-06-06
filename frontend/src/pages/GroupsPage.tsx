import { useState } from 'react';
import { motion } from 'framer-motion';
import CostumePage from './CostumePage';
import KitchenGroupsPage from './KitchenGroupsPage';

const TABS = [
  { id: 'costumes', label: 'Disfraces' },
  { id: 'kitchen', label: 'Cocina' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('costumes');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Subtabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 border border-glass-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'costumes' && <CostumePage />}
      {activeTab === 'kitchen' && <KitchenGroupsPage />}
    </motion.div>
  );
}
