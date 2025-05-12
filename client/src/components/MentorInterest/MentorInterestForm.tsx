import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mentorInterestSchema } from '~/validation/mentorInterest';

const industries = [
  'Consulting',
  'Consumer Goods',
  'Education',
  'Fashion & Beauty',
  'Finance',
  'Government & Public Sector',
  'Healthcare',
  'Hospitality & Tourism',
  'Human Resources',
  'Legal',
  'Manufacturing',
  'Marketing',
  'Media & Entertainment',
  'Non-Profit',
  'Real Estate',
  'Retail & E-commerce',
  'Science & Research',
  'Sustainability & Environment',
  'Technology',
  'Transportation & Logistics',
  'Other',
] as const;

const careerStages = [
  'Early-career (0-5 years)',
  'Mid-career (5-15 years)',
  'Senior-career (15+ years)',
  'Career Change / Transition',
  'Retired',
] as const;

type FormData = z.infer<typeof mentorInterestSchema>;

export default function MentorInterestForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [submissionId, setSubmissionId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mentorInterestSchema),
    defaultValues: {},
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
      const result = await response.json();
      setSubmissionId(result._id);
      setSubmitStatus('success');
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitStatus !== 'success') return;
    navigate(`/${submissionId}/mentor-interview/start`);
  }, [submitStatus, submissionId, navigate]);

  const renderInput = (
    id: keyof FormData,
    label: string,
    type: string = 'text',
    extraProps: any = {},
  ) => (
    <div className="mb-4" key={id}>
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
    <div className="mx-auto max-w-md p-6">
      {submitStatus === 'error' && (
        <div
          className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
          role="alert"
        >
          There was an error submitting your form. Please try again.
        </div>
      )}
      {submitStatus !== 'success' && (
        <form onSubmit={handleSubmit(onSubmit)} aria-label="Mentor Interest Form" method="POST">
          {renderInput('firstName', 'First Name *')}
          {renderInput('lastName', 'Last Name')}
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
                <option value="" disabled hidden />
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
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
                <option value="" disabled hidden />
                {careerStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
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
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#B04A2F] py-3 text-lg text-white transition hover:bg-[#8a3a23]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
