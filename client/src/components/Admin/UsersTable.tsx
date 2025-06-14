import React, { useMemo, useState } from 'react';
import { Trash2, Edit, Search } from 'lucide-react';

// Define SystemRoles locally to avoid import issues
const SystemRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MENTOR: 'MENTOR',
} as const;
import DataTable from '~/components/ui/DataTable';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetUsers, useUpdateUserRole, useDeleteUser } from '~/hooks/Users';
import { Button } from '~/components/ui';
import { useToastContext } from '~/Providers';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/Select';

interface TUser {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  provider: string;
  createdAt: string;
  avatar?: string;
  lastLogin?: string;
}

export default function UsersTable() {
  const { token, user: currentUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading, error } = useGetUsers(token!, {
    page,
    limit: 20,
    search,
    role: roleFilter === 'all' ? '' : roleFilter,
  });

  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1); // Reset to first page when searching
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole || !token) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUser._id,
        role: newRole,
        token,
      });
      showToast({
        status: 'success',
        message: `User role updated to ${newRole}`,
      });
      setRoleModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      showToast({
        status: 'error',
        message: error?.message || 'Failed to update user role',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !token) return;

    try {
      await deleteUserMutation.mutateAsync({
        userId: selectedUser._id,
        token,
      });
      showToast({
        status: 'success',
        message: 'User deleted successfully',
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      showToast({
        status: 'error',
        message: 'Failed to delete user',
      });
    }
  };

  const openRoleModal = (user: TUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const openDeleteModal = (user: TUser) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {row.original.avatar && (
            <img
              src={row.original.avatar}
              alt="Avatar"
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{row.original.name || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.role === SystemRoles.ADMIN
            ? 'bg-red-100 text-red-800'
            : row.original.role === SystemRoles.MENTOR
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }: any) => (
        <span className="text-sm capitalize">{row.original.provider}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const user = row.original;
        const isCurrentUser = user._id === currentUser?.id;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openRoleModal(user)}
              disabled={isCurrentUser}
              className="p-1 h-8 w-8 text-blue-600 hover:text-blue-800"
              title={isCurrentUser ? "Cannot change your own role" : "Change role"}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(user)}
              disabled={isCurrentUser}
              className="p-1 h-8 w-8 text-red-600 hover:text-red-800"
              title={isCurrentUser ? "Cannot delete your own account" : "Delete user"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [currentUser?.id]);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users: {(error as any)?.message || 'Unknown error'}</div>;
  if (!data?.users?.length) return <div>No users found.</div>;

  return (
    <div className="max-w-full overflow-x-auto">
      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="px-3 py-2 border rounded-md h-10"
          />
          <Button
            onClick={handleSearch}
            variant="outline"
            size="sm"
            className="px-3 h-10"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 h-10">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value={SystemRoles.ADMIN}>Admin</SelectItem>
            <SelectItem value={SystemRoles.USER}>User</SelectItem>
            <SelectItem value={SystemRoles.MENTOR}>Mentor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable 
        columns={columns} 
        data={data.users} 
        showCheckboxes={false}
      />

      {/* Role Change Modal */}
      <OGDialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <OGDialogContent className="max-w-md bg-background text-text-primary shadow-2xl">
          <OGDialogTitle>Change User Role</OGDialogTitle>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Changing role for: <strong>{selectedUser.name || selectedUser.email}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value={SystemRoles.ADMIN}>Admin</SelectItem>
                    <SelectItem value={SystemRoles.USER}>User</SelectItem>
                    <SelectItem value={SystemRoles.MENTOR}>Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setRoleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRoleChange}
                  disabled={updateRoleMutation.isLoading || newRole === selectedUser.role}
                >
                  {updateRoleMutation.isLoading ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </div>
          )}
        </OGDialogContent>
      </OGDialog>

      {/* Delete Confirmation Modal */}
      <OGDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <OGDialogContent className="max-w-md bg-background text-text-primary shadow-2xl">
          <OGDialogTitle>Delete User</OGDialogTitle>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete: <strong>{selectedUser.name || selectedUser.email}</strong>?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. All user data will be permanently deleted.
                </p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={deleteUserMutation.isLoading}
                >
                  {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          )}
        </OGDialogContent>
      </OGDialog>
    </div>
  );
} 