import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Compass, Map, MapPin, Navigation, Calendar, Users, Wallet, Check, 
  ArrowRight, Sparkles, Plane, Palmtree
} from 'lucide-react';

import './App.css';
import ItineraryResult from './ItineraryResult';
import CityAutocomplete from './CityAutocomplete';
import { generateItineraryPDF } from './pdfUtils';
import AboutPage from './AboutPage';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir"
];

const DEFAULTS = {
  destination_state: "",
  origin_city: "",
  days: 3,
  group_type: "friends",
  group_composition: [],
  budget_level: "mid",
  vibe: "chill",
  crowd_preference: "medium",
  prefers_offbeat: "No preference",
  solo_female: false,
  wheelchair_needed: false,
  medical_important: false,
  wants_adventure_sports: false,
  wants_water_activities: false,
  wants_trekking: false,
  wants_nightlife: false,
  wants_shopping: false,
  wants_photography: false,
  religious_interest: true,
  carrying_dslr: false,
  internet_important: false
};

const API_URL = "http://localhost:5000/api/generate-plan";

function Navbar({ onPlanClick, onHomeClick, onViewChange }) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-brand-bg/90 backdrop-blur-md z-50 border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onHomeClick}
        >
          <div className="bg-brand-deep p-2 rounded-lg">
            <Compass className="w-6 h-6 text-brand-lime" />
          </div>
          <span className="text-xl font-bold text-brand-dark tracking-tight">TravelSmart</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-secondary">
          <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="hover:text-brand-dark transition-colors">Home</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('my-trips'); }} className="hover:text-brand-dark transition-colors">My Trips</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('about'); }} className="hover:text-brand-dark transition-colors">About</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onPlanClick}
            className="bg-brand-dark hover:bg-brand-deep text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Plan a Trip
          </button>
        </div>
      </div>
    </nav>
  );
}

