/**
 * Geolocation service for attendance system
 * Handles distance calculations and location validation
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Check if user location is within acceptable radius of class location
 * @param {Object} userLocation - User's current location {lat, lng}
 * @param {Object} classLocation - Class location {lat, lng, radius}
 * @returns {boolean} True if within radius
 */
export const isWithinRadius = (userLocation, classLocation) => {
    if (!userLocation || !classLocation) {
        return false;
    }

    const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        classLocation.lat,
        classLocation.lng
    );

    const radius = classLocation.radius || 50; // Default 50 meters
    return distance <= radius;
};

/**
 * Validate location data
 * @param {Object} location - Location object to validate
 * @returns {boolean} True if valid
 */
export const validateLocation = (location) => {
    if (!location || typeof location !== 'object') {
        return false;
    }

    const { lat, lng } = location;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
    }

    // Check if coordinates are within valid ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
    }

    return true;
};

/**
 * Get location accuracy level based on coordinates precision
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} Accuracy level
 */
export const getAccuracyLevel = (accuracy) => {
    if (accuracy <= 5) return 'high';
    if (accuracy <= 20) return 'medium';
    return 'low';
}; 