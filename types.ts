
export type Role = 'user' | 'admin' | 'sweeper';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export type ComplaintStatus = 'submitted' | 'review' | 'done';
export type ComplaintCategory = 'road' | 'river' | 'garbage' | 'public';
export type FeedbackType = 'poor' | 'avg' | 'good' | null;

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  category: ComplaintCategory;
  beforeImage: string;
  afterImage: string | null;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  priority: 'normal' | 'high';
  assignedSweeperId: string | null;
  assignedSweeperName: string | null;
  feedback: FeedbackType;
  description: string;
  createdAt: number;
}

export interface VolunteerEvent {
  id: string;
  title: string;
  date: number;
  latitude: number;
  longitude: number;
  description: string;
  participants: string[]; // User UIDs
  createdAt: number;
}
