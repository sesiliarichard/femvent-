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

  const handleDeleteUser = async (userId: string, userLabel: string) => {
    if (!confirm(`Permanently delete ${userLabel}? This cannot be undone and will remove their account entirely.`)) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Delete blocked — no rows were removed (likely an RLS policy or a linked record, e.g. tickets, still referencing this user)');
      }
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove user');
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

  const pendingApplicants = users.filter(user => user.hostApplication?.status === 'pending');

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-primary-600 px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Mobile App Users</h1>
            <p className="mt-1.5 text-sm text-white/85 font-medium">Manage mobile app users and host applications</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 max-w-6xl mx-auto">
          {/* Pending Host Applications */}
          {pendingApplicants.length > 0 && (
            <div className="bg-accent-50 border border-accent-200 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-extrabold text-accent-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
                Pending Host Applications
              </h3>
              {pendingApplicants.map(user => (
                <div key={user.id} className="flex justify-between items-center px-5 py-4 bg-white rounded-xl mb-3 last:mb-0">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-1.5 text-[15px]">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      Applied: {user.hostApplication?.appliedAt?.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.hostApplication?.contactMethod === 'email'
                        ? user.hostApplication?.contactEmail
                        : user.hostApplication?.contactPhone}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenHostApplicationModal(user)}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Review Application →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User Stats */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Mobile Users</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{userStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Online Now (last 10 min)</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{userStats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Host Apps</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{userStats.pendingHosts.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">Mobile App Users</h3>
            </div>
            <div className="p-6">
              <div className="hidden md:grid gap-4 px-3 py-3 bg-gray-50 rounded-xl mb-3 font-extrabold text-xs text-gray-400 uppercase tracking-wide" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto' }}>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div>Host App</div>
                <div>Actions</div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="inline-block w-9 h-9 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                  <p className="mt-4 font-semibold text-sm">Loading mobile app users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-semibold text-sm">No mobile app users found</p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-4 px-3 py-4 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50 rounded-xl transition-colors"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto' }}
                  >
                    <div className="font-bold text-gray-900 text-sm">
                      {user.name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-gray-500 text-sm">{user.email}</div>
                    <div>
                      <select
                        value={user.role || 'attendee'}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 outline-none cursor-pointer ${
                          user.role === 'admin' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                          user.role === 'host' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        user.isSuspended ? 'bg-accent-50 text-accent-700 border-accent-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <div>
                      {user.hostApplication?.status ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                          user.hostApplication.status === 'pending' ? 'bg-accent-50 text-accent-700 border-accent-200' :
                          user.hostApplication.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {user.hostApplication.status}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-semibold">—</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {user.hostApplication?.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReviewHostApplication(user.id, 'approved')}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleReviewHostApplication(user.id, 'rejected', reason);
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleSuspendUser(user.id, !user.isSuspended)}
                        className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors ${
                          user.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-accent-500 hover:bg-accent-600'
                        }`}
                      >
                        {user.isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => handleRecordPayment(user)}
                        className="px-3 py-1.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
                      >
                        Delete
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
    </AdminLayout>
  );
}