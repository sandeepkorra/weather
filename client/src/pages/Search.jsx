import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import ForecastCard from '../components/ForecastCard.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import WeatherScene from '../components/WeatherScene.jsx';

export default function Search() {
  const [searchParams] = useSearchParams();

  const requestedCity = searchParams.get('city') || '';
  const requestedLatitude =
    searchParams.get('latitude') || searchParams.get('lat');
  const requestedLongitude =
    searchParams.get('longitude') || searchParams.get('lon');

  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [postalOffices, setPostalOffices] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [exactCoordinates, setExactCoordinates] = useState(null);

  function resetResult() {
    setError('');
    setToast('');
    setWeather(null);
    setIsFavourite(false);
    setPostalOffices([]);
    setLocationOptions([]);
  }

  async function loadWeather(params) {
    setStatus('loading');
    resetResult();

    try {
      const { data } = await api.get('/weather', { params });
      setWeather(data);
      setStatus('success');
    } catch (requestError) {
      const message = requestError.response?.data?.message;

      if (requestError.response?.status === 409 && requestError.response.data.offices) {
        const offices = requestError.response.data.offices;
        setPostalOffices([
          ...offices.filter((office) => office.toLowerCase() === 'chintapalli'),
          ...offices.filter((office) => office.toLowerCase() !== 'chintapalli')
        ]);
        setError('');
        setStatus('choose-office');
        return;
      }

      if (requestError.response?.status === 409 && requestError.response.data.locations) {
        setLocationOptions(requestError.response.data.locations);
        setError('');
        setStatus('choose-office');
        return;
      }

      if (requestError.response?.status === 404) {
        setError('Location was not found.');
      } else if (requestError.response?.status === 400) {
        setError(message || 'Please provide a valid location.');
      } else {
        setError(message || 'Weather is temporarily unavailable.');
      }

      setStatus('error');
    }
  }

  async function searchWeather(cityName, office = '') {
    const trimmedCity = cityName.trim();

    if (!trimmedCity) {
      setError('Enter a city name to search.');
      setStatus('error');
      return;
    }

    setExactCoordinates(null);
    await loadWeather({ city: trimmedCity, ...(office ? { office } : {}) });
  }

  async function searchPostalCode(code, office = '') {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Enter a postal code to search.');
      setStatus('error');
      return;
    }

    setExactCoordinates(null);
    await loadWeather({ postalCode: trimmedCode, ...(office ? { office } : {}) });
  }

  function useExactLocation() {
    if (!navigator.geolocation) {
      setError('Exact location is not supported by this browser.');
      setStatus('error');
      return;
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!window.isSecureContext && !isLocalhost) {
      setError('Exact location requires HTTPS or localhost.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    resetResult();

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = Number(coords.latitude);
        const longitude = Number(coords.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setError('The browser returned invalid location coordinates.');
          setStatus('error');
          return;
        }

        setExactCoordinates({ latitude, longitude });

        try {
          const { data } = await api.get('/weather', {
            params: { latitude, longitude }
          });

          setWeather({
            ...data,
            latitude,
            longitude
          });
          setStatus('success');
        } catch (requestError) {
          setError(
            requestError.response?.data?.message ||
              'Could not load weather for your exact location.'
          );
          setStatus('error');
        }
      },
      (locationError) => {
        const messages = {
          1: 'Location permission was denied. Allow precise location access.',
          2: 'Your location is unavailable. Check Windows location settings.',
          3: 'Location detection timed out. Try again.'
        };

        setError(
          messages[locationError.code] ||
            'Unable to access your exact location.'
        );
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }

  async function addFavourite() {
    if (!weather || isFavourite) return;

    const latitude = Number(
      exactCoordinates?.latitude ?? weather.latitude ?? weather.lat
    );
    const longitude = Number(
      exactCoordinates?.longitude ?? weather.longitude ?? weather.lon
    );

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setToast('Exact coordinates are missing. Search again.');
      return;
    }

    try {
      await api.post('/cities', {
        name: weather.city || 'Current location',
        country: weather.country || '',
        latitude,
        longitude
      });

      setIsFavourite(true);
      setToast(`${weather.city || 'Location'} was added to your favourites.`);
    } catch (requestError) {
      setToast(
        requestError.response?.data?.message ||
          'Could not add this location to your favourites.'
      );
    }
  }

  useEffect(() => {
    if (requestedLatitude && requestedLongitude) {
      const latitude = Number(requestedLatitude);
      const longitude = Number(requestedLongitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setCity(requestedCity);
        setExactCoordinates({ latitude, longitude });
        loadWeather({ latitude, longitude });
      }
    } else if (requestedCity) {
      setCity(requestedCity);
      searchWeather(requestedCity);
    }
  }, [requestedCity, requestedLatitude, requestedLongitude]);

  function handleSubmit(event) {
    event.preventDefault();

    const value = city.trim();

    if (/^\d{3,10}$/.test(value)) {
      searchPostalCode(value);
    } else {
      searchWeather(value);
    }
  }

  return (
    <section className="search-page history-weather-page">
      <WeatherScene weather={weather} />
      <div className="page-heading">
        <p className="eyebrow">Live conditions</p>
        <h1>Find your weather</h1>
        <p>
          Search a city or postal code, or use your exact location for a
          five-day outlook.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <label htmlFor="city">City</label>

        <div className="search-controls">
          <input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="e.g. Lisbon"
            autoComplete="off"
          />

          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="search-secondary-controls">
          <label htmlFor="postal-code">Postal code / PIN code</label>

          <input
            id="postal-code"
            value={postalCode}
            placeholder="e.g. 531111"
            onChange={(event) => {
              setPostalCode(event.target.value);
              setPostalOffices([]);
            }}
          />

          <button
            type="button"
            onClick={() => searchPostalCode(postalCode)}
            disabled={status === 'loading'}
          >
            Search postal code
          </button>

          <button
            type="button"
            onClick={useExactLocation}
            disabled={status === 'loading'}
          >
            Use my exact location
          </button>
        </div>

        {postalOffices.length > 0 && (
          <div className="postal-office-picker" aria-label="Choose post office">
            <p>This PIN serves multiple post offices. Choose yours:</p>
            <div className="postal-office-options">
              {postalOffices.map((office) => (
                <button
                  key={office}
                  type="button"
                  onClick={() => searchPostalCode(postalCode, office)}
                  disabled={status === 'loading'}
                >
                  {office}
                </button>
              ))}
            </div>
          </div>
        )}

        {locationOptions.length > 0 && (
          <div className="postal-office-picker" aria-label="Choose location">
            <p>Several places match. Choose the one you mean:</p>
            <div className="postal-office-options">
              {locationOptions.map((location) => (
                <button
                  key={location.label}
                  type="button"
                  onClick={() => searchWeather(city, location.label)}
                  disabled={status === 'loading'}
                >
                  {location.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {status === 'loading' && (
        <div className="weather-skeleton" aria-live="polite">
          Loading weather...
        </div>
      )}

      {status === 'error' && (
        <p className="weather-message" role="alert">
          {error}
        </p>
      )}

      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}

      {weather && status === 'success' && (
        <div className="weather-results">
          <WeatherCard
            weather={weather}
            onAddFavourite={addFavourite}
            isFavourite={isFavourite}
          />

          <section className="forecast-section">
            <div className="section-heading">
              <h2>{weather.city} five-day forecast</h2>
            </div>

            <div className="forecast-grid">
              {weather.forecast?.map((day) => (
                <ForecastCard key={day.date} forecast={day} />
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}