// Importing the necessary packages
import React, { useState, useMemo } from 'react';
import { debounce } from 'lodash';

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

  // Function to sanitize query
  const sanitizeQuery = (str) => {
    const dataArray = str.split(',');
    if (dataArray.length === 1) {
      return str.replace(/\s+$/g, "").replace(/\b\w/g, (match) => match.toUpperCase());
    } else if (dataArray.length === 2) {
      return `${dataArray[0].replace(/\s+$/g, "").replace(/\b\w/g, (match) => match.toUpperCase())},${dataArray[1].toUpperCase().replace(/\s+$/g, "")}`;
    }
    return '';
  };

  // Function to return a proper search query
  const getSearchQuery = async (query) => {
    try {
      let city = query;
      let countryCode = "";

      // Extract city and country from query
      if (query.includes(',')) {
        let queryArray = query.split(',');
        city = queryArray[0];
        countryCode = queryArray[1].toUpperCase();
      }

      // Fetch city list from a JSON file
      const response = await fetch(`${process.env.PUBLIC_URL}/assets/city_list.json`);
      const responseJSON = await response.json();

      // Check if the city is present in the list (with optional country check)
      const foundCity = responseJSON.find((entry) => entry.name === city && (countryCode === "" || entry.country === countryCode));

      if (foundCity) {
        countryCode = countryCode === "" ? foundCity.country : countryCode
        return `${city},${countryCode}`;
      }
      return false;
    } catch (error) {
      console.error('Error validating query:', error);
      return false;
    }
  };

  // Function to fetch weather data from the API
  const fetchWeatherData = async (query) => {
    try {
      // Fetch weather data from the API
      const response = await fetch(`${api.url}weather?q=${query}&units=metric&appid=${api.key}`);
      const result = await response.json();
      setWeather(result);
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      setDefaultMessage('Error fetching weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced function to fetch weather data
  const fetchWeather = debounce(async (query) => {
    setLoading(true);
    await fetchWeatherData(query);
  }, DEBOUNCE_DELAY);

  // Function to handle the search when the Enter key is pressed
  const handleSearch = async (evt) => {
    if (evt.key === 'Enter') {
      if (query === '') {
        setDefaultMessage('Please Enter a City Name');
        setWeather({});
      } else {
        setDefaultMessage('Loading...');
        const searchQuery = await getSearchQuery(sanitizeQuery(query));
        if (searchQuery) {
          fetchWeather(searchQuery);
        } else {
          setDefaultMessage(`"${query}" city not found in the database`);
          setWeather({});
        }
      }
      setQuery('');
    }
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
