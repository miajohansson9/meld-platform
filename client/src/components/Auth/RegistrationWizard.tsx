import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useRegisterUserMutation } from 'librechat-data-provider/react-query';
import type { TRegisterUser, TError } from 'librechat-data-provider';
import { Button } from '../ui/Button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

// Utility function to get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

interface RegistrationData extends TRegisterUser {
  city?: string;
  state?: string;
  birthday?: string;
  whyHere?: string;
  lifeArena?: string;
  identitySegment?: string;
  mentorTone?: string[];
  currentBlock?: string;
  confirm_password?: string;
}

const whyHereOptions = [
  { id: 'goal', label: 'Setting a goal' },
  { id: 'transition', label: 'Navigating a transition' },
  { id: 'idea', label: 'Making sense of an idea' },
  { id: 'fresh-start', label: 'I need a fresh start' },
  { id: 'unsure', label: 'Not sure yet' },
];

const lifeArenaOptions = [
  { id: 'career', label: 'Career direction' },
  { id: 'growth', label: 'Personal growth & confidence' },
  { id: 'rhythm', label: 'Work-life rhythm' },
  { id: 'relationships', label: 'Networking & relationships' },
  { id: 'leadership', label: 'Leadership influence' },
  { id: 'other', label: 'Other', hasText: true },
];

const identityOptions = [
  { id: 'gen-z', label: 'Just starting my career (Gen Z)' },
  { id: 'corporate', label: 'Corporate climber' },
  { id: 'mission', label: 'Mission-driven builder' },
  { id: 'creative', label: 'Creative (arts / media)' },
  { id: 'stem', label: 'STEM problem-solver' },
  { id: 'other', label: 'Other', hasText: true },
];

