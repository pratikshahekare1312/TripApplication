import { useState } from 'react';
import { 
  MapPin, Calendar, Clock, DollarSign, Wallet, Users, Compass, Activity,
  CheckCircle2, ChevronRight, Navigation, Map, Coffee, Download
} from 'lucide-react';
import { generateItineraryPDF } from './pdfUtils';

function ItineraryResult({ data, onStartOver, onSaveTrip }) {
  const [activeDay, setActiveDay] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const day = data.itinerary[activeDay];

  const handleSavePDF = () => {
    const success = generateItineraryPDF(data);
    if (success) {
      if (onSaveTrip) onSaveTrip(data);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleSaveItinerary = () => {
    if (onSaveTrip) onSaveTrip(data);
    setSaveStatus('itinerary_saved');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 min-h-screen animate-fade-in bg-brand-bg">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-brand-dark rounded-[2rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-deep rounded-full opacity-50 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-deep border border-brand-sec text-xs font-semibold text-brand-lime mb-6 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              {data.destination} Trip
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
              Your Complete Journey to {data.destination}
            </h1>
            
            <div className="flex flex-wrap gap-4 sm:gap-8 text-sm sm:text-base text-brand-offwhite font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-lime" />
                {data.total_days} Days
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-lime" />
                <span className="capitalize">{data.group_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-lime" />
                <span className="capitalize">{data.budget_level} Budget</span>
              </div>
            </div>
          </div>
        </div>

        {data.note && (
          <div className="bg-brand-deep/5 border border-brand-sec/20 text-brand-deep px-6 py-4 rounded-2xl flex items-start gap-3">
            <Compass className="w-5 h-5 mt-0.5 shrink-0 text-brand-sec" />
            <p className="font-medium text-sm leading-relaxed">{data.note}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Summary Cards */}
          <div className="md:col-span-1 space-y-6">
            
            {data.travel_details && (
              <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-sm">
                <h3 className="text-xs font-bold text-brand-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-sec" /> Getting There
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-brand-secondary mb-1">From</p>
                    <p className="font-semibold text-brand-dark">{data.travel_details.origin_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-secondary mb-1">Recommended Mode</p>
                    <p className="font-semibold text-brand-dark">{data.travel_details.recommended_mode}</p>
                  </div>
                  <div className="pt-4 border-t border-brand-border flex justify-between items-center">
                    <span className="text-sm text-brand-secondary">Est. Cost</span>
                    <span className="font-bold text-brand-dark">₹{data.travel_details.cost_inr}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-sm">
              <h3 className="text-xs font-bold text-brand-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-sec" /> Budget Estimate
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-secondary">Stay</span>
                  <span className="font-semibold text-brand-dark">{data.estimated_cost.stay}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-secondary">Meals</span>
                  <span className="font-semibold text-brand-dark">{data.estimated_cost.meals}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-secondary">Entry Fees</span>
                  <span className="font-semibold text-brand-dark">{data.estimated_cost.entry_fees}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-secondary">Local Transport</span>
                  <span className="font-semibold text-brand-dark">{data.estimated_cost.local_transport}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-secondary">Travel</span>
                  <span className="font-semibold text-brand-dark">{data.estimated_cost.travel_to_destination}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border flex flex-col gap-1">
                <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Total Estimated Cost</span>
                <span className="text-2xl font-extrabold text-brand-deep">{data.estimated_cost.estimated_total}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveItinerary}
                  className="w-full bg-brand-sec hover:bg-brand-deep text-white px-4 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Save Itinerary
                </button>
                <button 
                  onClick={handleSavePDF}
                  className="w-full bg-brand-dark hover:bg-brand-deep text-white px-4 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Save PDF
                </button>
              </div>
              
              {saveStatus === 'success' && (
                <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200 font-medium text-center">
                  Trip saved successfully!
                </div>
              )}
              {saveStatus === 'itinerary_saved' && (
                <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200 font-medium text-center">
                  Itinerary saved to My Trips.
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-sm text-red-700 bg-red-50 px-4 py-3 rounded-xl border border-red-200 font-medium text-center">
                  Failed to generate PDF.
                </div>
              )}

              <button 
                onClick={onStartOver}
                className="w-full bg-white hover:bg-brand-offwhite text-brand-dark border border-brand-border px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm"
              >
                Plan Another Trip
              </button>
            </div>
            
          </div>

          {/* Right Column: Itinerary */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm">
            <h3 className="text-xl font-bold text-brand-dark mb-6">Day-by-Day Plan</h3>
            
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {data.itinerary.map((d, idx) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeDay === idx 
                      ? "bg-brand-deep text-white shadow-md"
                      : "bg-brand-offwhite text-brand-secondary hover:bg-brand-border/50"
                  }`}
                >
                  Day {d.day}
                </button>
              ))}
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-bold text-brand-sec mb-2">{day.theme}</h4>
            </div>

            {day.note ? (
              <div className="bg-brand-offwhite border border-brand-border/80 rounded-2xl p-8 text-center text-brand-secondary font-medium">
                {day.note}
              </div>
            ) : (
              <div className="relative border-l-2 border-brand-border/80 ml-4 space-y-10 pl-8">
                {day.places.map((place, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-brand-lime border-4 border-white shadow-sm z-10"></div>
                    
                    <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-brand-sec bg-brand-sec/10 px-2.5 py-1 rounded-md">
                              {place.time_slot}
                            </span>
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {place.match_score}% Match
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-brand-dark mt-2">{place.name}</h3>
                          <p className="text-sm text-brand-secondary capitalize mt-1 flex items-center gap-1.5">
                            <Map className="w-4 h-4" /> {place.city} · {place.type} · {place.duration_hrs} hrs
                          </p>
                        </div>
                        
                        <div className="sm:text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            place.entry_fee_inr > 0 
                              ? "bg-brand-offwhite text-brand-dark"
                              : "bg-brand-lime/30 text-brand-deep"
                          }`}>
                            {place.entry_fee_inr > 0 ? `₹${place.entry_fee_inr} Entry` : "Free Entry"}
                          </span>
                        </div>
                      </div>

                      {place.distance_from_previous_km != null && (
                        <div className="bg-brand-bg rounded-xl p-3 text-sm text-brand-secondary mb-4 flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-brand-sec" />
                          {place.distance_from_previous_km} km from previous stop · Est. ₹{place.local_transport_cost_from_previous_inr} transport
                        </div>
                      )}

                      {place.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {place.activities.slice(0, 4).map((act, i) => (
                            <span key={i} className="text-xs font-medium text-brand-deep bg-brand-offwhite px-3 py-1.5 rounded-lg capitalize border border-brand-border/50">
                              {act}
                            </span>
                          ))}
                        </div>
                      )}

                      {place.local_cuisine?.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-brand-secondary mb-3">
                          <Coffee className="w-4 h-4 text-brand-sec mt-0.5" />
                          <p><strong className="text-brand-dark">Must try:</strong> {place.local_cuisine.join(", ")}</p>
                        </div>
                      )}

                      {place.avoid_if && (
                        <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-3 font-medium">
                          ⚠ Avoid if: {place.avoid_if}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default ItineraryResult;