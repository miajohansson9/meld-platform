import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Download } from 'lucide-react';

interface MentorResponse {
  _id: string;
  stage_id: number;
  question: string;
  preamble: string;
  response_text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  mentor_jobTitle: string;
  mentor_company: string;
  mentor_accessToken: string;
}

interface SelectedMentor {
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  responses: MentorResponse[];
}

interface MentorAnswersTableProps {
  onMentorSelect: (mentor: SelectedMentor) => void;
}

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

export default function MentorAnswersTable({ onMentorSelect }: MentorAnswersTableProps) {
  const { token } = useAuthContext();

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['mentor-answers'],
    queryFn: () => fetchMentorAnswers(token!),
    enabled: !!token,
  });

    // Sort by creation date (most recent first)
  const sortedResponses = [...responses].sort((a: MentorResponse, b: MentorResponse) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleRowClick = (response: MentorResponse) => {
    // Get all responses for this mentor
    const mentorResponses = responses.filter((r: MentorResponse) => r.mentor_id === response.mentor_id);
    if (mentorResponses.length > 0) {
      const selectedMentor: SelectedMentor = {
        mentor_id: response.mentor_id,
        mentor_name: response.mentor_name,
        mentor_email: response.mentor_email,
        responses: mentorResponses.sort((a: MentorResponse, b: MentorResponse) =>
          a.stage_id - b.stage_id  // Sort by question number (stage_id) ascending
        ),
      };

      // Use the callback to notify parent
      onMentorSelect(selectedMentor);
    }
  };

  // CSV Export functionality
  const exportToCSV = useCallback(() => {
    if (!responses.length) return;
    
    const headers = [
      'Created At',
      'Mentor Name',
      'Mentor Email',
      'Job Title',
      'Company',
      'Status',
      'Question Number',
      'Question',
      'Answer',
      'Preamble'
    ];

    const csvData = responses.map((response: MentorResponse) => [
      response.createdAt ? new Date(response.createdAt).toLocaleDateString() : '',
      response.mentor_name || '',
      response.mentor_email || '',
      response.mentor_jobTitle || '',
      response.mentor_company || '',
      response.status || '',
      response.stage_id ? `Q${response.stage_id}` : '',
      response.question || '',
      response.response_text || '',
      response.preamble || ''
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mentor-answers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [responses]);

  if (isLoading) return <div>Loading mentor answers...</div>;
  if (!responses.length) return <div>No mentor answers found.</div>;

  return (
    <div className="w-full max-w-full">
      {/* Header with export button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Mentor Answers ({responses.length})
        </h2>
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={responses.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-y-auto h-[calc(100vh-20rem)] w-full">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Created At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Q#
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Answer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResponses.map((response: MentorResponse) => (
                <tr
                  key={response._id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(response)}
                >
                  <td className="px-4 py-4 text-sm text-gray-900 w-40">
                    <div className="text-xs text-gray-600">
                      {new Date(response.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 w-56">
                    <div className="truncate" title={response.mentor_email}>
                      {response.mentor_email}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 w-32">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${response.status === 'submitted'
                        ? 'bg-green-100 text-green-800'
                        : response.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : response.status === 'interview started'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {response.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 w-16">
                    Q{response.stage_id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 w-48">
                    <div className="break-words line-clamp-3" title={response.question}>
                      {response.question}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 w-64">
                    <div className="break-words line-clamp-3" title={response.response_text}>
                      {response.response_text}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 