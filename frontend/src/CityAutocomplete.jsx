
import { useState } from "react";

const INDIAN_CITIES = [
  "Mumbai",
  "Pune",
  "Nashik",
  "Nagpur",
  "Aurangabad",
  "Ahmednagar",
  "Kolhapur",
  "Surat",
  "Ahmedabad",
  "Vadodara",
  "Rajkot",
  "Delhi",
  "Jaipur",
  "Udaipur",
  "Jodhpur",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Goa",
  "Indore",
  "Bhopal",
  "Chandigarh",
  "Lucknow",
  "Varanasi",
  "Amritsar",
  "Kochi",
  "Thiruvananthapuram",
  "Bhubaneswar",
  "Patna"
];

function CityAutocomplete({ value, onChange }) {
  const [selectedCity, setSelectedCity] = useState(value || "");

  const handleChange = (event) => {
    const city = event.target.value;

    setSelectedCity(city);
    onChange(city);
  };

  return (
    <select
      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-primary focus:outline-none focus:border-brand-sec focus:ring-1 focus:ring-brand-sec transition-shadow"
      value={selectedCity}
      onChange={handleChange}
    >
      <option value="">
        Select your city
      </option>

      {INDIAN_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}

export default CityAutocomplete;

