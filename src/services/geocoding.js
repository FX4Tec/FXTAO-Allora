import axios from 'axios';

const nominatim = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
    headers: {
        'User-Agent': 'FXTAO-App/1.0' // OpenStreetMap requires a User-Agent
    }
});

export const getCoordinates = async (address) => {
    try {
        // query: street, city, state, country
        const response = await nominatim.get('/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                addressdetails: 1
            }
        });

        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return {
                lat: parseFloat(lat),
                lng: parseFloat(lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};
