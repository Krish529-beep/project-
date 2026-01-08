
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
};

/**
 * Calculates the distance between two points in meters using Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Priority logic: If coordinates are within 200m of known sensitive areas.
 * For simulation, we define some dummy "sensitive" zones.
 */
const SENSITIVE_ZONES = [
  { name: 'City Hospital', lat: 12.9716, lng: 77.5946 },
  { name: 'Global School', lat: 12.9352, lng: 77.6245 },
];

export const checkPriority = (lat: number, lng: number): boolean => {
  return SENSITIVE_ZONES.some(zone => calculateDistance(lat, lng, zone.lat, zone.lng) < 200);
};
