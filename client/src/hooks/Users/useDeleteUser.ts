import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteUserParams {
  userId: string;
  token: string;
}

interface DeleteUserResponse {
  message: string;
  deletedUserId: string;
}

const deleteUser = async ({ userId, token }: DeleteUserParams): Promise<DeleteUserResponse> => {
  const res = await fetch(`/api/user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

export default function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<DeleteUserResponse, Error, DeleteUserParams>({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] });
    },
  });
} 