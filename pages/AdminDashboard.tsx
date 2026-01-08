
import React, { useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { Complaint, User, VolunteerEvent } from '../types';
import { CATEGORIES, STATUS_COLORS } from '../constants';
import { getCurrentPosition } from '../services/locationHelper';

// Fix: Declare google globally to resolve "Cannot find name 'google'" errors when the library is loaded via script tag
declare var google: any;

export const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [sweepers, setSweepers] = useState<User[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const mapRef = useRef<HTMLDivElement>(null);
  // Fix: Use 'any' type for google.maps.Map as the namespace 'google' is not found by the compiler
  const googleMap = useRef<any>(null);
  // Fix: Use 'any' type for google.maps.Marker array as the namespace 'google' is not found by the compiler
  const markers = useRef<any[]>([]);

  // Event Form State
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    // Real-time complaints subscription
    const unsubscribe = firebaseService.subscribeToComplaints((allC) => {
      // Priority sorting: High priority first, then date
      const sorted = [...allC].sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return b.createdAt - a.createdAt;
      });

      setComplaints(sorted);
      setStats({
        total: allC.length,
        pending: allC.filter(c => c.status !== 'done').length,
        completed: allC.filter(c => c.status === 'done').length
      });
    });

    // Fetch sweepers once
    const fetchSweepers = async () => {
      const allS = await firebaseService.getAllSweepers();
      setSweepers(allS);
    };

    fetchSweepers();
    return () => unsubscribe();
  }, []);

  // Initialize and update Google Maps
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && typeof google !== 'undefined') {
      if (!googleMap.current) {
        googleMap.current = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India or dynamic
          zoom: 5,
          styles: [
            {
              "featureType": "poi",
              "elementType": "labels",
              "stylers": [{ "visibility": "off" }]
            }
          ]
        });
      }

      // Clear existing markers
      markers.current.forEach((m: any) => m.setMap(null));
      markers.current = [];

      // Add markers for complaints
      const bounds = new google.maps.LatLngBounds();
      complaints.forEach(c => {
        const markerColor = c.status === 'done' ? '#34A853' : (c.priority === 'high' ? '#EA4335' : '#1A73E8');
        const marker = new google.maps.Marker({
          position: { lat: c.latitude, lng: c.longitude },
          map: googleMap.current,
          title: c.category,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 10,
          }
        });

        const infoWindow = new google.maps.InfoWindow();
        const content = document.createElement('div');
        content.className = 'p-4 flex flex-col gap-2 min-w-[200px]';
        content.innerHTML = `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">${CATEGORIES.find(cat => cat.value === c.category)?.icon || '📍'}</span>
            <h4 class="font-bold text-gray-900">${CATEGORIES.find(cat => cat.value === c.category)?.label}</h4>
          </div>
          <p class="text-xs text-gray-500">${c.description || 'No description'}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${c.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${c.status}</span>
            <span class="text-[9px] text-gray-400 font-medium">${new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
          <button id="view-details-${c.id}" class="mt-3 w-full bg-[#1A73E8] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
            View Full Case
          </button>
        `;

        marker.addListener('click', () => {
          infoWindow.setContent(content);
          infoWindow.open(googleMap.current, marker);
          
          // Use setTimeout to ensure the element is in the DOM before adding listener
          setTimeout(() => {
            const btn = document.getElementById(`view-details-${c.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                setSelectedComplaint(c);
                infoWindow.close();
              });
            }
          }, 0);
        });

        markers.current.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      if (complaints.length > 0) {
        googleMap.current.fitBounds(bounds);
        // Don't zoom in too far if only one marker
        if (complaints.length === 1) {
          googleMap.current.setZoom(15);
        }
      }
    }
  }, [viewMode, complaints]);

  const assignTask = async (complaintId: string, sweeperId: string) => {
    const sweeper = sweepers.find(s => s.uid === sweeperId);
    if (!sweeper) return;

    await firebaseService.updateComplaint(complaintId, { 
      status: 'review', 
      assignedSweeperId: sweeperId, 
      assignedSweeperName: sweeper.name 
    });
  };

  const approveResolution = async (complaintId: string) => {
    await firebaseService.updateComplaint(complaintId, { status: 'done' });
    setSelectedComplaint(null);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;
    
    setIsCreatingEvent(true);
    try {
      const pos = await getCurrentPosition();
      await firebaseService.createEvent({
        title: eventTitle,
        date: new Date(eventDate).getTime(),
        description: eventDesc,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        participants: []
      });
      
      setEventTitle('');
      setEventDate('');
      setEventDesc('');
      setShowEventForm(false);
      alert("Clean-up event hosted successfully!");
    } catch (err) {
      alert("Failed to get location for the event. Please ensure GPS is active.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Admin Console</h2>
        <div className="flex gap-3">
           <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className={`px-6 py-3 rounded-xl font-bold transition-all border ${viewMode === 'map' ? 'bg-[#1A73E8] text-white border-[#1A73E8]' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            {viewMode === 'list' ? '🗺️ Switch to Map' : '📋 Switch to List'}
          </button>
          <button 
            onClick={() => setShowEventForm(true)}
            className="bg-[#34A853] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <span>📅</span> Host Drive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Total Reports</p>
          <h3 className="text-4xl font-black text-[#1A73E8]">{stats.total}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Pending Action</p>
          <h3 className="text-4xl font-black text-[#FBBC05]">{stats.pending}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Cleaned Up</p>
          <h3 className="text-4xl font-black text-[#34A853]">{stats.completed}</h3>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[600px] relative">
          <div ref={mapRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-md border border-gray-100 text-[10px] space-y-1">
            <div className="flex items-center gap-2 font-bold"><div className="w-2 h-2 rounded-full bg-[#EA4335]"></div> High Priority</div>
            <div className="flex items-center gap-2 font-bold"><div className="w-2 h-2 rounded-full bg-[#1A73E8]"></div> Normal Case</div>
            <div className="flex items-center gap-2 font-bold"><div className="w-2 h-2 rounded-full bg-[#34A853]"></div> Resolved</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold">Complaints Queue</h3>
            <div className="flex gap-2">
              <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase">High Priority First</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Evidence</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Reporter</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Assignee</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No complaints reported yet.</td>
                  </tr>
                ) : complaints.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedComplaint(c)}
                      >
                        <img src={c.beforeImage} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold">{c.userName}</div>
                      <div className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{CATEGORIES.find(cat => cat.value === c.category)?.label}</span>
                        <span className={`w-max mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${c.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.assignedSweeperName || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setSelectedComplaint(c)}
                        className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded hover:bg-gray-200 transition-colors"
                      >
                        👁️ View
                      </button>
                      {c.status === 'submitted' && (
                        <select 
                          onChange={(e) => assignTask(c.id, e.target.value)}
                          className="text-xs bg-blue-50 text-[#1A73E8] border-none font-bold rounded p-2 outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Sweeper</option>
                          {sweepers.map(s => <option key={s.uid} value={s.uid}>{s.name}</option>)}
                        </select>
                      )}
                      {c.status === 'review' && c.afterImage && (
                        <button 
                          onClick={() => approveResolution(c.id)}
                          className="bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded hover:bg-green-200 transition-colors"
                        >
                          ✅ Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Hosting Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Host Clean-up Event</h3>
              <button onClick={() => setShowEventForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Event Title</label>
                <input 
                  required
                  type="text" 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Riverside Cleaning Drive"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#34A853]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date & Time</label>
                <input 
                  required
                  type="datetime-local" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#34A853]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea 
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Details for volunteers..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#34A853] h-24 resize-none"
                />
              </div>
              <p className="text-[10px] text-gray-400">* Event location will be set to your current GPS position.</p>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingEvent}
                  className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreatingEvent ? 'Setting up...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900">Case Details</h4>
                <p className="text-sm text-gray-500">{CATEGORIES.find(cat => cat.value === selectedComplaint.category)?.label} • {selectedComplaint.priority} priority</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-gray-400 uppercase">Citizen's Report (Before)</span>
                    <span className="text-[10px] text-gray-400">{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 mb-4">
                    <img src={selectedComplaint.beforeImage} className="w-full h-full object-cover" alt="Before" />
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                    "{selectedComplaint.description || 'No description provided by citizen.'}"
                  </p>
                  
                  {/* Location Preview Link */}
                  <div className="mt-4">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1A73E8] font-bold flex items-center gap-1 hover:underline"
                    >
                      📍 View Location on Google Maps
                    </a>
                  </div>
                </div>

                {/* After Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-[#34A853] uppercase">Resolution Proof (After)</span>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                    {selectedComplaint.afterImage ? (
                      <img src={selectedComplaint.afterImage} className="w-full h-full object-cover" alt="After" />
                    ) : (
                      <div className="text-center p-6 text-gray-400">
                        <span className="text-3xl block mb-2">⏳</span>
                        <p className="text-xs font-medium uppercase">Awaiting sweeper upload</p>
                      </div>
                    )}
                  </div>
                  {selectedComplaint.assignedSweeperName && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {selectedComplaint.assignedSweeperName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900">{selectedComplaint.assignedSweeperName}</p>
                        <p className="text-[10px] text-blue-600 uppercase font-bold">Field Officer Assigned</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors"
              >
                Close View
              </button>
              {selectedComplaint.status === 'review' && selectedComplaint.afterImage && (
                <button 
                  onClick={() => approveResolution(selectedComplaint.id)}
                  className="px-8 py-2 bg-[#34A853] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-95"
                >
                  Confirm Cleanup & Close Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
