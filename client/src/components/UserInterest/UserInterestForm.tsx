/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userInterestSchema } from '~/validation/userInterest';

export const currentSituations = [
  'In college',
  'Recently graduated / job searching',
  'Currently working',
  'Taking a break',
  'Other',
] as const;

export const referralSources = [
  'TikTok',
  'In person dinner',
  'In person event',
  'Referred by Katie',
  'Substack',
  'A friend',
  'Other',
] as const;

export const activelyApplyingOptions = [
  'Yes',
  'No, just exploring options',
] as const;

type FormData = z.infer<typeof userInterestSchema>;

export default function UserInterestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'error' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showOtherReferral, setShowOtherReferral] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userInterestSchema),
    defaultValues: {},
  });

  const watchCurrentSituation = watch('currentSituation');
  const watchReferralSource = watch('referralSource');

  React.useEffect(() => {
    setShowOtherReferral(watchReferralSource === 'Other');
  }, [watchReferralSource]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch('/api/user-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      
      const result = await response.json();
      
      // Show thank you page
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    id: keyof FormData,
    label: string,
    type: string = 'text',
    extraProps: any = {},
  ) => (
    <div className="mb-6" key={id}>
      <div className="relative">
        <input
          id={id}
          type={type}
          aria-label={label}
          {...register(id)}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles transition-all duration-200 peer w-full rounded-2xl border border-gray-300 bg-white px-4 pb-3 pt-4 text-gray-900 text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white shadow-sm"
          placeholder=" "
          {...extraProps}
        />
        <label
          htmlFor={id}
          className="absolute start-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm font-medium text-gray-700 duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  const renderTextarea = (
    id: keyof FormData,
    label: string,
    extraProps: any = {},
  ) => (
    <div className="mb-4" key={id}>
      <div className="relative">
        <textarea
          id={id}
          aria-label={label}
          {...register(id)}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none min-h-[100px] resize-y"
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
    <div className="flex flex-col items-center justify-center bg-[#F8F4EB] min-h-screen">
      <div className="w-full max-w-4xl bg-[#F8F4EB] p-6 sm:bg-white sm:rounded-2xl sm:shadow-lg sm:p-12 sm:m-12">
        {!isSubmitted ? (
          <>
            {/* Error Banner */}
            {submitStatus === 'error' && (
              <div
                className="mb-4 rounded-md border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
                role="alert"
              >
                There was an error submitting your form. Please try again.
              </div>
            )}

            {/* Welcome Text */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to MELD</h1>
                              <p className="text-lg leading-relaxed text-gray-600 mb-4">
                  Please tell us a bit about yourself. Your information will be used to help match you to mentorship opportunities.
                </p>
              <p className="text-lg leading-relaxed text-gray-600 mb-4">
              We're excited to meet you! 
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} aria-label="User Interest Form">
              {renderInput('name', 'First and Last Name *')}
              {renderInput('email', 'Email *', 'email')}


                             {/* How did you hear about MELD - Asked for everyone after situation */}
               <div className="mb-6">
                 <div className="relative">
                   <select
                     id="referralSource"
                     {...register('referralSource')}
                     aria-invalid={!!errors.referralSource}
                     className="webkit-dark-styles transition-all duration-200 peer w-full rounded-2xl border border-gray-300 bg-white px-4 pb-3 pt-4 text-gray-900 text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white shadow-sm"
                     defaultValue=""
                   >
                     <option value="" disabled hidden>Select from list</option>
                     {referralSources.map((source) => (
                       <option key={source} value={source}>
                         {source}
                       </option>
                     ))}
                   </select>
                   <label
                     htmlFor="referralSource"
                     className="absolute start-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm font-medium text-gray-700 duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
                   >
                     How did you hear about MELD? *
                   </label>
                 </div>
                 {errors.referralSource && (
                   <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
                     {String(errors.referralSource?.message) ?? ''}
                   </span>
                 )}
               </div>
            
              {/* Current Situation - Always Required */}
              <div className="mb-6">
                <div className="relative">
                  <select
                    id="currentSituation"
                    {...register('currentSituation')}
                    aria-invalid={!!errors.currentSituation}
                    className="webkit-dark-styles transition-all duration-200 peer w-full rounded-2xl border border-gray-300 bg-white px-4 pb-3 pt-4 text-gray-900 text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white shadow-sm"
                    defaultValue=""
                  >
                    <option value="" disabled hidden>Select from list</option>
                    {currentSituations.map((situation) => (
                      <option key={situation} value={situation}>
                        {situation}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="currentSituation"
                    className="absolute start-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm font-medium text-gray-700 duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
                  >
                    Which best describes you? *
                  </label>
                </div>
                {errors.currentSituation && (
                  <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
                    {String(errors.currentSituation?.message) ?? ''}
                  </span>
                )}
              </div>

              {showOtherReferral && renderInput('referralSourceOther', 'Please specify')}

              {/* Conditional Fields Based on Current Situation */}
              {watchCurrentSituation === 'In college' && (
                <div className="mt-8 space-y-6">
                  {renderInput('currentSchool', 'What school are you attending? *')}
                  {renderInput('studyingField', 'What are you studying?')}
                  {renderInput('graduationYear', 'Expected graduation year?')}
                  <div className="mb-6">
                    <label className="flex items-start space-x-4 rounded-xl p-5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('openToStudentMentorship')}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                      />
                      <span className="text-gray-700 text-base leading-relaxed">Would you be open to a student-to-student mentorship program?</span>
                    </label>
                  </div>
                </div>
              )}

              {watchCurrentSituation === 'Currently working' && (
                <div className="mt-8 space-y-6">
                  {renderInput('jobTitle', 'What is your job title? *')}
                  {renderInput('company', 'What company do you work at?')}
                  {renderInput('workCity', 'What city are you based in?')}
                  <div className="mb-6">
                    <label className="flex items-start space-x-4 rounded-xl p-5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('openToMentoring')}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                      />
                      <span className="text-gray-700 text-base leading-relaxed">Would you be open to mentoring a student in your field?</span>
                    </label>
                  </div>
                </div>
              )}

              {watchCurrentSituation === 'Recently graduated / job searching' && (
                <div className="mt-8 space-y-6">
                  {renderInput('studiedField', 'What did you study? *')}
                  {renderInput('currentCity', 'What city are you currently living in?')}
                  <div className="mb-6">
                    <div className="relative">
                                              <select
                          id="activelyApplying"
                          {...register('activelyApplying')}
                          aria-invalid={!!errors.activelyApplying}
                          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-gray-300 bg-white px-4 pb-3 pt-4 text-gray-900 text-lg duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white shadow-sm"
                          defaultValue=""
                        >
                        <option value="" disabled hidden>Select from list</option>
                        {activelyApplyingOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor="activelyApplying"
                        className="absolute start-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm font-medium text-gray-700 duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
                      >
                        Are you actively applying to jobs?
                      </label>
                    </div>
                    {errors.activelyApplying && (
                      <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
                        {String(errors.activelyApplying?.message) ?? ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(watchCurrentSituation === 'Taking a break' || watchCurrentSituation === 'Other') && (
                <div className="mt-8 space-y-6">
                  <div className="mb-6">
                    <label htmlFor="currentFocus" className="block text-sm font-medium text-gray-700 mb-3">
                      What best describes your focus right now?
                    </label>
                                         <textarea
                       id="currentFocus"
                       {...register('currentFocus')}
                       aria-invalid={!!errors.currentFocus}
                       className="webkit-dark-styles transition-color w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-gray-900 text-lg duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white min-h-[120px] resize-y shadow-sm"
                       placeholder=" "
                     />
                    {errors.currentFocus && (
                      <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
                        {String(errors.currentFocus?.message) ?? ''}
                      </span>
                    )}
                  </div>
                  {renderInput('currentCity', 'City and state you are currently based in?')}
                </div>
              )}

              {/* Motivation field with label at top */}
              {watchCurrentSituation && (
                <div className="mt-10 mb-8">
                  <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-3">
                    What do you want to get out of MELD? *
                  </label>
                  <textarea
                    id="motivation"
                    {...register('motivation')}
                    aria-invalid={!!errors.motivation}
                    className="webkit-dark-styles transition-color w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-gray-900 text-lg duration-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white min-h-[120px] resize-y shadow-sm"
                    placeholder=" "
                  />
                  {errors.motivation && (
                    <span role="alert" className="mt-2 text-sm text-red-600 font-medium">
                      {String(errors.motivation?.message) ?? ''}
                    </span>
                  )}
                </div>
              )}



              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#B04A2F] py-4 text-xl font-semibold text-white transition-all duration-200 hover:bg-[#8a3a23] hover:shadow-lg disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#B04A2F]/30"
              >
                {isSubmitting ? 'Submitting…' : 'JOIN MELD'}
              </button>
            </form>
          </>
        ) : (
          <div className="mx-auto max-w-prose text-center shadow-sm">
            <div className="mx-auto max-w-prose rounded-lg border border-green-200 bg-[#F0F7F3] p-4">
              <div className="mb-4 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B04A2F] text-xl text-white">
                  ✓
                </div>
              </div>
              <h2 className="font-serif mb-2 text-xl text-[#B04A2F]">
                Thanks for signing up! 🎉
              </h2>
              <p className="text-base leading-relaxed text-gray-700">
                We&apos;ve received your information and will be in touch soon at{' '}
                <span className="font-semibold text-black">{submittedEmail}</span>.
                We&apos;re excited to support your journey!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 