import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Trash2 } from 'lucide-react';

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

export default function UserInterestTable() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [deleteData, setDeleteData] = useState<{ id: string; email: string } | null>(null);

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

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }: any) => (
        <span className="font-medium text-gray-900">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }: any) => (
        <span className="text-gray-600">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'currentSituation',
      header: 'Situation',
      cell: ({ getValue }: any) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }: any) => {
        const user = row.original;
        const situation = user.currentSituation;
        
        let details = '';
        if (situation === 'In college') {
          const collegeDetails = [user.currentSchool, user.studyingField, user.graduationYear].filter(Boolean);
          if (user.openToStudentMentorship) {
            collegeDetails.push('Open to mentorship');
          }
          details = collegeDetails.join(' • ');
        } else if (situation === 'Currently working') {
          details = [user.jobTitle, user.company, user.workCity].filter(Boolean).join(' • ');
        } else if (situation === 'Recently graduated / job searching') {
          details = [user.studiedField, user.currentCity, user.activelyApplying].filter(Boolean).join(' • ');
        } else if (situation === 'Taking a break' || situation === 'Other') {
          details = [user.currentFocus, user.currentCity].filter(Boolean).join(' • ');
        }
        
        return (
          <span className="text-gray-600 text-sm" title={details}>
            {details || 'No details'}
          </span>
        );
      },
    },
    {
      accessorKey: 'referralSource',
      header: 'How They Heard',
      cell: ({ row }: any) => {
        const referralSource = row.original.referralSource;
        const other = row.original.referralSourceOther;
        const displayText = referralSource === 'Other' && other 
          ? `Other: ${other}` 
          : referralSource;
        return (
          <span className="text-gray-600" title={displayText}>
            {displayText}
          </span>
        );
      },
    },
    {
      accessorKey: 'motivation',
      header: 'Motivation',
      cell: ({ getValue }: any) => {
        const motivation = getValue();
        const truncated = motivation && motivation.length > 40 
          ? `${motivation.substring(0, 40)}...` 
          : motivation;
        return (
          <span className="text-gray-600" title={motivation}>
            {truncated}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
      cell: ({ getValue }: any) => {
        const date = new Date(getValue());
        return (
          <span className="text-gray-600">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const userInterest = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteData({ id: userInterest._id, email: userInterest.email })}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], []);

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

      <div className="rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={userInterests}
          showCheckboxes={false}
          enableRowSelection={false}
        />
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
    </div>
  );
} 