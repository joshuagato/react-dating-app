import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { CircleX, CircleCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import Layout from '../components/Layouts/SetupLayout';
import { setupFinalProfileHandler, getEncountersProfilesHandler } from '../tanstack/user';
import { UPLOAD_PICTURE_TEXT } from '../functions/constants';
import HelmetHeader from '../components/HelmetHeader';
import SubmitButton from '../components/SubmitButton';
import { unsetErrorSetMessage, unsetMessageSetError } from '../functions/utils';

export default function FinalProfile() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // const [pointA] = useState({ lat: 5.6037, lon: -0.1870, name: 'Accra' });
    const [pointB] = useState({ lat: 5.6164352, lon: -0.196608, name: 'Accra' });
    const [pointA] = useState({ lat: 5.6037, lon: -0.1870, name: 'Accra' });
    // const [pointB] = useState({ lat: 6.6885, lon: -1.6244, name: 'Kumasi' });


    function calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
        const toRadians = (degree) => (degree * Math.PI) / 180;

        const R = unit === 'mi' ? 3958.8 : 6371; // Earth's radius in miles or kilometers

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        return Number(distance.toFixed(1)); // Round to 1 decimal places
    }


    const getDeviceLocationAndCity = async () => {
        try {
            // 1. Check/Request permissions ONLY if running on Android or iOS
            if (Capacitor.isNativePlatform()) {
                const status = await Geolocation.checkPermissions();

                if (status.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (requestStatus.location === 'denied') {
                        console.error('User denied location permissions.');
                        return;
                    }
                }
            }

            // 2. Get current GPS coordinates
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
            });

            const { latitude: lat, longitude: lon } = position.coords;

            // 3. Reverse Geocode coordinates to City & Country via Nominatim
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MyCapacitorApp/1.0 (contact@joshuagato.online)'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const address = data.address || {};

            const city = address.city || address.town || address.village || address.suburb || 'Unknown City';
            const country = address.country || 'Unknown Country';

            console.log(`Latitude: ${lat}, Longitude: ${lon}`);
            console.log(`City: ${city}, Country: ${country}`);

            return { lat, lon, city, country };

        } catch (error) {
            console.error('Error fetching location:', error);
        }
    };

    async function locationHandler(event) {
        event.preventDefault();

        const geolocationSuccess = function (pos) {
            console.log("Your location is " + pos.coords.latitude + "°, " + pos.coords.longitude + "°.");
        };
        // Function that will be called if the query fails
        const geolocationFailure = function (err) {
            console.log("ERROR (" + err.code + "): " + err.message);
        };

        // if (navigator.geolocation) {
        //     navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationFailure);
        // } else {
        //     console.log("Geolocation is not supported by this browser.");
        // }



        // Call the function
        await getDeviceLocationAndCity();


        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const coord = position.coords;

                // Use Nominatim's Reverse Geocoding API endpoint
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'MyGeolocApp/1.0 (contact@example.com)' // Nominatim requires a user agent or contact info
                        }
                    });

                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                    const data = await response.json();

                    // Extract location details safely with fallbacks
                    const address = data.address || {};
                    const city = address.city || address.town || address.village || address.suburb || 'Unknown city';
                    const country = address.country || 'Unknown country';
                    console.log({ coord, address });
                    console.log(`City: ${city}, Country: ${country}`);
                } catch (err) {
                    console.error("Geocoding fetch error:", err);
                }
            },
            (error) => {
                console.error("Location error:", error.message);
            }
        );



    }

    const distanceInKm = calculateDistance(pointA.lat, pointA.lon, pointB.lat, pointB.lon, 'km');
    console.log(distanceInKm, 'KM');

    const query = `max_distance=211`;
    console.log(getEncountersProfilesHandler(query));


    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);

        try {
            const accra1 = { latitude: 5.6037672, longitude: -0.187092, city: 'Accra', country: 'Ghana' };
            const accra2 = { latitude: 5.6164352, longitude: -0.196608, city: 'Accra', country: 'Ghana' };
            const accra3 = { latitude: 5.6113161, longitude: -0.182130, city: 'Accra', country: 'Ghana' };
            const accra4 = { latitude: 5.6001219, longitude: -0.190316, city: 'Accra', country: 'Ghana' };
            const kumasi1 = { latitude: 6.6885112, longitude: -1.624412, city: 'Kumasi', country: 'Ghana' };

            // const response = await setupFinalProfileHandler(accra1);
            const response = await setupFinalProfileHandler(kumasi1);
            const { success, message } = response;

            if (success) {
                unsetErrorSetMessage(setError, setMessage, message);
                toast.success(message, { autoClose: 5000, theme: 'colored' });
                // navigate(advancedProfilePath, { replace: true });
            } else {
                unsetMessageSetError(setMessage, setError, message);
                toast.error(message, { autoClose: 5000, theme: 'colored' });
            }
        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout heading={UPLOAD_PICTURE_TEXT}>
            <HelmetHeader pageTitle={'Location'} />

            <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleSubmit}>

                <button onClick={locationHandler} className='button btn-info'>Locate Me</button>

                {error && (
                    <div role="alert" className="alert alert-error fade-in">
                        <CircleX />
                        <span>{error}</span>
                    </div>
                )}
                {message && (
                    <div role="alert" className="alert alert-success fade-in">
                        <CircleCheck />
                        <span>{message}</span>
                    </div>
                )}

                <SubmitButton loading={loading}>
                    Save
                </SubmitButton>
            </form>
        </Layout>
    );
}