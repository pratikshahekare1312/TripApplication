import { ArrowRight, Sparkles, Map, Wallet, Compass, Navigation, Download } from 'lucide-react';

function AboutPage({ onPlanClick }) {
  return (
    <div className="pt-20 min-h-screen bg-brand-bg text-brand-dark animate-fade-in pb-24">
      {/* SECTION 1 — HERO */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-border text-xs font-semibold text-brand-sec mb-8 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-brand-lime" />
          About Our Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-brand-dark mb-6 leading-tight">
          Travel better. Plan smarter.
        </h1>
        <p className="text-lg md:text-xl text-brand-secondary leading-relaxed">
          Your journey should be about discovering new places, not spending hours figuring out how to get there.
        </p>
      </div>

      {/* SECTION 2 — OUR STORY */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-brand-dark mb-6">Our Story</h2>
        <div className="space-y-6 text-lg text-brand-secondary leading-relaxed">
          <p>
            Planning a trip can quickly become overwhelming. From choosing destinations and activities to managing time, budget and transportation, travelers often have to bring information together from many different places.
          </p>
          <p>
            Our platform was created to make that process simpler.
          </p>
          <p>
            Instead of spending hours researching and organizing every part of a journey, travelers can provide their preferences and let the application create a structured travel itinerary around them.
          </p>
        </div>
      </div>

      {/* SECTION 3 — WHY WE BUILT THIS */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-white rounded-[2rem] p-8 md:p-16 border border-brand-border shadow-sm flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-brand-dark mb-6">Why we built this</h2>
            <ul className="space-y-4 text-lg text-brand-secondary font-medium">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime"></span> Simpler</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime"></span> Faster</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime"></span> More organized</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime"></span> Personalized</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-brand-lime"></span> Easier to understand</li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-brand-bg rounded-2xl border border-brand-border p-8 flex items-center justify-center">
            <Compass className="w-32 h-32 text-brand-sec opacity-20" />
          </div>
        </div>
      </div>

      {/* SECTION 4 — HOW IT WORKS */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-brand-dark mb-10 text-center">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm text-center">
            <div className="text-brand-sec font-black text-4xl mb-4 opacity-50">01</div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Tell us about your trip</h3>
            <p className="text-brand-secondary">The traveler provides information such as destination, dates, number of travelers, budget and preferences.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm text-center relative md:top-8">
            <div className="text-brand-sec font-black text-4xl mb-4 opacity-50">02</div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Build your itinerary</h3>
            <p className="text-brand-secondary">The application processes the travel information and creates a structured itinerary.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm text-center relative md:top-16">
            <div className="text-brand-sec font-black text-4xl mb-4 opacity-50">03</div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Travel with a plan</h3>
            <p className="text-brand-secondary">The traveler can view the itinerary, save it as a PDF and access saved trips from My Trips.</p>
          </div>
        </div>
      </div>

      {/* SECTION 5 — WHAT YOU CAN DO */}
      <div className="max-w-6xl mx-auto px-6 py-24 mt-16 border-t border-brand-border/50">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-12 text-center">Everything you need for your journey</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Map className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Personalized Itineraries</h4>
            <p className="text-brand-secondary">Plan trips around your preferences and travel details.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Compass className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Trip Planning</h4>
            <p className="text-brand-secondary">Organize your destination, dates, travelers and preferences in one place.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Navigation className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Day-by-Day Plans</h4>
            <p className="text-brand-secondary">View your generated journey in a structured format.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Wallet className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Budget Overview</h4>
            <p className="text-brand-secondary">Keep track of estimated travel expenses when available.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Sparkles className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Save Your Trips</h4>
            <p className="text-brand-secondary">Save generated itineraries and access them later from My Trips.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <Download className="w-8 h-8 text-brand-sec mb-4" />
            <h4 className="text-xl font-bold text-brand-dark mb-3">Download Your Itinerary</h4>
            <p className="text-brand-secondary">Download your generated itinerary as a PDF.</p>
          </div>
        </div>
      </div>

      {/* SECTION 6 — OUR TRAVEL PHILOSOPHY */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-brand-dark text-white rounded-[2rem] p-10 md:p-16 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-deep rounded-full opacity-50 blur-3xl"></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight relative z-10">
            "Travel should feel like an adventure, not a spreadsheet."
          </h2>
          <p className="text-brand-offwhite text-lg relative z-10">
            Planning should reduce stress while leaving room for exploration and personal experiences.
          </p>
        </div>
      </div>

      {/* SECTION 7 — QUICK HIGHLIGHTS */}
      <div className="max-w-5xl mx-auto px-6 py-16 border-b border-brand-border/50">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <div className="px-6 py-3 bg-brand-offwhite text-brand-dark font-bold rounded-full border border-brand-border">Personalized</div>
          <div className="px-6 py-3 bg-brand-offwhite text-brand-dark font-bold rounded-full border border-brand-border">Day-by-day</div>
          <div className="px-6 py-3 bg-brand-offwhite text-brand-dark font-bold rounded-full border border-brand-border">PDF ready</div>
          <div className="px-6 py-3 bg-brand-offwhite text-brand-dark font-bold rounded-full border border-brand-border">Saved trips</div>
        </div>
      </div>

      {/* SECTION 8 — FINAL CTA */}
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-brand-dark mb-4">Ready to plan your next journey?</h2>
        <p className="text-brand-secondary text-lg mb-8">Create a personalized itinerary and start your trip with a plan.</p>
        <button 
          onClick={onPlanClick}
          className="bg-brand-dark hover:bg-brand-deep text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          Plan My Trip <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default AboutPage;
