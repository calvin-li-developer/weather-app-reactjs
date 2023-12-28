import React, { useState, useMemo } from 'react';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';

const api = {
  key: process.env.REACT_APP_API_KEY || '',
  url: process.env.REACT_APP_API_URL || ''
};

const DEBOUNCE_DELAY = 300;
const TEMPERATURE_THRESHOLD = 16;

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState({});
  const [defaultMessage, setdefaultMessage] = useState("Please Enter a City Name");

  const isValidCity = async (city) => {
    try {
      // Fetch the Excel file from the URL
      const response = await fetch(`/weather-app-reactjs/assets/cities_list.xlsx`)
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

      // Get the first sheet in the workbook
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert the sheet to JSON
      const cityJSONData = XLSX.utils.sheet_to_json(sheet);

      // Check if query in CityJSONData
      const inCityJSONData = cityJSONData.some(obj => obj.name === city);

      return inCityJSONData;
    } catch (e) {
      console.error('Error:', e);
      return false;
    }
  };

  const fetchWeather = debounce(async (query) => {
    try {
      const response = await fetch(`${api.url}weather?q=${query}&units=metric&appid=${api.key}`);
      const result = await response.json();
      setWeather(result);
    } catch (e) {
      console.log('Error fetching weather data:', e.message);
    }
  }, DEBOUNCE_DELAY);

  const handleSearch = async (evt) => {
    if (evt.key === 'Enter') {
      if (query === '') {
        setdefaultMessage("Please Enter a City Name");
        setWeather({});
      }
      else if (await isValidCity(query) == true) {
        fetchWeather(query);
      } else {
        setdefaultMessage(`"${query}" city not found in database`);
        setWeather({});
      }
      setQuery("");
    }
  };

  const dateBuilder = useMemo(() => (d) => {
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let day = days[d.getDay()];
    let date = d.getDate();
    let month = months[d.getMonth()];
    let year = d.getFullYear();

    return `${day} ${date}, ${month} ${year}`;
  }, []);

  return (
    <div className={`app ${weather.main && weather.main.temp > TEMPERATURE_THRESHOLD ? "warm" : ""}`}>
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
        {(typeof weather.main != "undefined") ? (
          <div>
            <div className="location-box">
              <div className="location">{weather.name}, {weather.sys.country}</div>
              <div className="date">{dateBuilder(new Date())}</div>
            </div>
            <div className="weather-box">
              <div className="temp">
                {Math.round(weather.main.temp)}°C
              </div>
              <div className="weather">{weather.weather[0].main}</div>
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
