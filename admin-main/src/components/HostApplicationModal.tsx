import React, { useState } from 'react';

interface HostApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
  onRecordPayment: (user: any) => void;
}

export const HostApplicationModal: React.FC<HostApplicationModalProps> = ({
  isOpen,
  onClose,
  user,
  onApprove,
  onReject,
  onRecordPayment
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !user) return null;

  const application = user.hostApplication;

  const handleApprove = () => {
    onApprove(user.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(user.id, rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
    onClose();
  };

  const handleRecordPayment = () => {
    onRecordPayment(user);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">Host application review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          {/* Applicant Info */}
          <div className="mb-6">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Applicant information</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-1.5">
              <div><span className="font-bold text-gray-900">Name:</span> <span className="text-gray-600">{user.name || 'Not provided'}</span></div>
              <div><span className="font-bold text-gray-900">Email:</span> <span className="text-gray-600">{user.email}</span></div>
              <div><span className="font-bold text-gray-900">Applied:</span> <span className="text-gray-600">{application.appliedAt ? formatDate(application.appliedAt) : 'Unknown'}</span></div>
              <div><span className="font-bold text-gray-900">Current role:</span> <span className="text-gray-600">{user.role || 'attendee'}</span></div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Contact information</p>
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">Preferred contact method:</span>
                <span className="px-2.5 py-1 bg-primary-600 text-white rounded-md text-xs font-bold">
                  {application.contactMethod || 'Not specified'}
                </span>
              </div>
              {application.contactMethod === 'email' && application.contactEmail && (
                <div>
                  <span className="font-bold text-gray-900">Contact email:</span>{' '}
                  <a href={`mailto:${application.contactEmail}`} className="text-primary-700 font-semibold no-underline hover:underline">
                    {application.contactEmail}
                  </a>
                </div>
              )}
              {application.contactMethod === 'phone' && application.contactPhone && (
                <div>
                  <span className="font-bold text-gray-900">Contact phone:</span>{' '}
                  <a href={`tel:${application.contactPhone}`} className="text-primary-700 font-semibold no-underline hover:underline">
                    {application.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="mb-6">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Application details</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1.5">Motivation</p>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-[80px]">
                  {application.motivation || 'Not provided'}
                </div>
              </div>

              {application.experience && (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1.5">Previous experience</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-[60px]">
                    {application.experience}
                  </div>
                </div>
              )}

              {application.eventTypes && (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1.5">Planned event types</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-[40px]">
                    {application.eventTypes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 justify-end pt-4 border-t border-gray-100">
            {!showRejectForm ? (
              <>
                <button
                  onClick={handleRecordPayment}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
                  Record payment
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Reject
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y min-h-[80px]"
                />
                <button
                  onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-colors flex-shrink-0 self-start"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0 self-start"
                >
                  Confirm reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};