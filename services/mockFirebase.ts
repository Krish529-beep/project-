
import { User, Complaint, VolunteerEvent, Role } from '../types';

// Storage Keys
const USERS_KEY = 'swachhsnap_users';
const COMPLAINTS_KEY = 'swachhsnap_complaints';
const EVENTS_KEY = 'swachhsnap_events';
const CURRENT_USER_KEY = 'swachhsnap_current_user';

export const mockDb = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  setUsers: (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users)),
  
  getComplaints: (): Complaint[] => JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]'),
  setComplaints: (complaints: Complaint[]) => localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints)),
  
  getEvents: (): VolunteerEvent[] => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'),
  setEvents: (events: VolunteerEvent[]) => localStorage.setItem(EVENTS_KEY, JSON.stringify(events)),
  
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Initial Setup for Demo
if (mockDb.getUsers().length === 0) {
  const initialUsers: User[] = [
    { uid: 'admin-1', name: 'Munish Admin', email: 'admin@city.gov', role: 'admin', createdAt: Date.now() },
    { uid: 'sweeper-1', name: 'Rajesh Kumar', email: 'rajesh@clean.com', role: 'sweeper', createdAt: Date.now() },
    { uid: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'user', createdAt: Date.now() },
  ];
  mockDb.setUsers(initialUsers);

  // Seed Complaints
  const initialComplaints: Complaint[] = [
    {
      id: 'CMP-X72A1B',
      userId: 'user-1',
      userName: 'John Doe',
      category: 'garbage',
      description: 'Massive garbage pile near the main hospital entrance.',
      beforeImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
      afterImage: null,
      latitude: 12.9716, // Near Hospital (Priority)
      longitude: 77.5946,
      status: 'submitted',
      priority: 'high',
      assignedSweeperId: null,
      assignedSweeperName: null,
      feedback: null,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'CMP-Y91Z3C',
      userId: 'user-1',
      userName: 'John Doe',
      category: 'road',
      description: 'Deep pothole causing traffic jams.',
      beforeImage: 'https://images.unsplash.com/photo-1599427303058-f173bc113bc8?auto=format&fit=crop&q=80&w=800',
      afterImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800',
      latitude: 12.9352,
      longitude: 77.6245,
      status: 'done',
      priority: 'normal',
      assignedSweeperId: 'sweeper-1',
      assignedSweeperName: 'Rajesh Kumar',
      feedback: 'good',
      createdAt: Date.now() - 86400000,
    }
  ];
  mockDb.setComplaints(initialComplaints);

  // Seed Events
  const initialEvents: VolunteerEvent[] = [
    {
      id: 'EVT-001',
      title: 'Lakeside Cleanup Drive',
      date: Date.now() + 172800000,
      latitude: 12.9716,
      longitude: 77.5946,
      description: 'Join us this Sunday to clean up the Bellandur lake perimeter. Gloves provided.',
      participants: ['user-1'],
      createdAt: Date.now(),
    }
  ];
  mockDb.setEvents(initialEvents);
}
