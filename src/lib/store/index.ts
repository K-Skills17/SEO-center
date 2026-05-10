import { create } from 'zustand';

interface AppStore {
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  dateRange: '7d' | '28d' | '90d';
  setDateRange: (range: '7d' | '28d' | '90d') => void;
  issueFilters: {
    severity: string | null;
    category: string | null;
    status: string;
  };
  setIssueFilters: (filters: Partial<AppStore['issueFilters']>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedSiteId: null,
  setSelectedSiteId: (id) => set({ selectedSiteId: id }),
  dateRange: '28d',
  setDateRange: (range) => set({ dateRange: range }),
  issueFilters: {
    severity: null,
    category: null,
    status: 'open',
  },
  setIssueFilters: (filters) =>
    set((state) => ({
      issueFilters: { ...state.issueFilters, ...filters },
    })),
}));
