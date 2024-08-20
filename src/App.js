// Importing the necessary packages
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import cityListJSON from './assets/city_list.json';

// API configuration
const api = {
  key: process.env.REACT_APP_API_KEY || '',
  url: process.env.REACT_APP_API_URL || ''
};

// Constants for debounce and temperature threshold
const DEBOUNCE_DELAY = 300;
const TEMPERATURE_THRESHOLD = 16;

// Main App component
const App = () => {
  // State variables
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState({});
  const [defaultMessage, setDefaultMessage] = useState('Please Enter a City Name');
  const [loading, setLoading] = useState(false);

  const removeTrailingSpace = (str) => {
    return str.replace(/\s+$/g, "");
  };
  
  // Function to sanitize query
  const sanitizeQuery = (str) => {
    const dataArray = str.split(',');
    const city = removeTrailingSpace(dataArray[0].trim());

    if (dataArray.length === 1) {
      return [city];
    } 
    
    if (dataArray.length === 2) {
      const countryCode = removeTrailingSpace(dataArray[1].toUpperCase().trim());
      return [city, countryCode];
    }

    return [''];
  };

  // Function to return a proper search query
  const getAPIQuery = async (city, countryCode = "") => {
    try {
      // Get city list from a JSON file
      const responseJSON = cityListJSON;

      // Check if the city is present in the list (with optional country check)
      const foundCity = responseJSON.find((entry) => entry.name.toLowerCase() === city.toLowerCase() && (countryCode === "" || entry.country === countryCode));

      if (foundCity) {
        countryCode = countryCode === "" ? foundCity.country : countryCode
        return `${city},${countryCode}`;
      }

      setDefaultMessage(`"${query}" city not found in the database`);
      return '';
    } catch (error) {
      console.error('Error validating query:', error);
      return '';
    }
  };

  // Function to fetch weather data from the API
  const fetchWeatherData = async () => {
    setWeather({});
    const apiQuery = await getAPIQuery(...sanitizeQuery(query));

    if (apiQuery === '') {
      setLoading(false);
      setQuery('');
      return
    } 

    try {
      // Fetch weather data from the API
      const response = await axios.get(`${api.url}weather`, {
        params: {
          q: apiQuery,
          units: 'metric',
          appid: api.key
        }
      });
      const result = await response.data;
      setWeather(result.cod === 200 ? result : {});
    } catch (error) {
      console.log("ERROR (fetchWeatherData):", error);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  // Debounced function to fetch weather data
  const fetchWeather = debounce(async () => {
    setLoading(true);
    await fetchWeatherData();
  }, DEBOUNCE_DELAY);

  // Function to handle the search when the Enter key is pressed
  const handleSearch = async (evt) => {
    if (evt.key === 'Enter') {
      if (query === '') {
        setDefaultMessage('Please Enter a City Name');
        setWeather({});
        return
      }

      setDefaultMessage('Loading...');
      fetchWeather();
    }
    return
  };

  // Memoized function to build the date
  const dateBuilder = useMemo(() => (d) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const day = days[d.getDay()];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${date}, ${month} ${year}`;
  }, []);

  // Determine weather class based on temperature
  const weatherClass = weather.main && weather.main.temp > TEMPERATURE_THRESHOLD ? 'warm' : '';

  // Render the main UI
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
