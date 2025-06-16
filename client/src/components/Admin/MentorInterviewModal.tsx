import React from 'react';
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

interface MentorInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMentor: {
    mentor_id: string;
    mentor_name: string;
    mentor_email: string;
    responses: MentorResponse[];
  } | null;
}

export default function MentorInterviewModal({ isOpen, onClose, selectedMentor }: MentorInterviewModalProps) {
  // Defensive check to prevent rendering issues
  if (!isOpen || !selectedMentor) {
    return null;
  }

  return (
    <OGDialog open={isOpen} onOpenChange={onClose}>
      <OGDialogContent className="w-[95vw] max-w-none max-h-[95vh] overflow-y-auto bg-[#F8F4EB] shadow-2xl rounded-lg">
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
  );
} 