import React, { useState } from 'react';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';

const api = {
  key: process.env.REACT_APP_API_KEY || '',
  url: process.env.REACT_APP_API_URL || ''
};

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState({});
  const [defaultMessage, setdefaultMessage] = useState("Please Enter a City Name");

  const availableCityListJSON = async (city) => {
    try {
      // Fetch the Excel file from the URL
      const response = await fetch('/assets/cities_list.xlsx');
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      
      // Get the first sheet in the workbook
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
  
      // Convert the sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 'A', raw: false });
      
      console.log(jsonData);
  
      console.log('Conversion complete. JSON data saved to cities.json');
    } catch (e) {
      console.error('Error fetching or converting Excel file:', e.message);
    }
  };

  const debouncedSearch = debounce(async (query) => {
    try {
      const response = await fetch(`${api.url}weather?q=${query}&units=metric&appid=${api.key}`) || { "cod": "404", "message": "city not found" };
      const result = await response.json();
      setWeather(result);
      setQuery("");
      if (!response.ok) {
        setdefaultMessage(`"${query}" ${result.message}`);
        setWeather({});
      }
    } catch (e) {
      console.log('Error fetching weather data:', e.message);
    }
  }, 300);

  const handleSearch = (evt) => {
    if (evt.key === 'Enter' && query !== '') {
      availableCityListJSON(query);
      debouncedSearch(query);
    }
  };

  const dateBuilder = (d) => {
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let day = days[d.getDay()];
    let date = d.getDate();
    let month = months[d.getMonth()];
    let year = d.getFullYear();

    return `${day} ${date}, ${month} ${year}`;
  };

  return (
    <div className={`app ${typeof weather.main !== "undefined" && weather.main.temp > 16 ? "warm" : ""}`}>
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
