import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Trash2, ExternalLink, Plus } from 'lucide-react';

interface SelectedMentor {
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  responses: any[];
}

interface MentorResponsesTableProps {
  onMentorSelect: (mentor: SelectedMentor) => void;
}

const fetchMentorResponses = async (token: string) => {
  const res = await fetch('/api/mentor-interest', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const fetchMentorAnswers = async (token: string) => {
  const res = await fetch('/api/mentor-interest/admin-responses', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch mentor answers');
  return res.json();
};

const deleteMentorResponse = async (token: string, id: string) => {
  const res = await fetch(`/api/mentor-interest/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
};

const generateAccessToken = async (token: string, id: string) => {
  const res = await fetch(`/api/mentor-interest/${id}/generate-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to generate token');
  return res.json();
};

const updateMentorStatus = async (token: string, id: string, status: string) => {
  const res = await fetch(`/api/mentor-interest/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Status update failed:', res.status, errorText);
    throw new Error(`Failed to update status: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  console.log('Status update response:', result);
  return result;
};

// Helper function to check if a token is valid
const isValidToken = (token: any): boolean => {
  return token !== null && 
         token !== undefined && 
         typeof token === 'string' && 
         token.length === 64; // Valid tokens are exactly 64 characters
};

export default function MentorResponsesTable({ onMentorSelect }: MentorResponsesTableProps) {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [deleteData, setDeleteData] = useState<{ id: string; email: string } | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{ id: string; currentStatus: string; email: string } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['mentor-interest'],
    queryFn: () => fetchMentorResponses(token!),
    enabled: !!token,
  });

  const { data: mentorAnswers = [] } = useQuery({
    queryKey: ['mentor-answers'],
    queryFn: () => fetchMentorAnswers(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMentorResponse(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-interest'] });
      queryClient.refetchQueries({ queryKey: ['mentor-interest'] });
      setDeleteData(null);
    },
    onError: (error) => {
      console.error('Failed to delete:', error);
      alert('Failed to delete mentor interest submission');
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: (id: string) => generateAccessToken(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-interest'] });
      queryClient.refetchQueries({ queryKey: ['mentor-interest'] });
    },
    onError: (error) => {
      console.error('Failed to generate token:', error);
      alert('Failed to generate access token');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateMentorStatus(token!, id, status),
    onSuccess: (data) => {
      console.log('Status update successful:', data);
      // Invalidate and refetch the data
      queryClient.invalidateQueries({ queryKey: ['mentor-interest'] });
      queryClient.refetchQueries({ queryKey: ['mentor-interest'] });
      setStatusUpdate(null);
      setPendingStatus(null);
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      alert('Failed to update mentor status');
      setStatusUpdate(null);
      setPendingStatus(null);
    },
  });

  const handleDelete = (id: string, email: string) => {
    setDeleteData({ id, email });
  };

  const handleGenerateToken = (id: string) => {
    generateTokenMutation.mutate(id);
  };

  const handleStatusClick = (id: string, currentStatus: string, email: string) => {
    setStatusUpdate({ id, currentStatus, email });
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (statusUpdate) {
      setPendingStatus(newStatus);
      updateStatusMutation.mutate({ id: statusUpdate.id, status: newStatus });
    }
  };

  const handleMentorRowClick = (mentorId: string, mentorName: string, mentorEmail: string) => {
    // Get all responses for this mentor
    const mentorResponses = mentorAnswers.filter((r: any) => r.mentor_id === mentorId);
    const selectedMentor: SelectedMentor = {
      mentor_id: mentorId,
      mentor_name: mentorName,
      mentor_email: mentorEmail,
      responses: mentorResponses.sort((a: any, b: any) =>
        a.stage_id - b.stage_id  // Sort by question number (stage_id) ascending
      ),
    };
    
    // Use the callback to notify parent
    onMentorSelect(selectedMentor);
  };

  const confirmDelete = () => {
    if (deleteData) {
      deleteMutation.mutate(deleteData.id);
    }
  };

  const cancelDelete = () => {
    setDeleteData(null);
  };

  const cancelStatusUpdate = () => {
    setStatusUpdate(null);
    setPendingStatus(null);
  };

  const columns = useMemo(() => {
    if (!responses.length) return [];
    
    const keys = Object.keys(responses[0]).filter(key => 
      key !== '_id' && 
      key !== '__v' && 
      key !== 'accessToken'
    );
    
    // Define the desired column order
    const columnOrder = ['firstName', 'lastName', 'email', 'status', 'createdAt', 'jobTitle', 'company', 'industry', 'careerStage'];
    
    // Sort keys according to the desired order, putting any remaining keys at the end
    const sortedKeys = [
      ...columnOrder.filter(key => keys.includes(key)),
      ...keys.filter(key => !columnOrder.includes(key))
    ];
    
    const dataColumns = sortedKeys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: ({ row }: any) => {
        const value = row.original[key];
        if (Array.isArray(value)) return value.join(', ');
        if (key === 'createdAt') return new Date(value).toLocaleString();
        if (key === 'status') {
          const id = row.original._id;
          const email = row.original.email || 'No email';
          return (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click when clicking status
                handleStatusClick(id, value, email);
              }}
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                value === 'submitted' 
                  ? 'bg-green-100 text-green-800' 
                  : value === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : value === 'interview started'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
              title="Click to change status"
            >
              {value}
            </button>
          );
        }
        return value;
      },
    }));

    // Create columns array starting with actions and interview link
    const allColumns: typeof dataColumns = [];

    // Add actions column first
    allColumns.push({
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const id = row.original._id;
        const email = row.original.email || 'No email';
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click when clicking delete
                handleDelete(id, email);
              }}
              className="p-1 h-6 w-6 text-red-600 hover:text-red-800"
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    });

    // Add interview link/generate form column second
    allColumns.push({
      accessorKey: 'accessToken',
      header: 'Interview Access',
      cell: ({ row }: any) => {
        const accessToken = row.original.accessToken;
        const id = row.original._id;
        const status = row.original.status;
        
        // Get answered questions count for this mentor
        const mentorResponses = mentorAnswers.filter((r: any) => r.mentor_id === id);
        const questionCount = mentorResponses.length;
        
        // Check if this submission has a valid access token
        if (!isValidToken(accessToken)) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">No token</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click when clicking generate token
                  handleGenerateToken(id);
                }}
                className="p-1 h-6 w-6 text-blue-600 hover:text-blue-800"
                disabled={generateTokenMutation.isLoading}
                title="Generate access token for interview"
              >
                <Plus className="h-3 w-3" />
              </Button>
              {questionCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {questionCount}Q
                </span>
              )}
            </div>
          );
        }
        
        // Show interview link for valid tokens (but hide everything if submitted or rejected)
        if (status === 'submitted') {
          return (
            <div className="flex items-center gap-2">
              <span className='px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800'>
                submitted
              </span>
              {questionCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {questionCount}Q
                </span>
              )}
            </div>
          );
        }
        
        if (status === 'rejected') {
          return (
            <div className="flex items-center gap-2">
              <span className='px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800'>
                rejected
              </span>
              {questionCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {questionCount}Q
                </span>
              )}
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              {accessToken.substring(0, 8)}...
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click when clicking external link
                window.open(`/mentor-interview/${accessToken}/start`, '_blank');
              }}
              className="p-1 h-6 w-6"
              title="Open interview form"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            {questionCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {questionCount}Q
              </span>
            )}
          </div>
        );
      },
    });

    // Add all the data columns after the action columns
    allColumns.push(...dataColumns);

    return allColumns;
  }, [responses, deleteMutation.isLoading, generateTokenMutation.isLoading, handleStatusClick]);

  if (isLoading) return <div>Loading...</div>;
  if (!responses.length) return <div>No mentor responses found.</div>;

  return (
    <div className="max-w-full overflow-x-auto">
      <DataTable 
        columns={columns} 
        data={responses} 
        showCheckboxes={false}
        onRowClick={(row: any) => {
          handleMentorRowClick(
            row._id, 
            `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown Mentor',
            row.email || 'No email'
          );
        }}
        className="[&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-gray-50"
      />

      {/* Delete Confirmation Dialog */}
      {deleteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the mentor interest submission for{' '}
              <span className="font-semibold text-black">{deleteData.email}</span>? 
              This action cannot be undone and will also delete all associated interview responses.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={cancelDelete}
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Dialog */}
      {statusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <p className="text-gray-600 mb-4">
              Update status for{' '}
              <span className="font-semibold text-black">{statusUpdate.email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current status: <span className="font-medium">{statusUpdate.currentStatus}</span>
            </p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {['pending', 'submitted', 'interview started', 'rejected'].map((status) => {
                const isCurrentStatus = status === statusUpdate.currentStatus;
                const isPendingStatus = status === pendingStatus;
                const isLoading = updateStatusMutation.isLoading && isPendingStatus;
                
                return (
                  <Button
                    key={status}
                    variant={isPendingStatus ? "default" : isCurrentStatus ? "secondary" : "outline"}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updateStatusMutation.isLoading}
                    className={`text-sm ${
                      isPendingStatus ? 'opacity-100' :
                      status === 'submitted' ? 'border-green-200 hover:bg-green-50' :
                      status === 'rejected' ? 'border-red-200 hover:bg-red-50' :
                      status === 'interview started' ? 'border-blue-200 hover:bg-blue-50' :
                      'border-yellow-200 hover:bg-yellow-50'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      status
                    )}
                  </Button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={cancelStatusUpdate}
                disabled={updateStatusMutation.isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 