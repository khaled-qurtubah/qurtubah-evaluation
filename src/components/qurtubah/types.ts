export interface Evidence {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string;
  priority: string;
  comments: string | null;
  indicatorId: string;
  createdAt: string;
  updatedAt: string;
  indicator?: Indicator;
}

export interface Indicator {
  id: string;
  name: string;
  description: string | null;
  order: number;
  requiredEvidence: number;
  notes: string | null;
  standardId: string;
  evidences: Evidence[];
}

export interface Standard {
  id: string;
  name: string;
  description: string | null;
  order: number;
  fieldId: string;
  indicators: Indicator[];
}

export interface FieldWithDetails {
  id: string;
  name: string;
  description: string | null;
  order: number;
  icon: string | null;
  standards: Standard[];
  standardsCount: number;
  indicatorsCount: number;
  totalRequired: number;
  totalUploaded: number;
  completedIndicators: number;
  progress: number;
}

export interface ProgressData {
  totalFields: number;
  totalIndicators: number;
  completedIndicators: number;
  totalRequired: number;
  totalUploaded: number;
  progress: number;
  fields: {
    id: string;
    name: string;
    icon: string;
    totalIndicators: number;
    completedIndicators: number;
    totalRequired: number;
    totalUploaded: number;
    progress: number;
  }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AppNotification {
  id: string;
  type: 'milestone' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string | null;
  userName: string | null;
  createdAt: string;
}

export interface EvidenceComment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export type View = 'home' | 'field' | 'dashboard' | 'login';
