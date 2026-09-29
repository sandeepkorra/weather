function iconUrl(icon) {
  return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(date));
}

export default function ForecastCard({ forecast }) {
  return (
    <article className="forecast-card">
      <h3>{formatDate(forecast.date)}</h3>
      {forecast.icon && <img src={iconUrl(forecast.icon)} alt={forecast.condition} />}
      <p>{forecast.condition}</p>
      <strong>{Math.round(forecast.maxTempC)}° / {Math.round(forecast.minTempC)}°C</strong>
    </article>
  );
}