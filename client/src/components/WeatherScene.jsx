const conditionClass = (weather) => {
  const current = weather?.current || {};
  const condition = current.condition?.toLowerCase() || '';
  const icon = current.icon?.toLowerCase() || '';
  const isNight = current.isDay === false || current.isDay === 0 ||
    current.is_day === 0 || (current.isDay == null && icon.endsWith('n'));

  if (condition.includes('thunder')) return { name: 'thunderstorm', isNight };
  if (condition.includes('snow')) return { name: 'snow', isNight };
  if (condition.includes('rain') || condition.includes('drizzle')) {
    return {
      name: condition.includes('heavy') ? 'heavy-rain' : 'rain',
      isNight
    };
  }
  if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
    return { name: 'fog', isNight };
  }
  if (condition.includes('partly')) return { name: 'partly-cloudy', isNight };
  if (condition.includes('cloud') || condition.includes('overcast')) return { name: 'cloudy', isNight };
  if (condition.includes('clear') || condition.includes('sunny')) {
    return { name: isNight ? 'clear-night' : 'sunny', isNight };
  }

  return { name: 'unknown', isNight };
};

export default function WeatherScene({ weather }) {
  const { name: sceneClass, isNight } = conditionClass(weather);

  return (
    <div className={`weather-scene weather-scene--${sceneClass}${isNight ? ' weather-scene--night' : ''}`} aria-hidden="true">
      <div className="weather-scene-sky" />
      <div className="weather-scene-stars" />
      <div className="weather-scene-moon" />
      <div className="weather-scene-sun" />
      <div className="weather-scene-rays" />
      <div className="weather-scene-cloud weather-scene-cloud-one" />
      <div className="weather-scene-cloud weather-scene-cloud-two" />
      <div className="weather-scene-cloud weather-scene-cloud-three" />
      <div className="weather-scene-rain weather-scene-rain-one" />
      <div className="weather-scene-rain weather-scene-rain-two" />
      <div className="weather-scene-snow" />
      <div className="weather-scene-fog" />
      <div className="weather-scene-lightning" />
      <div className="weather-scene-haze" />
    </div>
  );
}
