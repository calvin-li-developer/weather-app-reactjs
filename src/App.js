import React, { useState, useMemo } from 'react';
import { debounce } from 'lodash';

const api = {
  key: process.env.REACT_APP_API_KEY || '',
  url: process.env.REACT_APP_API_URL || ''
};

const DEBOUNCE_DELAY = 300;
const TEMPERATURE_THRESHOLD = 16;

const App = () => {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState({});
  const [defaultMessage, setDefaultMessage] = useState('Please Enter a City Name');
  const [loading, setLoading] = useState(false);

  const capitalizeEveryWord = (str) => {
    return str.replace(/\b\w/g, (match) => match.toUpperCase());
  };

  const isValidQuery = async (query) => {
    try {
      let city = query;
      let country = "";
      if (query.includes(',')) {
        let queryArray = query.split(',');
        city = queryArray[0];
        country = queryArray[1];
      }
      const response = await fetch(`${process.env.PUBLIC_URL}/assets/city_list.json`);
      const responseJSON = await response.json();
      let validQuery = responseJSON.find(entry => entry.name === city);
      if (country !== "") {
        validQuery = responseJSON.find(entry => entry.name === city && entry.country === country);
      }

      return validQuery;
    } catch (error) {
      console.error('Error validating query:', error);
      return false;
    }
  };

  const fetchWeatherData = async (query) => {
    try {
      const response = await fetch(`${api.url}weather?q=${query}&units=metric&appid=${api.key}`);
      const result = await response.json();
      setWeather(result);
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      setDefaultMessage(`Error fetching weather data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = debounce(async (query) => {
    setLoading(true);
    await fetchWeatherData(query);
  }, DEBOUNCE_DELAY);

  const handleSearch = async (evt) => {
    if (evt.key === 'Enter') {
      if (query === '') {
        setDefaultMessage('Please Enter a City Name');
        setWeather({});
      } else {
        setDefaultMessage(`Loading...`);
        const sanitizeQuery = capitalizeEveryWord(query);
        const validQuery = await isValidQuery(sanitizeQuery);
        if (validQuery) {
          fetchWeather(sanitizeQuery);
        } else {
          setDefaultMessage(`"${query}" city not found in database`);
          setWeather({});
        }
      }
      setQuery('');
    }
  };

  const dateBuilder = useMemo(() => (d) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const day = days[d.getDay()];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${date}, ${month} ${year}`;
  }, []);

  const weatherClass = weather.main && weather.main.temp > TEMPERATURE_THRESHOLD ? 'warm' : '';

  return (
    <div className={`app ${weatherClass}`}>
      <main>
        <div className="search-box">
          <input
            type="text"
            className="search-bar"
            placeholder="Search for a city..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            onKeyPress={handleSearch}
          />
        </div>
        {(loading || weather.main) ? (
          <div>
            <div className="location-box">
              <div className="location">
                {loading ? 'Loading...' : `${weather.name}, ${weather.sys && weather.sys.country}`}
              </div>
              <div className="date">{loading ? '' : dateBuilder(new Date())}</div>
            </div>
            <div className={`${loading ? '' : "weather-box"}`}>
              <div className="temp">
                {loading ? '' : `${Math.round(weather.main.temp)}°C`}
              </div>
              <div className="weather">{loading ? '' : weather.weather && weather.weather[0].main}</div>
            </div>
          </div>
        ) : (
          <div>
            <div className="location-box">
              <div className="location">{defaultMessage}</div>
              <div className="date"></div>
            </div>
            <div className="weather-box">
              <div className="weather"></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