function LandingPage({ onPlanClick }) {
  return (
    <div className="pt-20 min-h-screen bg-brand-bg text-brand-dark animate-fade-in">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-border text-xs font-semibold text-brand-sec mb-8">
          <Sparkles className="w-4 h-4 text-brand-lime" />
          SMART TRAVEL PLANNING
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-brand-dark mb-6 leading-tight">
          Plan your journey. <br className="hidden md:block"/>
          <span className="text-brand-sec">We'll handle the details.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-secondary mb-10 leading-relaxed">
          Create completely personalized itineraries tailored to your budget, travel style, and preferences in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onPlanClick}
            className="w-full sm:w-auto bg-brand-dark hover:bg-brand-deep text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Plan My Trip <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feature Section */}
      <div className="max-w-6xl mx-auto px-6 py-24 border-t border-brand-border/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Everything you need for a better journey</h2>
          <p className="text-brand-secondary max-w-2xl mx-auto">Our smart platform takes the stress out of travel planning by combining intelligent recommendations with beautiful organization.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Feature */}
          <div className="md:col-span-3 bg-white rounded-3xl p-8 md:p-12 border border-brand-border shadow-sm flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="w-12 h-12 bg-brand-offwhite rounded-2xl flex items-center justify-center mb-6">
                <Map className="w-6 h-6 text-brand-deep" />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark mb-4">Personalized itineraries</h3>
              <p className="text-brand-secondary text-lg leading-relaxed mb-6">
                Tell us where you want to go and what you love. We'll generate a complete, day-by-day travel plan matching your exact preferences.
              </p>
              <button 
                onClick={onPlanClick}
                className="text-brand-sec font-semibold flex items-center gap-2 hover:text-brand-deep"
              >
                Try it out <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 w-full bg-brand-bg rounded-2xl border border-brand-border p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-border/50 opacity-90">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 w-24 bg-brand-offwhite rounded"></div>
                  <div className="h-4 w-12 bg-brand-lime/50 rounded"></div>
                </div>
                <div className="h-3 w-48 bg-brand-bg rounded"></div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-border/50 ml-6 z-10">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 w-32 bg-brand-sec rounded"></div>
                  <div className="h-4 w-16 bg-brand-lime rounded"></div>
                </div>
                <div className="h-3 w-56 bg-brand-bg rounded mb-2"></div>
                <div className="h-3 w-40 bg-brand-bg rounded"></div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-border/50 opacity-90">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 w-28 bg-brand-offwhite rounded"></div>
                  <div className="h-4 w-12 bg-brand-lime/50 rounded"></div>
                </div>
                <div className="h-3 w-48 bg-brand-bg rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <div className="w-10 h-10 bg-brand-offwhite rounded-xl flex items-center justify-center mb-6">
              <Wallet className="w-5 h-5 text-brand-deep" />
            </div>
            <h4 className="text-xl font-bold text-brand-dark mb-3">Budget Planning</h4>
            <p className="text-brand-secondary">Get accurate cost estimates for stay, food, and transport based on your budget level.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <div className="w-10 h-10 bg-brand-offwhite rounded-xl flex items-center justify-center mb-6">
              <Compass className="w-5 h-5 text-brand-deep" />
            </div>
            <h4 className="text-xl font-bold text-brand-dark mb-3">Smart Recommendations</h4>
            <p className="text-brand-secondary">Discover perfect spots matching your vibe, from popular attractions to offbeat gems.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm">
            <div className="w-10 h-10 bg-brand-offwhite rounded-xl flex items-center justify-center mb-6">
              <Navigation className="w-5 h-5 text-brand-deep" />
            </div>
            <h4 className="text-xl font-bold text-brand-dark mb-3">Complete Overview</h4>
            <p className="text-brand-secondary">View daily timelines, travel distances, and entry fees in one clean interface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['landing', 'form', 'my-trips', 'about'].includes(hash) ? hash : 'landing';
  }); // 'landing', 'form', 'loading', 'result', 'my-trips', 'about'

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['landing', 'form', 'my-trips', 'about'].includes(hash)) {
        setView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (['landing', 'form', 'my-trips', 'about'].includes(view)) {
      window.location.hash = view;
    }
  }, [view]);

  const [formData, setFormData] = useState(DEFAULTS);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const stored = localStorage.getItem('travel_smart_trips');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveTrip = (tripData) => {
    const newTrip = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      data: tripData
    };
    const updatedTrips = [newTrip, ...savedTrips];
    setSavedTrips(updatedTrips);
    localStorage.setItem('travel_smart_trips', JSON.stringify(updatedTrips));
  };

  const startPlanning = () => {
    setView('form');
    window.scrollTo(0, 0);
  };

  const startOver = () => {
    setResult(null);
    setError(null);
    setFormData({ ...DEFAULTS, group_composition: [] });
    setView('landing');
    window.scrollTo(0, 0);
  };

  const handleViewChange = (newView) => {
    if (newView === 'my-trips') {
      setView('my-trips');
      window.scrollTo(0, 0);
    } else if (newView === 'about') {
      setView('about');
      window.scrollTo(0, 0);
    } else {
      startOver();
    }
  };

  const setFormValue = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleMultiOption = (opt) => {
    setFormData(prev => {
      const currentArr = prev.group_composition;
      if (currentArr.includes(opt)) {
        return { ...prev, group_composition: currentArr.filter(x => x !== opt) };
      } else {
        return { ...prev, group_composition: [...currentArr, opt] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination_state || !formData.origin_city.trim()) {
      setError("Please fill in the required locations.");
      window.scrollTo(0, 0);
      return;
    }

    setView('loading');
    setError(null);
    window.scrollTo(0, 0);

    try {
      const payload = {
        ...formData,
        days: Number(formData.days)
      };

      const response = await axios.post(API_URL, payload);
      setResult(response.data);
      setView('result');
    } catch (err) {
      console.error("Itinerary generation failed:", err);
      const message = err.response?.data?.message || "Something went wrong. Please check if the server is running.";
      setError(message);
      setView('form');
    }
  };


  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-lime selection:text-brand-dark">
      <Navbar onPlanClick={startPlanning} onHomeClick={startOver} onViewChange={handleViewChange} />

      {view === 'landing' && <LandingPage onPlanClick={startPlanning} />}
      {view === 'about' && <AboutPage onPlanClick={startPlanning} />}

      {view === 'my-trips' && (
        <div className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-in">
          <h2 className="text-3xl font-bold text-brand-dark mb-8">My Trips</h2>
          {savedTrips.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-brand-border text-center shadow-sm">
              <Compass className="w-12 h-12 text-brand-sec mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-brand-dark mb-2">No trips saved yet</h3>
              <p className="text-brand-secondary mb-6">Your saved itineraries will appear here.</p>
              <button 
                onClick={startPlanning}
                className="bg-brand-dark hover:bg-brand-deep text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm"
              >
                Plan a Trip
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {savedTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col">
                  <h3 className="text-xl font-bold text-brand-dark mb-2">{trip.data.destination}</h3>
                  <div className="text-sm text-brand-secondary mb-4 space-y-1">
                    <p><Calendar className="w-4 h-4 inline mr-1 text-brand-sec" /> {trip.data.total_days} Days</p>
                    <p><Users className="w-4 h-4 inline mr-1 text-brand-sec" /> {trip.data.group_type}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-brand-border flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setResult(trip.data);
                        setView('result');
                      }}
                      className="w-full bg-brand-offwhite hover:bg-brand-sec/10 text-brand-dark px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-brand-border/50 mb-2"
                    >
                      View Itinerary
                    </button>
                    <button 
                      onClick={() => generateItineraryPDF(trip.data)}
                      className="w-full bg-brand-dark hover:bg-brand-deep text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'loading' && (
        <div className="pt-32 pb-24 px-6 flex flex-col items-center justify-center min-h-screen animate-fade-in">
          <div className="bg-white rounded-3xl p-12 max-w-md w-full shadow-lg border border-brand-border text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-offwhite">
              <div className="h-full bg-brand-sec animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
            <div className="w-20 h-20 bg-brand-offwhite rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Plane className="w-10 h-10 text-brand-sec" />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Creating your itinerary...</h2>
            <p className="text-brand-secondary leading-relaxed">
              We're finding the best places, optimizing your travel route, and crunching the numbers.
            </p>
          </div>
        </div>
      )}

      {view === 'form' && (
        <div className="pt-32 pb-24 px-4 sm:px-6 animate-fade-in">
          <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-sm border border-brand-border p-6 sm:p-10">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-brand-dark mb-3">Plan your trip</h2>
              <p className="text-brand-secondary">Tell us your preferences and we'll craft the perfect journey.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 flex items-start gap-3">
                <span className="text-red-500 font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              {/* SECTION 1: TRIP DETAILS */}
              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2 border-b border-brand-border pb-4">
                  <MapPin className="w-5 h-5 text-brand-sec" /> Trip Details
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Origin City *</label>
                    <CityAutocomplete 
                      value={formData.origin_city}
                      onChange={(val) => setFormValue('origin_city', val)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Destination State *</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec focus:ring-1 focus:ring-brand-sec transition-shadow"
                      value={formData.destination_state}
                      onChange={(e) => setFormValue('destination_state', e.target.value)}
                      required
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Duration (Days) *</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow"
                      value={formData.days}
                      onChange={(e) => setFormValue('days', Number(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7].map(d => (
                        <option key={d} value={d}>{d} {d===1 ? 'Day' : 'Days'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Travelling With *</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow capitalize"
                      value={formData.group_type}
                      onChange={(e) => setFormValue('group_type', e.target.value)}
                    >
                      {["solo", "couple", "friends", "family"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-brand-primary mb-3">Group Includes (Optional)</label>
                  <div className="flex flex-wrap gap-3">
                    {["Kids", "Adults", "Seniors"].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleMultiOption(opt)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                          formData.group_composition.includes(opt)
                            ? "bg-brand-sec border-brand-sec text-white"
                            : "bg-white border-brand-border text-brand-secondary hover:border-brand-sec/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PREFERENCES */}
              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2 border-b border-brand-border pb-4">
                  <Wallet className="w-5 h-5 text-brand-sec" /> Preferences
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Budget Level</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow capitalize"
                      value={formData.budget_level}
                      onChange={(e) => setFormValue('budget_level', e.target.value)}
                    >
                      {["budget", "mid", "luxury"].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Trip Vibe</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow capitalize"
                      value={formData.vibe}
                      onChange={(e) => setFormValue('vibe', e.target.value)}
                    >
                      {["chill", "adventure", "spiritual", "romantic", "family", "cultural", "party", "offbeat"].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Crowd Preference</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow capitalize"
                      value={formData.crowd_preference}
                      onChange={(e) => setFormValue('crowd_preference', e.target.value)}
                    >
                      {["low", "medium", "high"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-primary mb-2">Spot Type</label>
                    <select 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow"
                      value={formData.prefers_offbeat}
                      onChange={(e) => setFormValue('prefers_offbeat', e.target.value)}
                    >
                      {["No preference", "Popular", "Offbeat"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: INTERESTS */}
              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2 border-b border-brand-border pb-4">
                  <Palmtree className="w-5 h-5 text-brand-sec" /> Special Interests
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[
                    { key: 'wants_adventure_sports', label: 'Adventure' },
                    { key: 'wants_water_activities', label: 'Water Sports' },
                    { key: 'wants_trekking', label: 'Trekking' },
                    { key: 'wants_nightlife', label: 'Nightlife' },
                    { key: 'wants_shopping', label: 'Shopping' },
                    { key: 'wants_photography', label: 'Photography' },
                    { key: 'religious_interest', label: 'Religious' },
                    { key: 'solo_female', label: 'Solo Female' },
                    { key: 'wheelchair_needed', label: 'Wheelchair' },
                    { key: 'medical_important', label: 'Medical Near' },
                    { key: 'carrying_dslr', label: 'DSLR User' },
                    { key: 'internet_important', label: 'Good Internet' }
                  ].map(interest => (
                    <label 
                      key={interest.key}
                      className={`cursor-pointer flex items-center justify-center text-center p-4 rounded-2xl border transition-all ${
                        formData[interest.key] 
                          ? "bg-brand-offwhite border-brand-deep text-brand-deep shadow-sm" 
                          : "bg-white border-brand-border text-brand-secondary hover:border-brand-sec/40"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={formData[interest.key]}
                        onChange={(e) => setFormValue(interest.key, e.target.checked)}
                      />
                      <span className="text-sm font-semibold">{interest.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-brand-border flex justify-end">
                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-brand-dark hover:bg-brand-deep text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Generate My Itinerary <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === 'result' && result && (
        <ItineraryResult data={result} onStartOver={startOver} onSaveTrip={saveTrip} />
      )}
    </div>
  );
}

export default App;