import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mentorInterestSchema } from '~/validation/mentorInterest';

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Non-Profit',
  'Marketing',
  'Other',
] as const;

const careerStages = [
  'Early-career (0-5 years)',
  'Mid-career (5-15 years)',
  'Senior-career (15+ years)',
] as const;

const pillars = [
  'Starting Points to Success',
  'Profile & Presentation',
  'Financial Fluency',
  'The Future of Work',
] as const;

type FormData = z.infer<typeof mentorInterestSchema>;

export default function MentorInterestForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'success' | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mentorInterestSchema),
    defaultValues: {
      pillars: [],
      consent: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch('/api/mentor-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    id: keyof FormData,
    label: string,
    type: string = 'text',
    validation?: object,
    extraProps: any = {},
  ) => (
    <div className="mb-4">
      <div className="relative">
        <input
          id={id}
          type={type}
          aria-label={label}
          {...register(id)}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
          placeholder=" "
          {...extraProps}
        />
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-text-primary">Mentor Interest Form</h1>
      {submitStatus === 'success' ? (
        <div className="rounded-md border border-green-500 bg-green-500/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-200" role="alert">
          Thank you for your interest! We will analyze your submission and get back to you soon with personalized questions to answer.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6" aria-label="Mentor Interest Form" method="POST">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput('firstName', 'First Name *')}
            {renderInput('lastName', 'Last Name')}
          </div>
          {renderInput('email', 'Email *', 'email')}
          {renderInput('jobTitle', 'Job Title *')}
          {renderInput('company', 'Company')}
          <div className="mb-4">
            <div className="relative">
              <select
                id="industry"
                {...register('industry')}
                aria-invalid={!!errors['industry']}
                className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled hidden></option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <label
                htmlFor="industry"
                className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
              >
                Industry *
              </label>
            </div>
            {errors['industry'] && (
              <span role="alert" className="mt-1 text-sm text-red-500">
                {String(errors['industry']?.message) ?? ''}
              </span>
            )}
          </div>
          <div className="mb-4">
            <div className="relative">
              <select
                id="careerStage"
                {...register('careerStage')}
                aria-invalid={!!errors['careerStage']}
                className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled hidden></option>
                {careerStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <label
                htmlFor="careerStage"
                className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
              >
                Career Stage *
              </label>
            </div>
            {errors['careerStage'] && (
              <span role="alert" className="mt-1 text-sm text-red-500">
                {String(errors['careerStage']?.message) ?? ''}
              </span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-text-primary mb-2">Pillars of Interest *</label>
            <div className="space-y-2">
              {pillars.map((pillar) => (
                <label key={pillar} className="flex items-center text-text-primary">
                  <input
                    type="checkbox"
                    value={pillar}
                    {...register('pillars')}
                    className="h-4 w-4 rounded border-border-light text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2">{pillar}</span>
                </label>
              ))}
            </div>
            {errors['pillars'] && (
              <span role="alert" className="mt-1 text-sm text-red-500">
                {String(errors['pillars']?.message) ?? ''}
              </span>
            )}
          </div>
          <div className="mb-4">
            <div className="relative">
              <textarea
                id="comments"
                {...register('comments')}
                rows={3}
                className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
                placeholder=" "
              />
              <label
                htmlFor="comments"
                className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
              >
                What's one thing you're working on, and one thing you're working through?
              </label>
            </div>
            {errors['comments'] && (
              <span role="alert" className="mt-1 text-sm text-red-500">
                {String(errors['comments']?.message) ?? ''}
              </span>
            )}
          </div>
          <div className="flex items-start mb-4">
            <div className="flex h-5 items-center">
              <input
                id="consent"
                type="checkbox"
                {...register('consent')}
                className="h-4 w-4 rounded border-border-light text-green-600 focus:ring-green-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-text-primary">
                I consent to being contacted about mentoring opportunities *
              </label>
              {errors['consent'] && (
                <span role="alert" className="mt-1 text-sm text-red-500">
                  {String(errors['consent']?.message) ?? ''}
                </span>
              )}
            </div>
          </div>
          {submitStatus === 'error' && (
            <div className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
              There was an error submitting your form. Please try again.
            </div>
          )}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 