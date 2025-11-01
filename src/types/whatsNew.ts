export interface ReleaseNote {
  version: string;
  date?: string;
  changes: ChangeItem[];
}

export interface ChangeItem {
  title: string;
  description: string;
  prNumber?: number;
  prUrl?: string;
  category?: 'feature' | 'improvement' | 'fix' | 'visual' | 'analytics';
}
