import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';

const fetchMentorResponses = async () => {
  const res = await fetch('/api/mentor-interest');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function MentorResponsesTable() {
  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['mentor-interest'],
    queryFn: fetchMentorResponses,
  });

  const columns = useMemo(() => {
    if (!responses.length) return [];
    const keys = Object.keys(responses[0]).filter(key => key !== '_id' && key !== '__v');
    return keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: ({ row }: any) => {
        const value = row.original[key];
        if (Array.isArray(value)) return value.join(', ');
        if (key === 'createdAt' || key === 'updatedAt') return new Date(value).toLocaleString();
        return value;
      },
    }));
  }, [responses]);

  if (isLoading) return <div>Loading...</div>;
  if (!responses.length) return <div>No mentor responses found.</div>;

  return (
    <div className="max-w-full overflow-x-auto">
      <DataTable columns={columns} data={responses} showCheckboxes={false} />
    </div>
  );
} 