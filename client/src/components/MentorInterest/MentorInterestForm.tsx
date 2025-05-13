/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
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
  'Student',
  'Recent Graduate',
  'Early-career (0-5 years)',
  'Mid-career (5-15 years)',
  'Senior-career (15+ years)',
  'Career Change / Transition',
  'Retired',
] as const;

type FormData = z.infer<typeof mentorInterestSchema>;

export default function MentorInterestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
      await response.json();
      setSubmittedEmail(data.email);
      setSubmitStatus('success');
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="flex flex-col items-center justify-center bg-[#F8F4EB] p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg sm:p-8">
        {/* Error Banner */}
        {submitStatus === 'error' && (
          <div
            className="rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
            role="alert"
          >
            There was an error submitting your form. Please try again.
          </div>
        )}

        {/* Form or Success */}
        {submitStatus !== 'success' ? (
          <>
            {/* Welcome Subtext */}
            <p className="mx-auto mb-6 max-w-prose text-base leading-relaxed text-gray-600 dark:text-gray-300">
              Welcome to MELD. We can’t wait to meet you! Your experiences will help shape the
              future success of women on the rise. Thank you for contributing.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} aria-label="Mentor Interest Form">
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
                    aria-invalid={!!errors.industry}
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
                {errors.industry && (
                  <span role="alert" className="mt-1 text-sm text-red-500">
                    {String(errors.industry?.message) ?? ''}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="relative">
                  <select
                    id="careerStage"
                    {...register('careerStage')}
                    aria-invalid={!!errors.careerStage}
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
                {errors.careerStage && (
                  <span role="alert" className="mt-1 text-sm text-red-500">
                    {String(errors.careerStage?.message) ?? ''}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[#B04A2F] py-3 text-lg text-white transition hover:bg-[#8a3a23]"
              >
                {isSubmitting ? 'Submitting…' : 'JOIN MELD'}
              </button>
            </form>
          </>
        ) : (
          <div className="mx-auto max-w-prose text-center shadow-sm">
            <div className="mx-auto max-w-prose rounded-lg border border-green-200 bg-[#F0F7F3] p-6">
              <div className="mb-4 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B04A2F] text-xl text-white">
                  ✓
                </div>
              </div>
              <h2 className="font-serif mb-2 text-xl text-[#B04A2F]">
                You're in — welcome to MELD! 🎉
              </h2>
              <p className="text-base leading-relaxed text-gray-700">
                We will email you at{' '}
                <span className="font-semibold text-black"> miajohansson08@gmail.com </span>
                within 1–2 weeks for your personalized interview.
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-700">
                Thank you for volunteering to share your insights. <b>We're so glad you're here!</b>
              </p>
            </div>
            <p className="mt-4 text-base leading-relaxed text-gray-700">
              Know someone perfect for MELD? Please share the link!
            </p>
            <button
              onClick={handleCopy}
              type="button"
              className="mt-4 w-full rounded-md bg-[#B04A2F] py-3 text-lg text-white transition hover:bg-[#8a3a23]"
            >
              {copied ? 'Copied! 💌' : 'Copy Link 💌 '}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
