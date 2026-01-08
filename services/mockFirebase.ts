
import { User, Complaint, VolunteerEvent, Role } from '../types';

/**
 * DATABASE INTEGRATION GUIDE:
 * 
 * 1. FIREBASE AUTH:
 *    - Replace `getCurrentUser` with `auth.currentUser` or `onAuthStateChanged`.
 *    - Sign-in/Sign-up should use `signInWithEmailAndPassword` or `createUserWithEmailAndPassword`.
 * 
 * 2. FIRESTORE (Database):
 *    - Replace `localStorage` calls with `getDoc`, `getDocs`, `setDoc`, and `addDoc`.
 *    - Use Firestore Collections: 'users', 'complaints', and 'volunteer_events'.
 *    - Use `where` queries for role-based filtering and status tracking.
 * 
 * 3. FIREBASE STORAGE (Images):
 *    - Complaints images (before/after) should be uploaded to Storage.
 *    - Use `ref(storage, `complaints/${id}/before.jpg`)` and `uploadString(ref, data, 'data_url')`.
 *    - Store the resulting `downloadURL` in the Firestore document.
 */

// Storage Keys for local simulation
const USERS_KEY = 'swachhsnap_users';
const COMPLAINTS_KEY = 'swachhsnap_complaints';
const EVENTS_KEY = 'swachhsnap_events';
const CURRENT_USER_KEY = 'swachhsnap_current_user';

export const mockDb = {
  /**
   * FIRESTORE: collection(db, 'users')
   * Fetch user profiles. In real Firebase, you'd usually fetch by UID.
   */
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  setUsers: (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users)),
  
  /**
   * FIRESTORE: collection(db, 'complaints')
   * Queries:
   * - Admin: Fetch all sorted by createdAt
   * - Sweeper: query(collection, where('assignedSweeperId', '==', uid))
   * - Citizen: query(collection, where('userId', '==', uid))
   */
  getComplaints: (): Complaint[] => JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]'),
  setComplaints: (complaints: Complaint[]) => localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints)),
  
  /**
   * FIRESTORE: collection(db, 'volunteer_events')
   * Events for community cleanups.
   */
  getEvents: (): VolunteerEvent[] => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'),
  setEvents: (events: VolunteerEvent[]) => localStorage.setItem(EVENTS_KEY, JSON.stringify(events)),
  
  /**
   * FIREBASE AUTH: auth.onAuthStateChanged((user) => ...)
   * Tracks the currently logged in session.
   */
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(CURRENT_USER_KEY);
  }
};

/**
 * SEED DATA: 
 * This block simulates the initial state of a database.
 * In production, you would manually add these via the Firebase Console.
 */
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
