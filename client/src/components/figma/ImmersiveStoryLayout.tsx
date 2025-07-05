import React, { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Button } from '../ui/Button';

export function ImmersiveStoryLayout() {
  const [signupCode, setSignupCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSignUp = () => {
    window.location.href = '/register';
  };

  const handleCodeSubmit = async () => {
    if (!signupCode.trim()) return;
    
    setIsValidating(true);
    setValidationError('');
    
    try {
      const response = await fetch('/api/auth/validate-signup-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signupCode: signupCode.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store code in cookies for register page (expires in 24 hours)
        document.cookie = `meld_signup_code=${signupCode}; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/register';
      } else {
        setValidationError(data.message || 'Invalid signup code');
      }
    } catch (error) {
      setValidationError('Unable to validate code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const scrollToNext = () => {
    const nextSection = document.getElementById('story-section');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-meld-canvas">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 welcome-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6 welcome-hero-gradient">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6 welcome-text-reveal">
            <h1 className="font-serif text-5xl lg:text-6xl text-meld-ink leading-tight welcome-section-title p-2">
              You're here because something is shifting
            </h1>
            <p className="text-xl lg:text-2xl text-meld-ink/80 leading-relaxed max-w-3xl mx-auto">
              High-potential women aren't short on ambition—they're short on clarity. 
              In a world full of noise and possibility, what's missing is a way to make sense of it all.
            </p>
          </div>
          
          <div className="pt-8 welcome-scroll-indicator">
            <button
              onClick={scrollToNext}
              className="inline-flex items-center gap-2 text-meld-sage hover:text-meld-ink transition-colors group"
            >
              <span className="text-lg">Let's figure out what's next</span>
              <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform welcome-arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story-section" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-32">
          
          {/* Cultural Context */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center welcome-section-spacing">
            <div className="space-y-6 welcome-animate-left">
              <h2 className="font-serif text-3xl lg:text-4xl text-meld-ink">
                We live in a fragmented world
              </h2>
              <div className="space-y-4 text-lg text-meld-ink/80 leading-relaxed">
                <p>
                  The future feels increasingly uncertain and hard to plan for. Career paths are no longer linear, 
                  and traditional definitions of success feel disconnected from personal meaning.
                </p>
                <p>
                  You're navigating constant change, ambiguous career paths, and a deep sense of disconnection. 
                  You don't just need productivity tools—you need structure for meaning-making.
                </p>
              </div>
            </div>
            <div className="flex justify-center welcome-animate-right">
              <img 
                src="/assets/Fragment.png" 
                alt="Fragments of experience" 
                className="w-full max-w-md rounded-2xl shadow-2xl welcome-image welcome-image-parallax"
              />
            </div>
          </div>

          {/* The MELD Method */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center welcome-section-spacing">
            <div className="order-2 lg:order-1 flex justify-center welcome-animate-left">
              <img 
                src="/assets/North_Star.png" 
                alt="North Star direction" 
                className="w-full max-w-md rounded-2xl shadow-2xl welcome-image welcome-image-parallax"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6 welcome-animate-right">
              <h2 className="font-serif text-3xl lg:text-4xl text-meld-ink welcome-section-title">
                Turn fragments into direction
              </h2>
              <div className="space-y-4 text-lg text-meld-ink/80 leading-relaxed">
                <p>
                  MELD gives women the structure to catch the fragments, weave them into a coherent personal story, 
                  and point that story toward a meaningful north star.
                </p>
                <p>
                  We help you ground your ambition in truth, act with intention, and find purpose in every step forward.
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Thinking Partner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center welcome-section-spacing">
            <div className="space-y-6 welcome-animate-left">
              <h2 className="font-serif text-3xl lg:text-4xl text-meld-ink welcome-section-title">
                A strategic thinking partner
              </h2>
              <div className="space-y-4 text-lg text-meld-ink/80 leading-relaxed">
                <p>
                  This is not an AI assistant. It's a strategic thinking partner. A compass, not a calendar.
                </p>
                <p>
                  MELD should feel like a trusted guide—human, warm, and grounding. A tool that listens before it speaks, 
                  mirroring the feeling of being mentored: calm, supportive, and insightful.
                </p>
              </div>
            </div>
            <div className="flex justify-center welcome-animate-right">
              <img 
                src="/assets/Mentor_Chat.png" 
                alt="Mentor conversation" 
                className="w-full max-w-md rounded-2xl shadow-2xl welcome-image welcome-image-parallax"
              />
            </div>
          </div>

          {/* Archive & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center welcome-section-spacing">
            <div className="order-2 lg:order-1 flex justify-center welcome-animate-left">
              <img 
                src="/assets/Wins_Vault.png" 
                alt="Personal archive and wins" 
                className="w-full max-w-md rounded-2xl shadow-2xl welcome-image welcome-image-parallax"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6 welcome-animate-right">
              <h2 className="font-serif text-3xl lg:text-4xl text-meld-ink welcome-section-title">
                Your personal archive
              </h2>
              <div className="space-y-4 text-lg text-meld-ink/80 leading-relaxed">
                <p>
                  Rather than scattering your insights across random Notes apps, begin capturing fragments of your story, 
                  challenges, and reflections here—in a platform built to hold them.
                </p>
                <p>
                  We help make sense of your experiences and ultimately shape them into direction. 
                  A place to process complexity, map direction, and take action anchored in self-knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Audience Definition Section */}
          <div className="bg-gradient-to-br from-meld-sage/40 via-meld-cream/60 to-meld-canvas rounded-3xl p-16 text-center space-y-12 welcome-animate-in welcome-content-elevation border border-meld-rose/30">
            <div className="space-y-6">
              <h2 className="font-serif text-4xl lg:text-5xl text-meld-ink leading-tight welcome-section-title">
                For women who want to lead with intention
              </h2>
            </div>

            {/* Audience Cards Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Positive Attributes Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-meld-sage hover:border-meld-sage transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-meld-sage/20 rounded-full flex items-center justify-center">
                      <span className="w-3 h-3 bg-meld-sage rounded-full"></span>
                    </div>
                    <h3 className="font-serif text-xl text-meld-ink">You're here because...</h3>
                  </div>
                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-sage rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">You're navigating a moment of change</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-sage rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">You're ambitious but need clarity</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-sage rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">You want to lead with meaning, not just succeed</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pain Points Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-meld-rust/20 hover:border-meld-rust/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-meld-rust/20 rounded-full flex items-center justify-center">
                      <span className="w-3 h-3 bg-meld-rust rounded-full"></span>
                    </div>
                    <h3 className="font-serif text-xl text-meld-ink">You've been failed by...</h3>
                  </div>
                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-rust rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">Sterile goal-setting tools</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-rust rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">Superficial "mentorship" programs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-meld-rust rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-meld-ink/80">Productivity-focused solutions that miss meaning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dedicated CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-meld-charcoal via-meld-steel to-meld-charcoal relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, #BFCDB1 0%, transparent 50%), radial-gradient(circle at 70% 60%, #BD3C28 0%, transparent 50%)`
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10 welcome-animate-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-meld-sage/20 text-meld-sage px-6 py-3 rounded-full text-sm font-medium uppercase tracking-wider border border-meld-sage/30">
              <span className="w-2 h-2 bg-meld-sage rounded-full"></span>
              Ready to Begin?
            </div>
            <div className="space-y-4">
              <h2 className="font-serif text-4xl lg:text-5xl text-white leading-tight">
                Find your direction with MELD
              </h2>
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                Join our pilot program and be among the first to experience a strategic thinking partner 
                built specifically for high-potential women.
              </p>
            </div>
            
            {/* Signup Code Entry */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <label htmlFor="signup-code" className="block text-white/90 text-sm font-medium">
                  Enter your pilot access code
                </label>
                <input
                  id="signup-code"
                  type="text"
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value.toUpperCase())}
                  placeholder="PILOT-XXXX"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-meld-sage focus:border-transparent backdrop-blur-sm"
                  disabled={isValidating}
                />
                {validationError && (
                  <p className="text-red-500 text-sm mt-2">{validationError}</p>
                )}
              </div>
              
              <Button
                onClick={handleCodeSubmit}
                disabled={!signupCode.trim() || isValidating}
                size="lg"
                className="w-full bg-gradient-to-r from-meld-sage to-meld-sage/90 hover:from-meld-sage/90 hover:to-meld-sage text-white px-16 py-4 text-xl font-medium rounded-xl border-2 border-meld-sage/30 hover:border-meld-sage/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isValidating ? 'Validating...' : 'Access MELD'}
              </Button>
              
              <p className="text-white/60 text-sm text-center">
                Don't have a code? <a href="mailto:connect@meldmore.com" className="text-meld-sage hover:text-white transition-colors">Request access</a>
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-8 text-white/70">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-meld-sage rounded-full"></span>
                <span className="text-sm">Fragment capture & reflection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-meld-sage rounded-full"></span>
                <span className="text-sm">North-Star goal mapping</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-meld-sage rounded-full"></span>
                <span className="text-sm">Strategic thinking partner</span>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-8 border-t border-white/20">
              <p className="text-white/60 text-sm">
                Built from 2 years of workshops with women • Hundreds of high-performance women's input
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 welcome-footer">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/assets/logo-b.svg" alt="MELD" className="h-6 w-auto" />
            </div>
            <p className="text-sm text-meld-ink/60 text-center md:text-right">
              © 2025 MELD. A strategic thinking partner for high-potential women.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ImmersiveStoryLayout; 