
import React, { useState, useEffect } from 'react';
import { CameraView } from '../components/CameraView';
import { mockDb } from '../services/mockFirebase';
import { Complaint, ComplaintCategory, FeedbackType, VolunteerEvent } from '../types';
import { CATEGORIES, STATUS_COLORS } from '../constants';
import { getCurrentPosition, calculateDistance, checkPriority } from '../services/locationHelper';

export const CitizenDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>('garbage');
  const [description, setDescription] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [cachedLocation, setCachedLocation] = useState<{lat: number, lng: number} | null>(null);

  const currentUser = mockDb.getCurrentUser();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allC = mockDb.getComplaints();
    const allE = mockDb.getEvents();
    setComplaints(allC.filter(c => c.userId === currentUser?.uid).sort((a, b) => b.createdAt - a.createdAt));
    setEvents(allE);
  };

  const handleNewReport = async () => {
    if (loading) return;
    setLoading(true);
    setDuplicateWarning(null);
    try {
      // Step 1: Get location first to check for duplicates and set context
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCachedLocation({ lat, lng });

      // Step 2: Duplicate Check (100m)
      const allComplaints = mockDb.getComplaints();
      const duplicate = allComplaints.find(c => 
        c.status !== 'done' && 
        c.category === category && 
        calculateDistance(lat, lng, c.latitude, c.longitude) < 100
      );

      if (duplicate) {
        setDuplicateWarning(`A similar issue was reported nearby recently. We are already looking into it! (Ref: ${duplicate.id})`);
        setLoading(false);
        return;
      }

      // Step 3: Open camera if everything is fine
      setShowCamera(true);
    } catch (err) {
      console.error("Location error:", err);
      alert('Location is required to file a report. Please enable GPS and grant permission.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (image: string) => {
    if (!currentUser || !cachedLocation) {
        alert("Session or location data missing. Please try again.");
        return;
    }
    
    setLoading(true);
    try {
      const newComplaint: Complaint = {
        id: `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        userId: currentUser.uid,
        userName: currentUser.name,
        category,
        description,
        beforeImage: image,
        afterImage: null,
        latitude: cachedLocation.lat,
        longitude: cachedLocation.lng,
        status: 'submitted',
        priority: checkPriority(cachedLocation.lat, cachedLocation.lng) ? 'high' : 'normal',
        assignedSweeperId: null,
        assignedSweeperName: null,
        feedback: null,
        createdAt: Date.now(),
      };

      const all = mockDb.getComplaints();
      mockDb.setComplaints([...all, newComplaint]);
      
      setShowCamera(false);
      setDescription('');
      setCachedLocation(null);
      refreshData();
      alert("Complain submitted successfully!");
    } catch (err) {
      console.error("Submission error:", err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (complaintId: string, rating: FeedbackType) => {
    const all = mockDb.getComplaints();
    const updated = all.map(c => c.id === complaintId ? { ...c, feedback: rating } : c);
    mockDb.setComplaints(updated);
    refreshData();
  };

  const toggleJoinEvent = (eventId: string) => {
    const all = mockDb.getEvents();
    const updated = all.map(e => {
      if (e.id === eventId) {
        const joined = e.participants.includes(currentUser!.uid);
        return {
          ...e,
          participants: joined 
            ? e.participants.filter(id => id !== currentUser!.uid)
            : [...e.participants, currentUser!.uid]
        };
      }
      return e;
    });
    mockDb.setEvents(updated);
    refreshData();
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Report Section */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Report an Issue</h2>
            <p className="text-gray-500 text-sm">Snap a photo and we'll handle the rest.</p>
          </div>
          <button 
            onClick={handleNewReport}
            disabled={loading}
            className="bg-[#1A73E8] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Locating...' : '📸 New Report'}
          </button>
        </div>

        {duplicateWarning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">{duplicateWarning}</p>
              <button onClick={() => setDuplicateWarning(null)} className="text-xs font-bold text-yellow-600 mt-1 uppercase">Dismiss</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value as ComplaintCategory)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                category === cat.value ? 'border-[#1A73E8] bg-blue-50 text-[#1A73E8]' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description (optional)..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] outline-none h-24 resize-none"
          />
        </div>
      </section>

      {/* Events Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-gray-900">Clean-up Drives</h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Community</span>
        </div>
        {events.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-2xl text-center text-gray-400 text-sm">No upcoming clean-up drives at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => {
              const isJoined = event.participants.includes(currentUser!.uid);
              return (
                <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Volunteer</span>
                      <span className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-xs font-medium text-gray-400">{event.participants.length} joined</span>
                    <button 
                      onClick={() => toggleJoinEvent(event.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isJoined 
                          ? 'bg-green-50 text-[#34A853] hover:bg-green-100' 
                          : 'bg-[#1A73E8] text-white hover:shadow-md'
                      }`}
                    >
                      {isJoined ? '✓ Joined' : 'Join Event'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Complaints Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 px-1">My Tracked Issues</h3>
        {complaints.length === 0 ? (
          <div className="text-center py-20 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No reports yet. Be the first to clean your area!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map(c => (
              <div key={c.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="relative aspect-video">
                  <img src={c.beforeImage} className="w-full h-full object-cover" alt="Issue" />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </div>
                  {c.priority === 'high' && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase">
                      Priority
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-gray-900">{CATEGORIES.find(cat => cat.value === c.category)?.label}</h4>
                    <span className="text-xs text-gray-400 font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{c.description || 'No description provided.'}</p>
                  
                  {c.status === 'done' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Resolution Proof</p>
                      <img src={c.afterImage!} className="w-full h-32 object-cover rounded-xl mb-4" alt="Resolved" />
                      
                      {!c.feedback ? (
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">Rate Service:</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleFeedback(c.id, 'poor')} className="text-xl grayscale hover:grayscale-0">😞</button>
                            <button onClick={() => handleFeedback(c.id, 'avg')} className="text-xl grayscale hover:grayscale-0">😐</button>
                            <button onClick={() => handleFeedback(c.id, 'good')} className="text-xl grayscale hover:grayscale-0">😊</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 p-2 rounded-lg text-green-700 text-sm font-medium flex items-center gap-2">
                          <span>Feedback provided: {c.feedback === 'good' ? '😊 Good' : c.feedback === 'avg' ? '😐 Average' : '😞 Poor'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {c.status === 'review' && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                      ✨ Sweeper <b>{c.assignedSweeperName}</b> is currently resolving this issue.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showCamera && (
        <CameraView 
          onCapture={submitReport} 
          onCancel={() => {
            setShowCamera(false);
            setCachedLocation(null);
          }} 
        />
      )}
    </div>
  );
};
