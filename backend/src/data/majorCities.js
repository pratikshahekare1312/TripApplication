// Fixed coordinates for major Indian cities — avoids live geocoding on every request
const MAJOR_CITIES = {
  "Delhi": { latitude: 28.6139, longitude: 77.2090 },
  "Mumbai": { latitude: 19.0760, longitude: 72.8777 },
  "Bangalore": { latitude: 12.9716, longitude: 77.5946 },
  "Kolkata": { latitude: 22.5726, longitude: 88.3639 },
  "Chennai": { latitude: 13.0827, longitude: 80.2707 },
  "Pune": { latitude: 18.5204, longitude: 73.8567 },
  "Hyderabad": { latitude: 17.3850, longitude: 78.4867 },
  "Ahmedabad": { latitude: 23.0225, longitude: 72.5714 },
  "Jaipur": { latitude: 26.9124, longitude: 75.7873 },
  "Lucknow": { latitude: 26.8467, longitude: 80.9462 }
};

module.exports = { MAJOR_CITIES };