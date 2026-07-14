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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            Host Application Review
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Applicant Info */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.75rem'
          }}>
            Applicant Information
          </h3>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Name:</strong> {user.name || 'Not provided'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {user.email}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Applied:</strong> {application.appliedAt ? formatDate(application.appliedAt) : 'Unknown'}
            </div>
            <div>
              <strong>Current Role:</strong> {user.role || 'attendee'}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.75rem'
          }}>
            Contact Information
          </h3>
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #0ea5e9'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Preferred Contact Method:</strong> 
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#0ea5e9',
                color: 'white',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}>
                {application.contactMethod || 'Not specified'}
              </span>
            </div>
            {application.contactMethod === 'email' && application.contactEmail && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Contact Email:</strong> 
                <a 
                  href={`mailto:${application.contactEmail}`}
                  style={{
                    marginLeft: '0.5rem',
                    color: '#0ea5e9',
                    textDecoration: 'none'
                  }}
                >
                  {application.contactEmail}
                </a>
              </div>
            )}
            {application.contactMethod === 'phone' && application.contactPhone && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Contact Phone:</strong> 
                <a 
                  href={`tel:${application.contactPhone}`}
                  style={{
                    marginLeft: '0.5rem',
                    color: '#0ea5e9',
                    textDecoration: 'none'
                  }}
                >
                  {application.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.75rem'
          }}>
            Application Details
          </h3>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Motivation:</strong>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                minHeight: '80px'
              }}>
                {application.motivation || 'Not provided'}
              </div>
            </div>
            
            {application.experience && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Previous Experience:</strong>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  minHeight: '60px'
                }}>
                  {application.experience}
                </div>
              </div>
            )}
            
            {application.eventTypes && (
              <div>
                <strong>Planned Event Types:</strong>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  minHeight: '40px'
                }}>
                  {application.eventTypes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          {!showRejectForm ? (
            <>
              <button
                onClick={handleRecordPayment}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Record Payment
              </button>
              <button
                onClick={handleApprove}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Approve Application
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Reject Application
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, marginRight: '0.75rem' }}>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Confirm Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
