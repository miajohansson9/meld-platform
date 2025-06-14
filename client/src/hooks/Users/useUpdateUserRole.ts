import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateUserRoleParams {
  userId: string;
  role: string;
  token: string;
}

interface UpdateUserRoleResponse {
  user: {
    _id: string;
    role: string;
    email: string;
    name: string;
  };
  message: string;
}

const updateUserRole = async ({ userId, role, token }: UpdateUserRoleParams): Promise<UpdateUserRoleResponse> => {
  const res = await fetch(`/api/user/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });
  
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json();
};

export default function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserRoleResponse, Error, UpdateUserRoleParams>({
    mutationFn: updateUserRole,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] });
    },
  });
} 