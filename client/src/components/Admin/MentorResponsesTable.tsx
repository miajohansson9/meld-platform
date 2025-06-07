import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Trash2, ExternalLink, Plus } from 'lucide-react';

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

// Helper function to check if a token is valid
const isValidToken = (token: any): boolean => {
  return token !== null && 
         token !== undefined && 
         typeof token === 'string' && 
         token.length === 64; // Valid tokens are exactly 64 characters
};

export default function MentorResponsesTable() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [deleteData, setDeleteData] = useState<{ id: string; email: string } | null>(null);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['mentor-interest'],
    queryFn: () => fetchMentorResponses(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMentorResponse(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-interest']);
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
      queryClient.invalidateQueries(['mentor-interest']);
    },
    onError: (error) => {
      console.error('Failed to generate token:', error);
      alert('Failed to generate access token');
    },
  });

  const handleDelete = (id: string, email: string) => {
    setDeleteData({ id, email });
  };

  const handleGenerateToken = (id: string) => {
    generateTokenMutation.mutate(id);
  };

  const confirmDelete = () => {
    if (deleteData) {
      deleteMutation.mutate(deleteData.id);
    }
  };

  const cancelDelete = () => {
    setDeleteData(null);
  };

  const columns = useMemo(() => {
    if (!responses.length) return [];
    
    const keys = Object.keys(responses[0]).filter(key => 
      key !== '_id' && 
      key !== '__v' && 
      key !== 'accessToken'
    );
    
    const dataColumns = keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: ({ row }: any) => {
        const value = row.original[key];
        if (Array.isArray(value)) return value.join(', ');
        if (key === 'createdAt' || key === 'updatedAt') return new Date(value).toLocaleString();
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
              onClick={() => handleDelete(id, email)}
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
        
        // Check if this submission has a valid access token
        if (!isValidToken(accessToken)) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">No token</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateToken(id)}
                className="p-1 h-6 w-6 text-blue-600 hover:text-blue-800"
                disabled={generateTokenMutation.isLoading}
                title="Generate access token for interview"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          );
        }
        
        // Show interview link for valid tokens
        return (
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              {accessToken.substring(0, 8)}...
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/mentor-interview/${accessToken}/start`, '_blank')}
              className="p-1 h-6 w-6"
              title="Open interview form"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    });

    // Add all the data columns after the action columns
    allColumns.push(...dataColumns);

    return allColumns;
  }, [responses, deleteMutation.isLoading, generateTokenMutation.isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!responses.length) return <div>No mentor responses found.</div>;

  return (
    <div className="max-w-full overflow-x-auto">
      <DataTable columns={columns} data={responses} showCheckboxes={false} />

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
    </div>
  );
} 