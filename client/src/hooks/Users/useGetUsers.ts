import { useQuery } from '@tanstack/react-query';

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

interface UseGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface GetUsersResponse {
  users: TUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const fetchAllUsers = async (token: string, params: UseGetUsersParams = {}): Promise<GetUsersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);

  const url = `/api/user/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export default function useGetUsers(token: string, params: UseGetUsersParams = {}) {
  return useQuery<GetUsersResponse>({
    queryKey: ['users', 'all', params],
    queryFn: () => fetchAllUsers(token, params),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
} 