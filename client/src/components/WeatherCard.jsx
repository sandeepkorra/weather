function iconUrl(icon) {
  return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';
}

function formatTime(value) {
  if (!value) return 'Unavailable';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function WeatherCard({ weather, onAddFavourite, isFavourite }) {
  const { current } = weather;

  return (
    <article className="weather-card">
      <div className="weather-card-header">
        <div><p className="eyebrow">Current weather</p><h2>{weather.city}{weather.country && `, ${weather.country}`}</h2><small className="location-meta">{weather.postalCode ? `Postal code ${weather.postalCode} | ` : ''}{weather.latitude?.toFixed(4)}°, {weather.longitude?.toFixed(4)}°</small></div>
        <button type="button" onClick={onAddFavourite} disabled={isFavourite}>
          {isFavourite ? 'Added' : 'Add to favourites'}
        </button>
      </div>
      <div className="current-weather">
        {current.icon && <img src={iconUrl(current.icon)} alt={current.condition} />}
        <div><strong>{Math.round(current.tempC)}°C</strong><p>{current.condition}</p></div>
      </div>
      <dl className="weather-details">
        <div><dt>Feels like</dt><dd>{Math.round(current.feelsLikeC)}°C</dd></div>
        <div><dt>Humidity</dt><dd>{current.humidity}%</dd></div>
        <div><dt>Wind</dt><dd>{Math.round(current.windKph)} km/h</dd></div>
        <div><dt>Sunrise</dt><dd>{formatTime(current.sunrise)}</dd></div>
        <div><dt>Sunset</dt><dd>{formatTime(current.sunset)}</dd></div>
      </dl>
    </article>
  );
}