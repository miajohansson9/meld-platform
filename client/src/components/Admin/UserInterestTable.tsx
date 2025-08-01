import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Trash2, CheckCircle, Eye } from 'lucide-react';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';

const fetchUserInterests = async (token: string) => {
  const res = await fetch('/api/user-interest', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const deleteUserInterest = async (token: string, id: string) => {
  const res = await fetch(`/api/user-interest/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
};

const updateNewsletterStatus = async (token: string, id: string) => {
  const res = await fetch(`/api/user-interest/${id}/newsletter-signup`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to update newsletter status');
  return res.json();
};

export default function UserInterestTable() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [deleteData, setDeleteData] = useState<{ id: string; email: string } | null>(null);
  const [motivationModal, setMotivationModal] = useState<{ name: string; email: string; motivation: string } | null>(null);

  const { data: userInterests = [], isLoading, error } = useQuery({
    queryKey: ['userInterests'],
    queryFn: () => fetchUserInterests(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserInterest(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userInterests'] });
      setDeleteData(null);
    },
    onError: (error) => {
      console.error('Delete failed:', error);
    },
  });

  const updateNewsletterMutation = useMutation({
    mutationFn: (id: string) => updateNewsletterStatus(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userInterests'] });
    },
    onError: (error) => {
      console.error('Newsletter update failed:', error);
    },
  });

  // Stable callback functions to prevent re-renders
  const handleMotivationClick = useCallback((name: string, email: string, motivation: string) => {
    setMotivationModal({ name, email, motivation });
  }, []);

  const handleNewsletterUpdate = useCallback((id: string) => {
    updateNewsletterMutation.mutate(id);
  }, [updateNewsletterMutation]);

  const handleDelete = useCallback((id: string, email: string) => {
    setDeleteData({ id, email });
  }, []);

  // Simple table component to avoid virtualization re-renders
  const renderUserRow = useCallback((userInterest: any) => {
    // Motivation logic
    const motivation = userInterest.motivation;
    const truncated = motivation && motivation.length > 120 
      ? `${motivation.substring(0, 120)}...` 
      : motivation;
    const isTruncated = motivation && motivation.length > 120;

    // Details logic
    const situation = userInterest.currentSituation;
    let details = '';
    if (situation === 'In college') {
      const collegeDetails = [userInterest.currentSchool, userInterest.studyingField, userInterest.graduationYear].filter(Boolean);
      if (userInterest.openToStudentMentorship) {
        collegeDetails.push('Open to mentorship');
      }
      details = collegeDetails.join(' • ');
    } else if (situation === 'Currently working') {
      details = [userInterest.jobTitle, userInterest.company, userInterest.workCity].filter(Boolean).join(' • ');
    } else if (situation === 'Recently graduated / job searching') {
      details = [userInterest.studiedField, userInterest.currentCity, userInterest.activelyApplying].filter(Boolean).join(' • ');
    } else if (situation === 'Taking a break' || situation === 'Other') {
      details = [userInterest.currentFocus, userInterest.currentCity].filter(Boolean).join(' • ');
    }

    // Referral source logic
    const referralSource = userInterest.referralSource;
    const other = userInterest.referralSourceOther;
    const displayReferral = referralSource === 'Other' && other 
      ? `Other: ${other}` 
      : referralSource;

    return (
      <tr key={userInterest._id} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm">
          <span className="font-medium text-gray-900">{userInterest.name}</span>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className="text-gray-600">{userInterest.email}</span>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {userInterest.currentSituation}
          </span>
        </td>
                 <td className="px-4 py-3 text-sm" style={{ maxWidth: '200px' }}>
           <span className="text-gray-600 text-sm block leading-relaxed" title={details}>
             {details || 'No details'}
           </span>
         </td>
                 <td className="px-4 py-3 text-sm" style={{ maxWidth: '150px' }}>
           <span className="text-gray-600 block leading-relaxed" title={displayReferral}>
             {displayReferral}
           </span>
         </td>
        <td className="px-4 py-3 text-sm" style={{ minWidth: '300px', maxWidth: '400px' }}>
          <div className="flex items-start gap-2">
            <span className="text-gray-600 flex-1 min-w-0 break-words">
              {truncated}
            </span>
            {isTruncated && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMotivationClick(userInterest.name, userInterest.email, motivation)}
                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex-shrink-0"
                title="View full motivation"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              userInterest.completedSubstackSignup 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userInterest.completedSubstackSignup ? '✅ Subscribed' : '⏸️ Not Confirmed'}
            </span>
            {!userInterest.completedSubstackSignup && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleNewsletterUpdate(userInterest._id)}
                disabled={updateNewsletterMutation.isLoading}
                className="h-6 w-6 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                title="Mark as subscribed (if you manually added them to Substack)"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className="text-gray-600">
            {new Date(userInterest.createdAt).toLocaleDateString()}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(userInterest._id, userInterest.email)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  }, [handleMotivationClick, handleNewsletterUpdate, handleDelete, updateNewsletterMutation.isLoading]);

  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading user interests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading user interests</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          User Interest Signups ({userInterests.length})
        </h2>
      </div>

      {/* Simple table without virtualization for smooth scrolling */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Situation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Details</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">How They Heard</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900" style={{ minWidth: '300px' }}>Motivation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Newsletter</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userInterests.map((userInterest: any) => renderUserRow(userInterest))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the user interest signup for{' '}
              <strong>{deleteData.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteData(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteData.id)}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Motivation Modal */}
      <OGDialog open={!!motivationModal} onOpenChange={() => setMotivationModal(null)}>
        <OGDialogContent className="max-w-2xl bg-white text-text-primary shadow-2xl">
          <OGDialogTitle>What do they want to get out of MELD?</OGDialogTitle>
          
          {motivationModal && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">
                  <strong>Name:</strong> {motivationModal.name}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Email:</strong> {motivationModal.email}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Response:</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {motivationModal.motivation}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setMotivationModal(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </OGDialogContent>
      </OGDialog>
    </div>
  );
} 