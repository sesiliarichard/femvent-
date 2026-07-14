import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PaymentModal } from '../components/PaymentModal';
import { HostApplicationModal } from '../components/HostApplicationModal';
import { getAllUsers, getUserStats, updateUserRole, updateHostApplication, suspendUser, approveHostApplication, rejectHostApplication, recordPayment } from '../services/firestore';
import { supabase } from '../services/supabase';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingHosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHostApplicationModal, setShowHostApplicationModal] = useState(false);
  const [selectedHostApplication, setSelectedHostApplication] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUserStats()
        ]);
        setUsers(usersData);
        setUserStats(statsData);
      } catch (error) {
        console.error('Error fetching users data:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = String(error);
        }
        alert('Error fetching users data: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel('users-page-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert(`Role updated to ${newRole}! Mobile app should update automatically.`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleReviewHostApplication = async (userId: string, status: string, rejectionReason?: string) => {
    try {
      await updateHostApplication(userId, status, rejectionReason);
      setUsers(users.map(user => 
        user.id === userId ? { 
          ...user, 
          hostApplication: { ...user.hostApplication, status },
          role: status === 'approved' ? 'host' : user.role
        } : user
      ));
    } catch (error) {
      console.error('Error reviewing host application:', error);
      alert('Failed to review host application');
    }
  };

  const handleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      await suspendUser(userId, isSuspended);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isSuspended } : user
      ));
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    }
  };

  const handleApproveHost = async (userId: string) => {
    try {
      await approveHostApplication(userId);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: 'host', hostApplication: { ...user.hostApplication, status: 'approved' } } : user
      ));
      alert('Host application approved successfully!');
    } catch (error) {
      console.error('Error approving host application:', error);
      alert('Failed to approve host application');
    }
  };

  const handleRejectHost = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectHostApplication(userId, rejectionReason);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, hostApplication: { ...user.hostApplication, status: 'rejected', rejectionReason } } : user
      ));
      setRejectionReason('');
      alert('Host application rejected');
    } catch (error) {
      console.error('Error rejecting host application:', error);
      alert('Failed to reject host application');
    }
  };

  const handleRecordPayment = (user: any) => {
    setSelectedUser(user);
    setShowPaymentModal(true);
  };

  const handleOpenHostApplicationModal = (user: any) => {
    setSelectedHostApplication(user);
    setShowHostApplicationModal(true);
  };

  const handlePaymentRecorded = () => {
    const fetchData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUserStats()
        ]);
        setUsers(usersData);
        setUserStats(statsData);
      } catch (error) {
        console.error('Error fetching users data:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = String(error);
        }
        alert('Error fetching users data: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  return (
    <AdminLayout>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '2rem 2rem',
          borderBottom: '3px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: '800', 
              color: 'white', 
              margin: 0,
              letterSpacing: '-0.025em',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Mobile App Users
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '1rem', 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500'
            }}>
              Manage mobile app users and host applications
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Pending Host Applications */}
          {users.filter(user => user.hostApplication?.status === 'pending').length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '1rem',
              padding: '1.75rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)'
              }} />
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#92400e', 
                margin: '0 0 1.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span> Pending Host Applications
              </h3>
              {users.filter(user => user.hostApplication?.status === 'pending').map(user => (
                <div key={user.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '0.5rem',
                      fontSize: '1.05rem'
                    }}>
                      {user.name || user.email}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>📅</span> Applied: {user.hostApplication?.appliedAt?.toLocaleDateString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>📧</span> {user.hostApplication?.contactMethod === 'email' 
                        ? user.hostApplication?.contactEmail 
                        : user.hostApplication?.contactPhone}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenHostApplicationModal(user)}
                      style={{
                        padding: '0.875rem 1.75rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      Review Application →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
              border: '1px solid #e5e7eb',
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div style={{ 
                  width: '3.5rem', 
                  height: '3.5rem', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  borderRadius: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Mobile Users</p>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0.25rem 0 0 0' }}>{userStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
              border: '1px solid #e5e7eb',
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div style={{ 
                  width: '3.5rem', 
                  height: '3.5rem', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  borderRadius: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}>
                  <svg style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online Now (last 10 min)</p>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0.25rem 0 0 0' }}>{userStats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
              border: '1px solid #e5e7eb',
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div style={{ 
                  width: '3.5rem', 
                  height: '3.5rem', 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  borderRadius: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                }}>
                  <svg style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Host Apps</p>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0.25rem 0 0 0' }}>{userStats.pendingHosts.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '1.75rem 2rem', 
              borderBottom: '2px solid #f3f4f6',
              background: 'linear-gradient(to right, #fafafa, #ffffff)'
            }}>
              <h3 style={{ 
                fontSize: '1.375rem', 
                fontWeight: '700', 
                color: '#111827', 
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                Mobile App Users
              </h3>
            </div>
            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', 
                gap: '1rem',
                padding: '1rem 0.75rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                fontWeight: '700',
                fontSize: '0.8rem',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div>Host App</div>
                <div>Actions</div>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <div style={{ 
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ marginTop: '1rem', fontWeight: '500' }}>Loading mobile app users...</p>
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p style={{ fontWeight: '500', fontSize: '1rem' }}>No mobile app users found</p>
                </div>
              ) : (
                users.map((user, index) => (
                  <div key={user.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', 
                    gap: '1rem',
                    padding: '1rem 0.75rem',
                    borderBottom: index < users.length - 1 ? '1px solid #f3f4f6' : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    borderRadius: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                      {user.name || user.email?.split('@')[0]}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{user.email}</div>
                    <div>
                      <select 
                        value={user.role || 'attendee'} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: '0.5rem', 
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: user.role === 'admin' ? '#eef2ff' : user.role === 'host' ? '#ecfdf5' : '#f3f4f6',
                          color: user.role === 'admin' ? '#4f46e5' : user.role === 'host' ? '#059669' : '#6b7280',
                          border: user.role === 'admin' ? '2px solid #c7d2fe' : user.role === 'host' ? '2px solid #a7f3d0' : '2px solid #e5e7eb',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <span style={{ 
                        padding: '0.375rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: user.isSuspended ? '#fef3c7' : '#d1fae5',
                        color: user.isSuspended ? '#d97706' : '#065f46',
                        border: user.isSuspended ? '2px solid #fde68a' : '2px solid #a7f3d0'
                      }}>
                        {user.isSuspended ? '🔒 Suspended' : '✓ Active'}
                      </span>
                    </div>
                    <div>
                      {user.hostApplication?.status ? (
                        <span style={{ 
                          padding: '0.375rem 0.75rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: user.hostApplication.status === 'pending' ? '#fef3c7' : 
                                          user.hostApplication.status === 'approved' ? '#d1fae5' : '#fee2e2',
                          color: user.hostApplication.status === 'pending' ? '#d97706' : 
                                 user.hostApplication.status === 'approved' ? '#065f46' : '#991b1b',
                          border: user.hostApplication.status === 'pending' ? '2px solid #fde68a' : 
                                 user.hostApplication.status === 'approved' ? '2px solid #a7f3d0' : '2px solid #fecaca'
                        }}>
                          {user.hostApplication.status === 'pending' ? '⏳' : 
                           user.hostApplication.status === 'approved' ? '✓' : '✗'} {user.hostApplication.status}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '500' }}>—</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      {user.hostApplication?.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button 
                            onClick={() => handleReviewHostApplication(user.id, 'approved')}
                            style={{ 
                              padding: '0.5rem 0.875rem', 
                              fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleReviewHostApplication(user.id, 'rejected', reason);
                            }}
                            style={{ 
                              padding: '0.5rem 0.875rem', 
                              fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleSuspendUser(user.id, !user.isSuspended)}
                        style={{ 
                          padding: '0.5rem 0.875rem', 
                          fontSize: '0.8rem',
                          background: user.isSuspended 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          boxShadow: user.isSuspended 
                            ? '0 2px 4px rgba(16, 185, 129, 0.3)' 
                            : '0 2px 4px rgba(245, 158, 11, 0.3)',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = user.isSuspended 
                            ? '0 4px 6px rgba(16, 185, 129, 0.4)' 
                            : '0 4px 6px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = user.isSuspended 
                            ? '0 2px 4px rgba(16, 185, 129, 0.3)' 
                            : '0 2px 4px rgba(245, 158, 11, 0.3)';
                        }}
                      >
                        {user.isSuspended ? '🔓 Activate' : '🔒 Suspend'}
                      </button>
                      <button 
                        onClick={() => handleRecordPayment(user)}
                        style={{ 
                          padding: '0.5rem 0.875rem', 
                          fontSize: '0.8rem',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        💳 Record Payment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedUser && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userId={selectedUser.id}
          userName={selectedUser.name || selectedUser.email}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}

      {/* Host Application Modal */}
      {showHostApplicationModal && selectedHostApplication && (
        <HostApplicationModal
          isOpen={showHostApplicationModal}
          onClose={() => setShowHostApplicationModal(false)}
          user={selectedHostApplication}
          onApprove={handleApproveHost}
          onReject={handleRejectHost}
          onRecordPayment={handleRecordPayment}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}