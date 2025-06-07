import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { useAuthContext } from '~/hooks/AuthContext';
import { Button } from '~/components/ui';
import { Eye, ExternalLink } from 'lucide-react';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';

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

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function MentorAnswersTable() {
  const { token } = useAuthContext();
  const [selectedMentor, setSelectedMentor] = useState<{
    mentor_id: string;
    mentor_name: string;
    mentor_email: string;
    responses: MentorResponse[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['mentor-answers'],
    queryFn: () => fetchMentorAnswers(token!),
    enabled: !!token,
  });

  const handleViewDetails = (mentorId: string) => {
    // Get all responses for this mentor
    const mentorResponses = responses.filter((r: MentorResponse) => r.mentor_id === mentorId);
    if (mentorResponses.length > 0) {
      const firstResponse = mentorResponses[0];
      setSelectedMentor({
        mentor_id: mentorId,
        mentor_name: firstResponse.mentor_name,
        mentor_email: firstResponse.mentor_email,
        responses: mentorResponses.sort((a: MentorResponse, b: MentorResponse) => a.stage_id - b.stage_id),
      });
      setModalOpen(true);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'mentor_name',
      header: 'Mentor Name',
      cell: ({ row }: any) => {
        const mentorName = row.original.mentor_name;
        const mentorId = row.original.mentor_id;
        const accessToken = row.original.mentor_accessToken;
        const stageId = row.original.stage_id;
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{mentorName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(mentorId)}
              className="p-1 h-6 w-6 text-blue-600 hover:text-blue-800"
              title="View all responses"
            >
              <Eye className="h-3 w-3" />
            </Button>
            {accessToken && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/mentor-interview/${accessToken}/question/${stageId}`, '_blank')}
                className="p-1 h-6 w-6 text-green-600 hover:text-green-800"
                title="Go to this question in form"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'mentor_email',
      header: 'Email',
    },
    {
      accessorKey: 'stage_id',
      header: 'Stage',
      cell: ({ row }: any) => `Q${row.original.stage_id}`,
    },
    {
      accessorKey: 'preamble',
      header: 'Preamble',
      cell: ({ row }: any) => (
        <div className="max-w-xs">
          <span title={row.original.preamble}>
            {truncateText(row.original.preamble, 80)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'question',
      header: 'Question',
      cell: ({ row }: any) => (
        <div className="max-w-sm">
          <span title={row.original.question}>
            {truncateText(row.original.question, 120)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'response_text',
      header: 'Answer',
      cell: ({ row }: any) => (
        <div className="max-w-md">
          <span title={row.original.response_text}>
            {truncateText(row.original.response_text, 150)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.status === 'submitted' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.status}
        </span>
      ),
    },
  ], []);

  if (isLoading) return <div>Loading mentor answers...</div>;
  if (!responses.length) return <div>No mentor answers found.</div>;

  return (
    <div className="max-w-full overflow-x-auto">
      <DataTable 
        columns={columns} 
        data={responses} 
        showCheckboxes={false}
      />
      
      {/* Detailed Modal */}
      <OGDialog open={modalOpen} onOpenChange={setModalOpen}>
        <OGDialogContent className="max-w-4xl w-11/12 max-h-[80vh] overflow-y-auto bg-background text-text-primary shadow-2xl">
          <OGDialogTitle>
            {selectedMentor?.mentor_name} - All Responses
          </OGDialogTitle>
          
          {selectedMentor && (
            <div className="space-y-6">
              {/* Mentor Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedMentor.mentor_name}</h3>
                <p className="text-gray-600">{selectedMentor.mentor_email}</p>
              </div>
              
              {/* All Responses */}
              <div className="space-y-6">
                {selectedMentor.responses.map((response) => (
                  <div key={response._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Question {response.stage_id}
                      </span>
                      <span className={`ml-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded ${
                        response.status === 'submitted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {response.status}
                      </span>
                    </div>
                    
                    {response.preamble && (
                      <div className="mb-3">
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Preamble:</h4>
                        <p className="text-sm italic text-gray-600 bg-gray-50 p-2 rounded">
                          {response.preamble}
                        </p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Question:</h4>
                      <p className="text-sm font-medium">
                        {response.question}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Answer:</h4>
                      <p className="text-sm leading-relaxed bg-blue-50 p-3 rounded">
                        {response.response_text}
                      </p>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Updated: {new Date(response.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </OGDialogContent>
      </OGDialog>
    </div>
  );
} 