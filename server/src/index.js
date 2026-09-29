import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(serverDirectory, '..', 'data.json');
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || 'local-weather-explorer-development-secret';
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));

let database = { users: [], cities: [], history: [] };
let pendingWrite = Promise.resolve();

async function loadDatabase() {
  try {
    database = JSON.parse(await readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(path.dirname(dataFile), { recursive: true });
    await saveDatabase();
  }
}

function saveDatabase() {
  pendingWrite = pendingWrite.then(() =>
    writeFile(dataFile, JSON.stringify(database, null, 2), 'utf8')
  );
  return pendingWrite;
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

function createToken(user) {
  return jwt.sign({ sub: user._id }, jwtSecret, { expiresIn: '7d' });
}

function requireAuth(request, response, next) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  try {
    const payload = jwt.verify(token, jwtSecret);
    request.user = database.users.find((user) => user._id === payload.sub);
    if (!request.user) return response.status(401).json({ error: 'Account not found.' });
    next();
  } catch {
    response.status(401).json({ error: 'Please log in to continue.' });
  }
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return response.status(400).json({ error: 'Enter a name, valid email, and password with at least 6 characters.' });
    }
    if (database.users.some((user) => user.email === email)) {
      return response.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = {
      _id: randomUUID(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10)
    };
    database.users.push(user);
    await saveDatabase();
    response.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    const user = database.users.find((entry) => entry.email === email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    response.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json({ user: publicUser(request.user) });
});

const weatherDescriptions = new Map([
  [0, 'Clear sky'], [1, 'Mainly clear'], [2, 'Partly cloudy'], [3, 'Overcast'],
  [45, 'Fog'], [48, 'Rime fog'], [51, 'Light drizzle'], [53, 'Drizzle'],
  [55, 'Heavy drizzle'], [56, 'Freezing drizzle'], [57, 'Heavy freezing drizzle'],
  [61, 'Light rain'], [63, 'Rain'], [65, 'Heavy rain'], [66, 'Freezing rain'],
  [67, 'Heavy freezing rain'], [71, 'Light snow'], [73, 'Snow'], [75, 'Heavy snow'],
  [77, 'Snow grains'], [80, 'Rain showers'], [81, 'Rain showers'], [82, 'Heavy rain showers'],
    [85, 'Snow showers'], [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'], [96, 'Thunderstorm with hail'], [99, 'Thunderstorm with hail']
]);

function weatherIcon(code, isDay) {
  if (code >= 95) return '11d';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '13d';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '10d';
  if ([45, 48].includes(code)) return '50d';
  if (code === 0) return isDay ? '01d' : '01n';
  if (code === 1) return isDay ? '02d' : '02n';
  if (code === 2) return isDay ? '03d' : '03n';
  return '04d';
}

async function resolveLocation(query) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  const result = await fetch(url);
  if (!result.ok) throw new Error('Location search is temporarily unavailable.');
  const data = await result.json();
  return data.results?.[0] || null;
}

async function resolveIndianPostOffice(query, selectedOffice) {
  const response = await fetch(
    `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Location search is temporarily unavailable.');

  const [lookup] = await response.json();
  const offices = (lookup?.Status === 'Success' ? lookup.PostOffice || [] : [])
    .filter((office) => office.Name.toLowerCase() === query.toLowerCase());
  const options = offices.map((office) => ({
    label: `${office.Name}, ${office.District}, ${office.State} (${office.Pincode})`,
    ...office
  }));

  if (!selectedOffice && options.length > 1) return { locations: options };
  const office = selectedOffice
    ? options.find((option) => option.label === selectedOffice)
    : options[0];
  if (!office) return null;

  const coordinates = await resolveLocation(office.Pincode)
    || await resolveLocation(`${office.District}, ${office.State}`)
    || await resolveLocation(office.District);
  if (!coordinates) return null;

  return { ...coordinates, name: office.Name, country: office.Country || 'India' };
}

async function resolvePostalCode(postalCode, officeName) {
  if (!/^\d{6}$/.test(postalCode)) return null;

  const response = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
  if (!response.ok) throw new Error('Postal code lookup is temporarily unavailable.');
  const [lookup] = await response.json();
  const offices = lookup?.Status === 'Success' ? lookup.PostOffice || [] : [];
  if (offices.length > 1 && !officeName) {
    return { offices: offices.map((office) => office.Name) };
  }

  const office = officeName
    ? offices.find((entry) => entry.Name === officeName)
    : offices[0];
  if (!office) return null;

  const coordinates = await resolveLocation(office.Name)
    || await resolveLocation(office.District);
  if (!coordinates) return null;

  return {
    ...coordinates,
    name: office.Name,
    country: 'India'
  };
}

async function loadWeather(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '5');
  const result = await fetch(url);
  if (!result.ok) throw new Error('Weather service is temporarily unavailable.');
  return result.json();
}

app.get('/api/weather', requireAuth, async (request, response, next) => {
  try {
    const { city, postalCode, office } = request.query;
    let latitude = Number(request.query.latitude);
    let longitude = Number(request.query.longitude);
    let location = null;

    if (city || postalCode) {
      const query = String(city || postalCode).trim();
      if (!query) return response.status(400).json({ message: 'Enter a city or postal code.' });
      location = postalCode
        ? await resolvePostalCode(query, office)
        : await resolveLocation(query) || await resolveIndianPostOffice(query, office);
      if (!location) return response.status(404).json({ message: 'Location was not found.' });
      if (location.locations) {
        return response.status(409).json({ locations: location.locations });
      }
      if (location.offices) {
        return response.status(409).json({ offices: location.offices });
      }
      latitude = location.latitude;
      longitude = location.longitude;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return response.status(400).json({ message: 'Provide a valid city or coordinate pair.' });
    }

    const data = await loadWeather(latitude, longitude);
    const current = data.current;
    const code = current.weather_code;
    const output = {
      city: location?.name || 'Current location',
      country: location?.country || '',
      latitude,
      longitude,
      postalCode: postalCode ? String(postalCode) : '',
      current: {
        isDay: current.is_day === 1,
        tempC: current.temperature_2m,
        feelsLikeC: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windKph: current.wind_speed_10m,
        condition: weatherDescriptions.get(code) || 'Unknown conditions',
        icon: weatherIcon(code, current.is_day === 1),
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0]
      },
      forecast: data.daily.time.map((date, index) => {
        const forecastCode = data.daily.weather_code[index];
        return {
          date,
          condition: weatherDescriptions.get(forecastCode) || 'Unknown conditions',
          icon: weatherIcon(forecastCode, true),
          maxTempC: data.daily.temperature_2m_max[index],
          minTempC: data.daily.temperature_2m_min[index]
        };
      })
    };

    database.history.push({
      _id: randomUUID(),
      userId: request.user._id,
      city: output.city,
      latitude,
      longitude,
      searchedAt: new Date().toISOString()
    });
    await saveDatabase();
    response.json(output);
  } catch (error) {
    next(error);
  }
});

app.get('/api/cities', requireAuth, (request, response) => {
  response.json(database.cities.filter((city) => city.userId === request.user._id));
});

app.post('/api/cities', requireAuth, async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const latitude = Number(request.body.latitude);
    const longitude = Number(request.body.longitude);
    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return response.status(400).json({ message: 'A city name and valid coordinates are required.' });
    }

    const existing = database.cities.find((city) =>
      city.userId === request.user._id && city.latitude === latitude && city.longitude === longitude
    );
    if (existing) return response.status(409).json({ message: 'This location is already in your favourites.' });

    const favourite = {
      _id: randomUUID(),
      userId: request.user._id,
      name,
      country: String(request.body.country || ''),
      latitude,
      longitude
    };
    database.cities.push(favourite);
    await saveDatabase();
    response.status(201).json(favourite);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/cities/:id', requireAuth, async (request, response, next) => {
  try {
    const initialCount = database.cities.length;
    database.cities = database.cities.filter((city) =>
      city._id !== request.params.id || city.userId !== request.user._id
    );
    if (database.cities.length === initialCount) return response.status(404).json({ message: 'Favourite not found.' });
    await saveDatabase();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/history', requireAuth, (request, response) => {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
  const entries = database.history
    .filter((entry) => entry.userId === request.user._id)
    .sort((left, right) => right.searchedAt.localeCompare(left.searchedAt));
  response.json({
    entries: entries.slice((page - 1) * limit, page * limit),
    pages: Math.max(1, Math.ceil(entries.length / limit))
  });
});

app.delete('/api/history', requireAuth, async (request, response, next) => {
  try {
    database.history = database.history.filter((entry) => entry.userId !== request.user._id);
    await saveDatabase();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete('/api/history/:id', requireAuth, async (request, response, next) => {
  try {
    const initialCount = database.history.length;
    database.history = database.history.filter((entry) =>
      entry._id !== request.params.id || entry.userId !== request.user._id
    );
    if (database.history.length === initialCount) return response.status(404).json({ message: 'History entry not found.' });
    await saveDatabase();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: error.message || 'The server encountered an error.' });
});

await loadDatabase();
app.listen(port, () => console.log(`Weather API listening at http://localhost:${port}`));