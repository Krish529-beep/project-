
import React, { useState, useEffect } from 'react';
import { CameraView } from '../components/CameraView';
import { mockDb } from '../services/mockFirebase';
import { Complaint } from '../types';
import { CATEGORIES } from '../constants';

export const SweeperDashboard: React.FC = () => {
  const [assigned, setAssigned] = useState<Complaint[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const currentUser = mockDb.getCurrentUser();

  useEffect(() => {
    refreshTasks();
  }, []);

  const refreshTasks = () => {
    const all = mockDb.getComplaints();
    setAssigned(all.filter(c => c.assignedSweeperId === currentUser?.uid && c.status !== 'done'));
  };

  const handleComplete = (complaintId: string) => {
    setActiveComplaint(complaintId);
    setShowCamera(true);
  };

  const submitAfterPhoto = (image: string) => {
    if (!activeComplaint) return;
    
    const all = mockDb.getComplaints();
    const updated = all.map(c => 
      c.id === activeComplaint ? { ...c, afterImage: image } : c
    );
    mockDb.setComplaints(updated);
    
    setShowCamera(false);
    setActiveComplaint(null);
    refreshTasks();
    alert('Resolution proof uploaded. Admin will review it shortly.');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assigned Tasks</h2>
        <span className="bg-[#FBBC05] text-black px-3 py-1 rounded-full text-xs font-bold">
          {assigned.length} Tasks Pending
        </span>
      </div>

      {assigned.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100">
          <p className="text-gray-400 font-medium">You have no pending assignments. Great job!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {assigned.map(c => (
            <div key={c.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-48 md:h-auto">
                  <img src={c.beforeImage} className="w-full h-full object-cover" alt="Before" />
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-xl text-gray-900">
                        {CATEGORIES.find(cat => cat.value === c.category)?.label}
                      </h4>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${c.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{c.description || 'No notes from citizen.'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                      📍 <span>Lat: {c.latitude.toFixed(4)}, Lng: {c.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {c.afterImage ? (
                      <span className="text-[#34A853] font-bold text-sm">Waiting for Admin Approval...</span>
                    ) : (
                      <button 
                        onClick={() => handleComplete(c.id)}
                        className="w-full bg-[#34A853] text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-100 active:scale-95 transition-all"
                      >
                        📸 Upload After-Clean Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCamera && (
        <CameraView 
          onCapture={submitAfterPhoto} 
          onCancel={() => {
            setShowCamera(false);
            setActiveComplaint(null);
          }} 
        />
      )}
    </div>
  );
};
