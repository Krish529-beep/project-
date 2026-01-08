
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, 
  uploadString, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { db, storage } from "../lib/firebase.js";
import { User, Complaint, VolunteerEvent, Role, ComplaintStatus, FeedbackType } from "../types.js";

export const firebaseService = {
  // --- USER PROFILE ---
  async saveUser(user: User) {
    await setDoc(doc(db, "users", user.uid), {
      ...user,
      createdAt: Timestamp.now()
    });
  },

  async getUser(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as User) : null;
  },

  async getAllSweepers(): Promise<User[]> {
    const q = query(collection(db, "users"), where("role", "==", "sweeper"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  },

  // --- IMAGES ---
  async uploadImage(base64Data: string, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    // uploadString handles data_url format
    await uploadString(storageRef, base64Data, 'data_url');
    return await getDownloadURL(storageRef);
  },

  // --- COMPLAINTS ---
  // Fix: status is omitted from the data type because it is initialized to 'submitted' internally.
  // This resolves the 'status is missing' error at call sites.
  async createComplaint(data: Omit<Complaint, 'id' | 'createdAt' | 'status'>) {
    const docRef = await addDoc(collection(db, "complaints"), {
      ...data,
      createdAt: Timestamp.now(),
      status: 'submitted'
    });
    return docRef.id;
  },

  async updateComplaint(id: string, updates: Partial<Complaint>) {
    const docRef = doc(db, "complaints", id);
    await updateDoc(docRef, updates);
  },

  // Real-time listener for complaints
  subscribeToComplaints(callback: (complaints: Complaint[]) => void, filters?: { userId?: string, assignedSweeperId?: string }) {
    let q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    
    if (filters?.userId) {
      q = query(collection(db, "complaints"), where("userId", "==", filters.userId), orderBy("createdAt", "desc"));
    } else if (filters?.assignedSweeperId) {
      q = query(collection(db, "complaints"), where("assignedSweeperId", "==", filters.assignedSweeperId), orderBy("createdAt", "desc"));
    }

    return onSnapshot(q, (snap) => {
      const complaints = snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint));
      callback(complaints);
    });
  },

  // --- EVENTS ---
  async createEvent(event: Omit<VolunteerEvent, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, "volunteer_events"), {
      ...event,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  subscribeToEvents(callback: (events: VolunteerEvent[]) => void) {
    const q = query(collection(db, "volunteer_events"), orderBy("date", "asc"));
    return onSnapshot(q, (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerEvent));
      callback(events);
    });
  },

  async toggleEventJoin(eventId: string, userId: string, isJoining: boolean) {
    const docRef = doc(db, "volunteer_events", eventId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    
    const participants = snap.data().participants || [];
    const updated = isJoining 
      ? [...new Set([...participants, userId])]
      : participants.filter((id: string) => id !== userId);
      
    await updateDoc(docRef, { participants: updated });
  }
};
