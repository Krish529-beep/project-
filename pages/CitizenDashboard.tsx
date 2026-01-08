
import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { CameraView } from '../components/CameraView';
import { Complaint, ComplaintCategory, FeedbackType, VolunteerEvent } from '../types';
import { CATEGORIES, STATUS_COLORS } from '../constants';
import { getCurrentPosition, checkPriority } from '../services/locationHelper';

export const CitizenDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>('garbage');
  const [description, setDescription] = useState('');
  const [cachedLocation, setCachedLocation] = useState<{lat: number, lng: number} | null>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to complaints
    const unsubComplaints = firebaseService.subscribeToComplaints(setComplaints, { userId: currentUser.uid });
    // Subscribe to events
    const unsubEvents = firebaseService.subscribeToEvents(setEvents);

    return () => {
      unsubComplaints();
      unsubEvents();
    };
  }, [currentUser]);

  const handleNewReport = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      setCachedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setShowCamera(true);
    } catch (err) {
      alert('Location is required. Please enable GPS.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (image: string) => {
    if (!currentUser || !cachedLocation) return;
    
    setLoading(true);
    try {
      const complaintId = `CMP-${Date.now()}`;
      // 1. Upload Image to Storage
      const imageUrl = await firebaseService.uploadImage(image, `complaints/${complaintId}/before.jpg`);

      // 2. Save to Firestore
      await firebaseService.createComplaint({
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Citizen',
        category,
        description,
        beforeImage: imageUrl,
        afterImage: null,
        latitude: cachedLocation.lat,
        longitude: cachedLocation.lng,
        priority: checkPriority(cachedLocation.lat, cachedLocation.lng) ? 'high' : 'normal',
        assignedSweeperId: null,
        assignedSweeperName: null,
        feedback: null
      });
      
      setShowCamera(false);
      setDescription('');
      alert("Complain submitted successfully!");
    } catch (err) {
      console.error(err);
      alert('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (complaintId: string, rating: FeedbackType) => {
    await firebaseService.updateComplaint(complaintId, { feedback: rating });
  };

  const toggleJoinEvent = async (eventId: string, isJoining: boolean) => {
    if (!currentUser) return;
    await firebaseService.toggleEventJoin(eventId, currentUser.uid, isJoining);
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Report an Issue</h2>
          <button onClick={handleNewReport} disabled={loading} className="bg-[#1A73E8] text-white px-6 py-3 rounded-xl font-bold">
            {loading ? 'Locating...' : '📸 New Report'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value as ComplaintCategory)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${category === cat.value ? 'border-[#1A73E8] bg-blue-50 text-[#1A73E8]' : 'border-gray-100'}`}>
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold uppercase">{cat.label}</span>
            </button>
          ))}
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add description..." className="w-full mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl h-24" />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold">Clean-up Drives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => {
            const isJoined = event.participants?.includes(currentUser?.uid || '');
            return (
              <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold">{event.title}</h4>
                  <p className="text-sm text-gray-500 mb-4">{event.description}</p>
                </div>
                <button onClick={() => toggleJoinEvent(event.id, !isJoined)} className={`px-4 py-2 rounded-lg text-xs font-bold ${isJoined ? 'bg-green-50 text-green-700' : 'bg-[#1A73E8] text-white'}`}>
                  {isJoined ? '✓ Joined' : 'Join Event'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold">My Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map(c => (
            <div key={c.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="aspect-video relative"><img src={c.beforeImage} className="w-full h-full object-cover" /><div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[c.status]}`}>{c.status}</div></div>
              <div className="p-5">
                <h4 className="font-bold">{CATEGORIES.find(cat => cat.value === c.category)?.label}</h4>
                {c.status === 'done' && (
                  <div className="mt-4 pt-4 border-t">
                    <img src={c.afterImage!} className="w-full h-32 object-cover rounded-xl mb-4" />
                    {!c.feedback ? (
                      <div className="flex gap-2">Rate: <button onClick={() => handleFeedback(c.id, 'good')}>😊</button><button onClick={() => handleFeedback(c.id, 'avg')}>😐</button><button onClick={() => handleFeedback(c.id, 'poor')}>😞</button></div>
                    ) : <span className="text-green-600 text-sm">Feedback submitted!</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {showCamera && <CameraView onCapture={submitReport} onCancel={() => setShowCamera(false)} />}
    </div>
  );
};
