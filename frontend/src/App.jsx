import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Compass, Map, MapPin, Navigation, Calendar, Users, Wallet, Check, X,
  ArrowRight, Sparkles, Plane, Palmtree, Trash2
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

const INTEREST_LIST = [
  { key: 'adventure_sports', label: 'Adventure' },
  { key: 'water_activities', label: 'Water Sports' },
  { key: 'trekking', label: 'Trekking' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'photography', label: 'Photography' },
  { key: 'religious', label: 'Religious' },
  { key: 'solo_female', label: 'Solo Female' },
  { key: 'wheelchair', label: 'Wheelchair' },
  { key: 'medical', label: 'Medical Near' },
  { key: 'dslr', label: 'DSLR User' },
  { key: 'internet', label: 'Good Internet' }
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
  prefers_offbeat: "No preference"
};

const API_URL = import.meta.env.VITE_API_URL || "/api/generate-plan";

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
    </div>
  );
}

function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['landing', 'form', 'my-trips', 'about'].includes(hash) ? hash : 'landing';
  });

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
  const [interestStates, setInterestStates] = useState({});
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

  const deleteTrip = (tripId) => {
    const updatedTrips = savedTrips.filter(t => t.id !== tripId);
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
    setInterestStates({});
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

  const handleInterestToggle = (key) => {
    setInterestStates(prev => {
      const current = prev[key] || 'neutral';
      let next = 'neutral';
      if (current === 'neutral') next = 'must';
      else if (current === 'must') next = 'avoid';
      else if (current === 'avoid') next = 'neutral';
      
      return { ...prev, [key]: next };
    });
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

    const mustTags = [];
    const avoidTags = [];

    INTEREST_LIST.forEach(item => {
      const state = interestStates[item.key];
      if (state === 'must') mustTags.push(item.label);
      if (state === 'avoid') avoidTags.push(item.label);
    });

    try {
      const payload = {
        ...formData,
        days: Number(formData.days),
        
        wants_adventure_sports: interestStates['adventure_sports'] === 'must',
        wants_water_activities: interestStates['water_activities'] === 'must',
        wants_trekking: interestStates['trekking'] === 'must',
        wants_nightlife: interestStates['nightlife'] === 'must',
        wants_shopping: interestStates['shopping'] === 'must',
        wants_photography: interestStates['photography'] === 'must',
        religious_interest: interestStates['religious'] === 'must',
        solo_female: interestStates['solo_female'] === 'must',
        wheelchair_needed: interestStates['wheelchair'] === 'must',
        medical_important: interestStates['medical'] === 'must',
        carrying_dslr: interestStates['dslr'] === 'must',
        internet_important: interestStates['internet'] === 'must',

        avoid_adventure_sports: interestStates['adventure_sports'] === 'avoid',
        avoid_water_activities: interestStates['water_activities'] === 'avoid',
        avoid_trekking: interestStates['trekking'] === 'avoid',
        avoid_nightlife: interestStates['nightlife'] === 'avoid',
        avoid_shopping: interestStates['shopping'] === 'avoid',
        avoid_photography: interestStates['photography'] === 'avoid',
        avoid_religious: interestStates['religious'] === 'avoid'
      };

      const response = await axios.post(API_URL, payload);

      const enrichedResult = {
        ...response.data,
        must_tags: mustTags,
        avoid_tags: avoidTags,
        user_inputs: formData
      };

      setResult(enrichedResult);
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-brand-dark">My Trips</h2>
            {savedTrips.length > 0 && (
              <span className="text-sm font-medium text-brand-secondary bg-white px-4 py-1.5 rounded-full border border-brand-border">
                {savedTrips.length} Saved {savedTrips.length === 1 ? 'Trip' : 'Trips'}
              </span>
            )}
          </div>

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
              {savedTrips.map(trip => {
                const tripInfo = trip.data || {};
                const destName = tripInfo.destination || tripInfo.destination_state || "Saved Trip";
                const days = tripInfo.total_days || tripInfo.days || 3;
                const group = tripInfo.group_type || "Friends";

                return (
                  <div key={trip.id} className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col relative group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-brand-dark">{destName}</h3>
                      <button 
                        onClick={() => deleteTrip(trip.id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm text-brand-secondary mb-4 space-y-1">
                      <p><Calendar className="w-4 h-4 inline mr-1 text-brand-sec" /> {days} Days</p>
                      <p className="capitalize"><Users className="w-4 h-4 inline mr-1 text-brand-sec" /> {group}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-brand-border flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          setResult(tripInfo);
                          setView('result');
                        }}
                        className="w-full bg-brand-offwhite hover:bg-brand-sec/10 text-brand-dark px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-brand-border/50 mb-1"
                      >
                        View Itinerary
                      </button>
                      <button 
                        onClick={() => generateItineraryPDF(tripInfo)}
                        className="w-full bg-brand-dark hover:bg-brand-deep text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'loading' && (
        <div className="pt-32 pb-24 px-6 flex flex-col items-center justify-center min-h-screen animate-fade-in">
          <div className="bg-white rounded-3xl p-12 max-w-md w-full shadow-lg border border-brand-border text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-brand-offwhite rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Plane className="w-10 h-10 text-brand-sec" />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Creating your itinerary...</h2>
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
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec transition-shadow"
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

              <div>
                <div className="flex justify-between items-center mb-6 border-b border-brand-border pb-4">
                  <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                    <Palmtree className="w-5 h-5 text-brand-sec" /> Special Interests
                  </h3>
                  <span className="text-xs text-brand-secondary">
                    Click: <span className="text-emerald-700 font-bold">Must Have</span> → <span className="text-rose-600 font-bold">Avoid</span> → Neutral
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {INTEREST_LIST.map(item => {
                    const state = interestStates[item.key] || 'neutral';

                    let btnStyle = "bg-white border-brand-border text-brand-secondary hover:border-brand-sec/40";
                    if (state === 'must') {
                      btnStyle = "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm font-bold ring-1 ring-emerald-600";
                    } else if (state === 'avoid') {
                      btnStyle = "bg-rose-50 border-rose-500 text-rose-700 shadow-sm font-bold ring-1 ring-rose-500";
                    }

                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => handleInterestToggle(item.key)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 ${btnStyle}`}
                      >
                        <span className="text-sm">{item.label}</span>
                        {state === 'must' && (
                          <span className="text-[10px] uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Must
                          </span>
                        )}
                        {state === 'avoid' && (
                          <span className="text-[10px] uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <X className="w-3 h-3" /> Avoid
                          </span>
                        )}
                      </button>
                    );
                  })}
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