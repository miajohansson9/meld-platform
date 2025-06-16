import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
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

    // Sort by creation date (most recent first)
  const sortedResponses = [...responses].sort((a: MentorResponse, b: MentorResponse) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleRowClick = (response: MentorResponse) => {
    // Get all responses for this mentor
    const mentorResponses = responses.filter((r: MentorResponse) => r.mentor_id === response.mentor_id);
    if (mentorResponses.length > 0) {
      setSelectedMentor({
        mentor_id: response.mentor_id,
        mentor_name: response.mentor_name,
        mentor_email: response.mentor_email,
        responses: mentorResponses.sort((a: MentorResponse, b: MentorResponse) =>
          a.stage_id - b.stage_id  // Sort by question number (stage_id) ascending
        ),
      });

      setModalOpen(true);
    }
  };

  if (isLoading) return <div>Loading mentor answers...</div>;
  if (!responses.length) return <div>No mentor answers found.</div>;

  return (
    <div className="w-full max-w-full">
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

      {/* Detailed Modal */}
      <OGDialog open={modalOpen} onOpenChange={setModalOpen}>
        <OGDialogContent className="w-[95vw] h-[95vh] max-w-none max-h-none overflow-y-auto bg-[#F8F4EB] shadow-2xl rounded-lg">
          <OGDialogTitle className="font-serif text-2xl text-[#B04A2F] mb-4">
            {selectedMentor?.mentor_name} - Complete Interview
          </OGDialogTitle>

          {/* Full Conversation View */}
          {selectedMentor && (
            <div className="space-y-6">
              {/* Mentor Info */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="mb-4 flex justify-start">
                  <img src="/assets/logo-b.svg" alt="MELD" className="h-7 w-auto" />
                </div>
                <h3 className="font-serif text-xl text-[#B04A2F] mb-2">{selectedMentor.mentor_name}</h3>
                <hr className="mb-4 w-full border-t-2 border-[#B04A2F]" />
                <p className="text-gray-700">{selectedMentor.mentor_email}</p>
                <p className="text-sm text-gray-600 mt-2">Complete Interview Conversation</p>
              </div>

              {/* All Responses */}
              <div className="space-y-6 pb-8">
                {selectedMentor.responses.map((response) => (
                  <div
                    key={response._id}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="mb-4">
                      <span className="inline-block bg-[#B04A2F] text-white text-xs font-medium px-3 py-1 rounded-full">
                        Question {response.stage_id}
                      </span>
                      <span className={`ml-2 inline-block text-xs font-medium px-3 py-1 rounded-full ${response.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : response.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : response.status === 'interview started'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {response.status}
                      </span>
                    </div>

                    {response.preamble && (
                      <div className="mb-6">
                        <div className="font-serif text-2xl leading-snug text-[#B04A2F] mb-2">
                          {response.preamble}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="text-lg leading-snug text-black whitespace-pre-line">
                        {response.question}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Response:</h4>
                      <div className="bg-[#F8F4EB] p-4 rounded-lg border-l-4 border-[#B04A2F]">
                        <p className="text-base leading-relaxed text-gray-800 whitespace-pre-line">
                          {response.response_text}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
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