const blockOptions = [
  { id: 'start', label: 'Not sure where to start' },
  { id: 'burnout', label: 'Burnout / stress' },
  { id: 'doubt', label: 'Self-doubt' },
  { id: 'time', label: 'Time constraints' },
  { id: 'comparison', label: 'Comparing myself to others' },
  { id: 'change', label: 'Job or role change' },
  { id: 'other', label: 'Other', hasText: true },
];

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function RegistrationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedWhyHere, setSelectedWhyHere] = useState<string[]>([]);
  const [selectedArena, setSelectedArena] = useState<string[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string[]>([]);
  const [arenaOtherText, setArenaOtherText] = useState<string>('');
  const [identityOtherText, setIdentityOtherText] = useState<string>('');
  const [blockOtherText, setBlockOtherText] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [showStateDropdown, setShowStateDropdown] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  
  // Access code protection
  const [hasAccessCode, setHasAccessCode] = useState<boolean>(false);
  const [accessCode, setAccessCode] = useState<string>('');
  const [showAccessForm, setShowAccessForm] = useState<boolean>(false);

  const stepLabels = [
    'Welcome to MELD!',
    'Personal details',
    'Secure account',
    'What brought you here',
    'Life arena focus',
    'Your identity', 
    'Current blocks'
  ];

  const filteredStates = usStates.filter(state => 
    state.toLowerCase().includes(stateFilter.toLowerCase())
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationData>({ mode: 'onChange' });

  const watchedFields = watch();

  const { setError } = useAuthContext();

  // Check for access code on mount
  useEffect(() => {
    const storedCode = getCookie('meld_signup_code');
    if (storedCode) {
      setHasAccessCode(true);
      setValue('signup_code', storedCode);
    } else {
      // Check sessionStorage as fallback
      const sessionCode = sessionStorage.getItem('meld_signup_code');
      if (sessionCode) {
        setHasAccessCode(true);
        setValue('signup_code', sessionCode);
        sessionStorage.removeItem('meld_signup_code');
      } else {
        setShowAccessForm(true);
      }
    }
  }, [setValue]);

  const registerUser = useRegisterUserMutation({
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      
      // Check if we got token and user data (successful registration with auto-login)
      if (data.token && data.user) {
        // Registration successful with auto-login
        // The backend has already set the refresh token cookie
        // We can either manually set the token or let the auth context handle it
        
        // Option 1: Set the token manually and dispatch the event
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: data.token }));
        
        // Navigate immediately
        navigate('/today?tour=checkin', { replace: true });
      } else {
        // This shouldn't happen with our new backend, but keeping as fallback
        setShowSuccess(true);
        setCountdown(3);
        const timer = setInterval(() => {
          setCountdown((prevCountdown) => {
            if (prevCountdown <= 1) {
              clearInterval(timer);
              navigate('/today?tour=checkin', { replace: true });
              return 0;
            } else {
              return prevCountdown - 1;
            }
          });
        }, 1000);
      }
    },
    onError: (error: unknown) => {
      setIsSubmitting(false);
      if ((error as TError).response?.data?.message) {
        setErrorMessage((error as TError).response?.data?.message ?? '');
      }
    },
  });

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWhyHereSelect = (value: string) => {
    setSelectedWhyHere(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(value);
      if (index > -1) {
        newSelected.splice(index, 1);
      } else {
        newSelected.push(value);
      }
      setValue('whyHere', newSelected.join(','));
      return newSelected;
    });
  };

  const handleArenaSelect = (value: string) => {
    setSelectedArena(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(value);
      if (index > -1) {
        newSelected.splice(index, 1);
      } else {
        newSelected.push(value);
      }
      setValue('lifeArena', newSelected.includes('other') ? arenaOtherText : newSelected.join(','));
      return newSelected;
    });
  };

  const handleIdentitySelect = (value: string) => {
    setSelectedIdentity(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(value);
      if (index > -1) {
        newSelected.splice(index, 1);
      } else {
        newSelected.push(value);
      }
      setValue('identitySegment', newSelected.includes('other') ? identityOtherText : newSelected.join(','));
      return newSelected;
    });
  };

  const handleBlockSelect = (value: string) => {
    setSelectedBlock(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(value);
      if (index > -1) {
        newSelected.splice(index, 1);
      } else {
        newSelected.push(value);
      }
      setValue('currentBlock', newSelected.includes('other') ? blockOtherText : newSelected.join(','));
      return newSelected;
    });
  };

  const handleAccessCodeSubmit = async () => {
    if (!accessCode.trim()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/auth/validate-signup-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signupCode: accessCode.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store code in cookies (expires in 24 hours)
        document.cookie = `meld_signup_code=${accessCode}; path=/; max-age=86400; SameSite=Lax`;
        setValue('signup_code', accessCode);
        setHasAccessCode(true);
        setShowAccessForm(false);
      } else {
        setErrorMessage(data.message || 'Invalid signup code');
      }
    } catch (error) {
      setErrorMessage('Unable to validate code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: RegistrationData) => {
    // Only allow form submission on the final step (step 6)
    if (currentStep !== 6) {
      return;
    }
    
    const submitData = {
      ...data,
      whyHere: selectedWhyHere.join(','),
      lifeArena: selectedArena.join(','),
      identitySegment: selectedIdentity.join(','),
      currentBlock: selectedBlock.join(','),
    };
    registerUser.mutate(submitData);
  };

  // Handle form submission - prevent submission during onboarding, advance to next step instead
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're not on the final step, advance to next step instead of submitting
    if (currentStep < 6) {
      if (getStepValidation()) {
        handleNext();
      }
      return;
    }
    
    // On final step, trigger the actual form submission
    handleSubmit(onSubmit)(e);
  };

  // Handle Enter key press in input fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < 6 && getStepValidation()) {
        handleNext();
      } else if (currentStep === 6 && getStepValidation()) {
        handleSubmit(onSubmit)();
      }
    }
  };

  const getStepValidation = () => {
    switch (currentStep) {
      case 0:
        return watchedFields.name && !errors.name;
      case 1:
        return true; // Personal details are optional
      case 2:
        return watchedFields.email && watchedFields.password && watchedFields.confirm_password && !errors.email && !errors.password && !errors.confirm_password;
      case 3:
        return selectedWhyHere.length > 0;
      case 4:
        return selectedArena.length > 0 && (selectedArena.every(id => id !== 'other') || arenaOtherText.trim());
      case 5:
        return selectedIdentity.length > 0 && (selectedIdentity.every(id => id !== 'other') || identityOtherText.trim());
      case 6:
        return selectedBlock.length > 0;
      default:
        return true;
    }
  };

  const getCurrentStepErrors = () => {
    switch (currentStep) {
      case 0:
        return errors.name ? [errors.name.message].filter(Boolean) : [];
      case 2:
        const step2Errors: string[] = [];
        if (errors.email?.message) step2Errors.push(errors.email.message);
        if (errors.password?.message) step2Errors.push(errors.password.message);
        if (errors.confirm_password?.message) step2Errors.push(errors.confirm_password.message);
        return step2Errors;
      default:
        return [];
    }
  };

  const currentStepErrors = getCurrentStepErrors();

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center space-y-6 bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-meld-sage/20 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-meld-sage" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-meld-ink mb-2">Welcome to MELD!</h2>
            <p className="text-meld-ink/70">
              Starting your strategic thinking journey in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show access code form if user doesn't have valid code
  if (showAccessForm) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-meld-ink">Access Code Required</h2>
            <p className="text-meld-ink/70">
              You need a pilot access code to join MELD. Enter your code below to continue with registration.
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="PILOT-XXXX"
              className="w-full px-4 py-3 border border-meld-graysmoke rounded-xl text-center text-meld-ink placeholder-meld-ink/50 focus:outline-none focus:ring-2 focus:ring-meld-sage focus:border-meld-sage transition-colors"
              autoFocus
            />
            
            <Button
              onClick={handleAccessCodeSubmit}
              disabled={!accessCode.trim() || isSubmitting}
              size="lg"
              className="w-full bg-meld-sage hover:bg-meld-sage/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Validating...' : 'Continue to Registration'}
            </Button>
            
            {errorMessage && (
              <p className="text-red-500 text-sm text-center">{errorMessage}</p>
            )}
          </div>
          
          <div className="pt-4 border-t border-meld-graysmoke/30">
            <p className="text-sm text-meld-ink/60">
              Don't have a code?{' '}
              <a 
                href="mailto:connect@meldmore.com" 
                className="text-meld-sage hover:text-meld-ink transition-colors underline"
              >
                request access
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean Progress Indicator */}
      <div className="flex flex-col items-center mb-10 space-y-4">
        {/* Simple Step Counter */}
        <div className="text-center">
          <span className="text-sm text-meld-ink/60 font-medium">
            Step {currentStep + 1} of 7
          </span>
          <h3 className="text-lg font-serif text-meld-ink mt-1">
            {stepLabels[currentStep]}
          </h3>
        </div>

        {/* Minimal Progress Bar */}
        <div className="relative w-full max-w-md">
          {/* Background track */}
          <div className="h-1 bg-meld-graysmoke/30 rounded-full"></div>
          
          {/* Progress fill */}
          <div 
            className="absolute top-0 left-0 h-1 bg-meld-sage rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
          ></div>
          
          {/* Simple step dots */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center -mt-0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  step <= currentStep 
                    ? 'bg-meld-sage' 
                    : 'bg-meld-graysmoke/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Step 0: Your name */}
          {currentStep === 0 && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-serif text-meld-ink mb-4">
                  What should I call you?
                </h2>
                <p className="text-meld-ink/70 mb-8">
                  Let's start with the basics
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-0 py-4 text-xl text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {/* Step 1: Personal details */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-serif text-meld-ink mb-4">
                  Nice to meet you, {watchedFields.name}
                </h2>
                <p className="text-meld-ink/70 mb-8">
                  This helps us match you to opportunities in your city and gives me more context for our conversations
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                <input
                  {...register('city')}
                  type="text"
                  placeholder="Your city"
                  className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                  onKeyDown={handleKeyDown}
                />

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Your state"
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(e.target.value);
                      setValue('state', e.target.value);
                      setShowStateDropdown(true);
                    }}
                    onFocus={() => setShowStateDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                    onKeyDown={handleKeyDown}
                  />
                  
                  {showStateDropdown && filteredStates.length > 0 && stateFilter && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-meld-sage/20 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                      {filteredStates.slice(0, 5).map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => {
                            setStateFilter(state);
                            setValue('state', state);
                            setShowStateDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-meld-sage/10 transition-colors"
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  {...register('birthday')}
                  type="date"
                  className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink transition-colors wizard-input-focus"
                  onKeyDown={handleKeyDown}
                />
                
                <p className="text-xs text-meld-ink/50 text-center max-w-xs mx-auto">
                  Helps me keep your reflections in the right time zone & celebrate you.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-meld-ink mb-2">
                  Let's secure your account
                </h2>
                <p className="text-meld-ink/70">
                  Just need your email and password
                </p>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Please enter a valid email'
                      }
                    })}
                    type="email"
                    placeholder="Email address"
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div>
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    type="password"
                    placeholder="Create a password"
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div>
                  <input
                    {...register('confirm_password', { 
                      required: 'Please confirm your password',
                      validate: (value) => value === watchedFields.password || 'Passwords do not match'
                    })}
                    type="password"
                    placeholder="Confirm password"
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {/* Hidden signup code field */}
                <input
                  {...register('signup_code')}
                  type="hidden"
                />
              </div>
            </div>
          )}

          {/* Step 3: Why you're here */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-meld-ink mb-2">What brought you here today?</h2>
                <p className="text-meld-ink/70">Select all that apply</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {whyHereOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleWhyHereSelect(option.id)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedWhyHere.includes(option.id)
                        ? 'border-meld-sage bg-meld-sage/10 text-meld-ink'
                        : 'border-meld-graysmoke hover:border-meld-sage/50 text-meld-ink/80 hover:bg-meld-sage/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Life arena focus */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-meld-ink mb-2">Which life arena feels most urgent?</h2>
                <p className="text-meld-ink/70">Select all that apply</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {lifeArenaOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleArenaSelect(option.id)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedArena.includes(option.id)
                        ? 'border-meld-sage bg-meld-sage/10 text-meld-ink'
                        : 'border-meld-graysmoke hover:border-meld-sage/50 text-meld-ink/80 hover:bg-meld-sage/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedArena.includes('other') && (
                <div className="max-w-md mx-auto mt-4">
                  <input
                    type="text"
                    placeholder="Specify your focus area"
                    value={arenaOtherText}
                    onChange={(e) => setArenaOtherText(e.target.value)}
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Your Identity */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-meld-ink mb-2">What's your identity?</h2>
                <p className="text-meld-ink/70">Select all that apply</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {identityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleIdentitySelect(option.id)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedIdentity.includes(option.id)
                        ? 'border-meld-sage bg-meld-sage/10 text-meld-ink'
                        : 'border-meld-graysmoke hover:border-meld-sage/50 text-meld-ink/80 hover:bg-meld-sage/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedIdentity.includes('other') && (
                <div className="max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="Specify your identity"
                    value={identityOtherText}
                    onChange={(e) => setIdentityOtherText(e.target.value)}
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 6: What's blocking you */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-meld-ink mb-2">What's currently blocking you?</h2>
                <p className="text-meld-ink/70">Select all that apply</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {blockOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleBlockSelect(option.id)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedBlock.includes(option.id)
                        ? 'border-meld-sage bg-meld-sage/10 text-meld-ink'
                        : 'border-meld-graysmoke hover:border-meld-sage/50 text-meld-ink/80 hover:bg-meld-sage/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedBlock.includes('other') && (
                <div className="max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="Specify what's blocking you"
                    value={blockOtherText}
                    onChange={(e) => setBlockOtherText(e.target.value)}
                    className="w-full px-0 py-4 text-lg text-center bg-transparent border-0 border-b-2 border-meld-sage/30 focus:border-meld-sage focus:outline-none text-meld-ink placeholder-meld-ink/50 transition-colors wizard-input-focus"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {(errorMessage || currentStepErrors.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {errorMessage && <div>{errorMessage}</div>}
              {currentStepErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            {currentStep > 0 ? (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="outline"
                className="flex items-center gap-2 border-meld-graysmoke text-meld-ink/70"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < 6 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!getStepValidation()}
                className="flex items-center gap-2 bg-meld-charcoal hover:bg-meld-charcoal/90 text-meld-canvas disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || !getStepValidation()}
                className="bg-meld-charcoal hover:bg-meld-charcoal/90 text-meld-canvas px-8"
              >
                {isSubmitting ? 'Welcome to Meld...' : 'Start my Meld Journey'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}