// src/components/MentorQuestionsTable.tsx
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '~/components/ui/DataTable';
import { Button } from '~/components/ui';
import { PlusIcon } from 'lucide-react';
import { Spinner } from '~/components/svg';
import { OGDialog, OGDialogContent, OGDialogTitle } from '~/components/ui/OriginalDialog';
import { useAuthContext } from '~/hooks/AuthContext';

interface MentorQuestion {
  _id: string;
  question: string;
  pillar: string;
  subTags: string[];
}

export default function MentorQuestionsTable() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  // Form & dialog state
  const [newQuestion, setNewQuestion] = useState('');
  const [newPillar, setNewPillar] = useState('Starting Points to Success');
  const [newSubTags, setNewSubTags] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastSelectedPillar, setLastSelectedPillar] = useState('Starting Points to Success');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MentorQuestion | null>(null);
  const [updatedQuestionText, setUpdatedQuestionText] = useState('');
  const [updatedPillar, setUpdatedPillar] = useState('');
  const [updatedSubTags, setUpdatedSubTags] = useState('');

  // Helper rendering functions
  const renderInput = (
    id: string,
    label: string,
    value: string,
    onChange: React.ChangeEventHandler<HTMLInputElement>,
    disabled = false,
    type: string = 'text',
  ) => (
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
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500"
        >
          {label}
        </label>
      </div>
    </div>
  );

  const renderSelect = (
    id: string,
    label: string,
    value: string,
    onChange: React.ChangeEventHandler<HTMLSelectElement>,
    options: string[],
    disabled = false,
  ) => (
    <div className="mb-4">
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
        >
          <option value="" disabled hidden />
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500"
        >
          {label}
        </label>
      </div>
    </div>
  );

  // API calls with Authorization header
  const fetchMentorQuestions = async (): Promise<MentorQuestion[]> => {
    const res = await fetch('/api/mentor-interest/questions', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch questions: ${res.status} ${text}`);
    }
    return res.json();
  };

  const addMutation = useMutation(
    async (payload: { question: string; pillar: string; subTags: string[] }) => {
      const res = await fetch('/api/mentor-interest/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to add question: ${res.status} ${text}`);
      }
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-questions']);
        setNewQuestion('');
        setNewPillar(lastSelectedPillar);
        setNewSubTags('');
        setErrorMessage('');
      },
      onError: (err: Error) => setErrorMessage(err.message),
    },
  );

  const updateMutation = useMutation(
    async (payload: { id: string; question: string; pillar: string; subTags: string[] }) => {
      const res = await fetch(`/api/mentor-interest/questions/${payload.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: payload.question,
          pillar: payload.pillar,
          subTags: payload.subTags,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update question: ${res.status} ${text}`);
      }
      return res.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mentor-questions']);
        setEditDialogOpen(false);
        setErrorMessage('');
        setLastSelectedPillar(updatedPillar);
      },
      onError: (err: Error) => setErrorMessage(err.message),
    },
  );

  // Load questions
  const {
    data: questions = [],
    isLoading,
    error: fetchError,
  } = useQuery<MentorQuestion[], Error>(['mentor-questions'], fetchMentorQuestions, {
    onError: (err) => setErrorMessage(err.message),
  });

  const pillars = [
    'Starting Points to Success',
    'Profile & Presentation',
    'Financial Fluency',
    'The Future of Work',
  ];

  // Handlers
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      setErrorMessage('Please enter a question.');
      return;
    }
    const tags = newSubTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    addMutation.mutate({ question: newQuestion, pillar: newPillar, subTags: tags });
  };

  const handleRowClick = (row: MentorQuestion) => {
    setEditingQuestion(row);
    setUpdatedQuestionText(row.question);
    setUpdatedPillar(row.pillar);
    setUpdatedSubTags((row.subTags || []).join(', '));
    setEditDialogOpen(true);
    setErrorMessage('');
  };

  const handleUpdateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    const tags = updatedSubTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    updateMutation.mutate({
      id: editingQuestion._id,
      question: updatedQuestionText,
      pillar: updatedPillar,
      subTags: tags,
    });
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'question', header: 'Question' },
      { accessorKey: 'pillar', header: 'Pillar' },
      {
        accessorKey: 'subTags',
        header: 'Sub-Theme',
        cell: ({ getValue }) => (getValue() || []).join(', '),
      },
    ],
    [],
  );

  if (isLoading) return <div>Loading...</div>;
  if (fetchError) return <div>Error: {fetchError.message}</div>;

  return (
    <div className="max-w-full overflow-x-auto p-4">
      {errorMessage && (
        <div className="mb-4 rounded bg-red-100 p-2 text-red-700">{errorMessage}</div>
      )}

      <form onSubmit={handleAddQuestion} className="mb-6">
        {renderInput(
          'newQuestion',
          'Question *',
          newQuestion,
          (e) => setNewQuestion(e.currentTarget.value),
          addMutation.isLoading,
        )}
        <div className="flex items-center gap-2">
          {renderSelect(
            'newPillar',
            'Pillar *',
            newPillar,
            (e) => setNewPillar(e.currentTarget.value),
            pillars,
            addMutation.isLoading,
          )}
          <div className="flex-1">
            {renderInput(
              'newSubTags',
              'Sub-tags (comma-separated, optional)',
              newSubTags,
              (e) => setNewSubTags(e.currentTarget.value),
              addMutation.isLoading,
            )}
          </div>
          <Button type="submit" variant="ghost" disabled={addMutation.isLoading}>
            {addMutation.isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <PlusIcon className="size-4" />
            )}
          </Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        data={questions.map((q) => ({ ...q, id: q._id }))}
        showCheckboxes={false}
        onRowClick={handleRowClick}
      />

      {editingQuestion && (
        <OGDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <OGDialogContent className="w-11/12 max-w-md">
            <OGDialogTitle>Edit Question</OGDialogTitle>
            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              {renderInput(
                'updatedQuestion',
                'Question *',
                updatedQuestionText,
                (e) => setUpdatedQuestionText(e.currentTarget.value),
                updateMutation.isLoading,
              )}
              {renderSelect(
                'updatedPillar',
                'Pillar *',
                updatedPillar,
                (e) => setUpdatedPillar(e.currentTarget.value),
                pillars,
                updateMutation.isLoading,
              )}
              {renderInput(
                'updatedSubTags',
                'Sub-tags (comma-separated, optional)',
                updatedSubTags,
                (e) => setUpdatedSubTags(e.currentTarget.value),
                updateMutation.isLoading,
              )}
              <Button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <Spinner className="size-4" /> : 'Update Question'}
              </Button>
            </form>
          </OGDialogContent>
        </OGDialog>
      )}
    </div>
  );
}
