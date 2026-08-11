import { useState } from 'react';

function ItineraryResult({ data, onStartOver }) {
  const [activeDay, setActiveDay] = useState(0);
  const day = data.itinerary[activeDay];

  return (
    <div className="result-container fade-in">
      <div className="result-header">
        <h2>Your {data.destination} Trip</h2>
        <p>{data.total_days} days · {data.group_type} · {data.budget_level} budget</p>
      </div>

      {data.note && (
        <p className="info-banner">ℹ {data.note}</p>
      )}

      {data.travel_details && (
        <div className="travel-card">
          <p className="travel-card-title">✈ Getting there from {data.travel_details.origin_city}</p>
          <p className="travel-card-detail">
            Recommended: <strong>{data.travel_details.recommended_mode}</strong> ·
            {" "}{data.travel_details.round_trip_distance_km} km round trip ·
            {" "}<strong>₹{data.travel_details.cost_inr}</strong>
          </p>
        </div>
      )}

      <div className="cost-summary">
        <div className="cost-item">
          <span className="cost-label">Stay</span>
          <span className="cost-value">{data.estimated_cost.stay}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Meals</span>
          <span className="cost-value">{data.estimated_cost.meals}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Entry Fees</span>
          <span className="cost-value">{data.estimated_cost.entry_fees}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Local Transport</span>
          <span className="cost-value">{data.estimated_cost.local_transport}</span>
        </div>
        <div className="cost-item cost-total-span">
          <span className="cost-label">Travel to Destination</span>
          <span className="cost-value">{data.estimated_cost.travel_to_destination}</span>
        </div>
        <div className="cost-item cost-total">
          <span className="cost-label">Estimated Total</span>
          <span className="cost-value">{data.estimated_cost.estimated_total}</span>
        </div>
      </div>

      <div className="day-tabs">
        {data.itinerary.map((d, idx) => (
          <button
            key={d.day}
            className={`day-tab ${activeDay === idx ? "day-tab-active" : ""}`}
            onClick={() => setActiveDay(idx)}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      <p className="day-theme">{day.theme}</p>

      {day.note ? (
        <div className="free-day-card">
          <p>🌤 {day.note}</p>
        </div>
      ) : (
        <div className="places-list">
          {day.places.map((place, idx) => (
            <div key={idx} className="place-card">
              <div className="place-card-header">
                <h3>{place.name}</h3>
                <div className="badge-group">
                  <span className="match-badge">{place.match_score}% match</span>
                  <span className="time-badge">{place.time_slot}</span>
                </div>
              </div>
              <p className="place-meta">
                {place.type} · {place.city} · {place.duration_hrs} hrs
                {place.entry_fee_inr > 0 ? ` · ₹${place.entry_fee_inr} entry` : " · Free entry"}
              </p>

              {place.distance_from_previous_km != null && (
                <p className="place-distance">
                  🚗 {place.distance_from_previous_km} km from previous stop · ₹{place.local_transport_cost_from_previous_inr} local transport
                </p>
              )}

              {place.activities?.length > 0 && (
                <div className="tag-row">
                  {place.activities.slice(0, 4).map((act, i) => (
                    <span key={i} className="tag">{act}</span>
                  ))}
                </div>
              )}

              {place.local_cuisine?.length > 0 && (
                <p className="place-detail">
                  <strong>Try:</strong> {place.local_cuisine.join(", ")}
                </p>
              )}

              {place.avoid_if && (
                <p className="place-warning">⚠ {place.avoid_if}</p>
              )}

              <p className="place-transport">
                🚉 {place.nearest_railway_station} ({place.railway_distance_km} km) ·
                ✈ {place.nearest_airport} ({place.airport_distance_km} km)
              </p>
            </div>
          ))}
        </div>
      )}

      <button className="ghost-btn" onClick={onStartOver} style={{ marginTop: "16px" }}>
        ← Plan Another Trip
      </button>
    </div>
  );
}

export default ItineraryResult;