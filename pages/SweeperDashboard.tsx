
import React, { useState, useEffect } from 'react';
import { CameraView } from '../components/CameraView';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../lib/firebase';
import { Complaint } from '../types';
import { CATEGORIES } from '../constants';

export const SweeperDashboard: React.FC = () => {
  const [assigned, setAssigned] = useState<Complaint[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    
    // Use real-time listener for assigned tasks
    const unsubscribe = firebaseService.subscribeToComplaints(
      (complaints) => {
        setAssigned(complaints.filter(c => c.status !== 'done'));
      }, 
      { assignedSweeperId: currentUser.uid }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleComplete = (complaintId: string) => {
    setActiveComplaint(complaintId);
    setShowCamera(true);
  };

  const submitAfterPhoto = async (image: string) => {
    if (!activeComplaint) return;
    
    setLoading(true);
    try {
      // 1. Upload proof image
      const imageUrl = await firebaseService.uploadImage(image, `complaints/${activeComplaint}/after.jpg`);

      // 2. Update complaint status to review (waiting for admin to approve)
      await firebaseService.updateComplaint(activeComplaint, { 
        afterImage: imageUrl,
        status: 'review'
      });
      
      setShowCamera(false);
      setActiveComplaint(null);
      alert('Resolution proof uploaded. Admin will review it shortly.');
    } catch (err) {
      console.error(err);
      alert('Failed to upload proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assigned Tasks</h2>
        <span className="bg-[#FBBC05] text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          {assigned.length} Tasks Pending
        </span>
      </div>

      {assigned.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-400 font-medium">You have no pending assignments. Great job!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {assigned.map(c => (
            <div key={c.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:border-blue-100 transition-colors">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-52 md:h-auto relative">
                  <img src={c.beforeImage} className="w-full h-full object-cover" alt="Before" />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded uppercase font-bold">Before Cleanup</div>
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-xl text-gray-900">
                        {CATEGORIES.find(cat => cat.value === c.category)?.label}
                      </h4>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${c.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                      "{c.description || 'No notes from citizen.'}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4 border-t border-gray-100">
                    {/* Location Link to Google Maps - Styled as a primary navigation button */}
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-50 text-[#1A73E8] py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all text-sm"
                      title="Open in Google Maps"
                    >
                      <span className="text-lg">📍</span>
                      Navigate
                    </a>

                    {c.status === 'review' ? (
                      <div className="flex-[1.5] text-center py-4 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-sm border border-yellow-100 flex items-center justify-center">
                        ⏳ Under Review
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleComplete(c.id)}
                        disabled={loading}
                        className="flex-[1.5] bg-[#34A853] text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>📷 Upload Proof</>
                        )}
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
