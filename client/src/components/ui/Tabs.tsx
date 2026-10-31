import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ defaultTab, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className }) => (
  <div
    role="tablist"
    className={cn(
      'flex items-center gap-1 p-1 bg-muted rounded-lg w-fit',
      className
    )}
  >
    {children}
  </div>
);

interface TabTriggerProps {
  id: string;
  children: React.ReactNode;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({ id, children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabTrigger must be inside Tabs');
  const isActive = ctx.activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={() => ctx.setActiveTab(id)}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
};

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children, className }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabPanel must be inside Tabs');
  if (ctx.activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  );
};
