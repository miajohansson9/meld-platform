import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { Button } from '~/components/ui';
import { PlusIcon } from 'lucide-react';
import { Spinner } from '~/components/svg';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';
import { useNavigate } from 'react-router-dom';

const fetchMentorQuestions = async () => {
  const res = await fetch('/api/mentor-interest/questions');
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch questions: ${res.status} ${errorText}`);
  }
  return res.json();
};

const addMentorQuestion = async ({ question, pillar, subTags }) => {
  const res = await fetch('/api/mentor-interest/questions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ question, pillar, subTags }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add question: ${res.status} ${errorText}`);
  }
  return res.json();
};

const updateMentorQuestion = async ({ id, question, pillar, subTags }) => {
  const res = await fetch(`/api/mentor-interest/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, pillar, subTags }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update question: ${res.status} ${errorText}`);
  }
  return res.json();
};

export default function MentorQuestionsTable() {
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState('');
  const [newPillar, setNewPillar] = useState('Starting Points to Success');
  const [newSubTags, setNewSubTags] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [updatedQuestionText, setUpdatedQuestionText] = useState('');
  const [updatedPillar, setUpdatedPillar] = useState('');
  const [updatedSubTags, setUpdatedSubTags] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastSelectedPillar, setLastSelectedPillar] = useState('Starting Points to Success');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const navigate = useNavigate();

  const { data: questions = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['mentor-questions'],
    queryFn: fetchMentorQuestions,
    onError: (error: unknown) => {
      console.error('Fetch error:', (error as Error).message);
      setErrorMessage(`Error fetching questions: ${(error as Error).message}`);
    },
  });

  const addMutation = useMutation({
    mutationFn: addMentorQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-questions']);
      setNewQuestion('');
      setNewPillar(lastSelectedPillar);
      setNewSubTags('');
      setErrorMessage('');
    },
    onError: (error: Error) => {
      console.error('Add error:', error.message);
      setErrorMessage(`Failed to add question: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMentorQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries(['mentor-questions']);
      setEditDialogOpen(false);
      setErrorMessage('');
      setLastSelectedPillar(updatedPillar);
    },
    onError: (error: unknown) => {
      console.error('Update error:', (error as Error).message);
      setErrorMessage(`Failed to update question: ${(error as Error).message}`);
    },
  });

  const columns = useMemo(() => [
    {
      accessorKey: 'question',
      header: 'Question',
      meta: { size: '300px' },
    },
    {
      accessorKey: 'pillar',
      header: 'Pillar',
      meta: { size: '150px' },
    },
    {
      accessorKey: 'subTags', // Fixed from subTheme
      header: 'Sub-Theme',
      meta: { size: '150px' },
      cell: ({ getValue }) => (getValue() || []).join(', '), // Added fallback for undefined
    },
  ], []);

  const pillars = [
    'Starting Points to Success',
    'Profile & Presentation',
    'Financial Fluency',
    'The Future of Work',
  ];

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newPillar) {
      setErrorMessage('Please enter a question and select a pillar.');
      return;
    }
    const subTagsArray = newSubTags ? newSubTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    addMutation.mutate({ question: newQuestion, pillar: newPillar, subTags: subTagsArray });
    setLastSelectedPillar(newPillar);
  };

  const handleRowClick = (row) => {
    setEditingQuestion(row);
    setUpdatedQuestionText(row.question);
    setUpdatedPillar(row.pillar);
    setUpdatedSubTags((row.subTags || []).join(', ')); // Fixed from subTheme
    setEditDialogOpen(true);
    setErrorMessage('');
  };

  const handleUpdateQuestion = (e) => {
    e.preventDefault();
    if (!updatedQuestionText.trim() || !updatedPillar || !editingQuestion) {
      setErrorMessage('Please enter a question and select a pillar.');
      return;
    }
    const subTagsArray = updatedSubTags ? updatedSubTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const question = editingQuestion;
    updateMutation.mutate({ 
      id: question._id, 
      question: updatedQuestionText, 
      pillar: updatedPillar, 
      subTags: subTagsArray 
    });
  };

  const renderInput = (id, label, value, onChange, disabled = false, type = 'text') => (
    <div className="mb-4">
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
          placeholder=" "
        />
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
    </div>
  );

  const renderSelect = (id, label, value, onChange, options, disabled = false) => (
    <div className="mb-4">
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
        >
          <option value="" disabled hidden></option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
    </div>
  );

  if (isLoading) return <div>Loading...</div>;
  if (fetchError) return <div>Error: {fetchError.message}</div>;

  return (
    <div className="max-w-full overflow-x-auto p-1">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded bg-red-100 p-2 text-red-700">{errorMessage}</div>
      )}

      {/* Add Question Form */}
      <form onSubmit={handleAddQuestion}>
        <div className="grow-1">
          {renderInput(
            'newQuestion',
            'Add a question... *',
            newQuestion,
            (e) => setNewQuestion(e.target.value),
            addMutation.isLoading,
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderSelect(
            'newPillar',
            'Pillar *',
            newPillar,
            (e) => setNewPillar(e.target.value),
            pillars,
            addMutation.isLoading,
          )}
          <div className="grow">
            {renderInput(
              'newSubTags',
              'Sub-tags (comma-separated, optional)',
              newSubTags,
              (e) => setNewSubTags(e.target.value),
              addMutation.isLoading,
            )}
          </div>
          <Button
            type="submit"
            variant="ghost"
            className="mb-4 self-end p-2"
            disabled={addMutation.isLoading}
          >
            {addMutation.isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <PlusIcon className="size-4 text-gray-500" />
            )}
          </Button>
        </div>
      </form>

      {/* DataTable for Questions */}
      {questions.length === 0 ? (
        <div>No questions found. Add a new question above.</div>
      ) : (
        <DataTable
          columns={columns}
          data={questions}
          showCheckboxes={false}
          onRowClick={handleRowClick}
        />
      )}

      {/* Edit Dialog */}
      {editingQuestion && (
        <OGDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <OGDialogContent className="w-11/12 max-w-md">
            <OGDialogTitle>Edit Question</OGDialogTitle>
            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              {renderInput(
                'updatedQuestion',
                'Question *',
                updatedQuestionText,
                (e) => setUpdatedQuestionText(e.target.value),
                updateMutation.isLoading,
              )}
              {renderSelect(
                'updatedPillar',
                'Pillar *',
                updatedPillar,
                (e) => setUpdatedPillar(e.target.value),
                pillars,
                updateMutation.isLoading,
              )}
              {renderInput(
                'updatedSubTags',
                'Sub-tags (comma-separated, optional)',
                updatedSubTags,
                (e) => setUpdatedSubTags(e.target.value),
                updateMutation.isLoading,
              )}
              <Button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  'Update Question'
                )}
              </Button>
            </form>
          </OGDialogContent>
        </OGDialog>
      )}

      {submitStatus === 'error' && (
        <div className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}