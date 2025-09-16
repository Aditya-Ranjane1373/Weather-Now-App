import React, { useState, useEffect } from "react";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveTime, setLiveTime] = useState(null);

  useEffect(() => {
    let timer;
    if (weather && weather.utcDate) {

      //For After starting update the time every second
      timer = setInterval(() => {
        const nowUtc = new Date(); // Current real UTC time
        const localTimeStr = new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
          timeZone: weather.timezone,
        }).format(nowUtc);

        const indiaTimeStr = new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
          timeZone: "Asia/Kolkata",
        }).format(nowUtc);

        setLiveTime({ local: localTimeStr, india: indiaTimeStr });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [weather]);

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }
    setError("");
    setWeather(null);
    setLoading(true);
    setLiveTime(null);

    try {
      // 1) Geocoding
      const geoResp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1`
      );
      const geoData = await geoResp.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found. Try another city.");
        setLoading(false);
        return;
      }

      const g = geoData.results[0];
      const { latitude, longitude, name, country } = g;

      let tzName = g.timezone || null;
      if (!tzName) {
        try {
          const tzResp = await fetch(
            `https://api.open-meteo.com/v1/timezone?latitude=${latitude}&longitude=${longitude}`
          );
          const tzData = await tzResp.json();
          tzName = tzData.timezone || "UTC";
        } catch (e) {
          tzName = "UTC";
        }
      }

      // 2) Weather data (temperature, wind,)
      const weatherResp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=UTC`
      );
      const weatherData = await weatherResp.json();

      if (!weatherData.current_weather) {
        setError("Weather data unavailable for this location.");
        setLoading(false);
        return;
      }

      setWeather({
        city: name,
        country,
        temperature: weatherData.current_weather.temperature,
        windspeed: weatherData.current_weather.windspeed,
        utcDate: new Date(), // This is for the live clock 
        timezone: tzName,
      });
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center mt-5">
      <h1 className="mb-4 text-primary">🌦️ Weather Now</h1>

      <div className="input-group mb-3 w-50">
        <input
          type="text"
          className="form-control"
          placeholder="Enter city name (e.g. Mumbai)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={fetchWeather}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Loading...
            </>
          ) : (
            "Get Weather"
          )}
        </button>
      </div>

      {error && <div className="alert alert-danger w-50">{error}</div>}

      {weather && (
        <div className="card text-center shadow p-3 mb-5 bg-body rounded w-50">
          <div className="card-body">
            <h4 className="card-title">
              {weather.city}, {weather.country}
            </h4>

            <p className="card-text fs-5">
              🌡️ Temperature: <strong>{weather.temperature}°C</strong>
            </p>
            <p className="card-text">💨 Wind Speed: {weather.windspeed} km/h</p>

            {/* Live Times */}
            {liveTime && (
              <div className="d-flex flex-column gap-2 mt-3">
                <span className="badge bg-info text-dark p-2">
                  ⏰ Local ({weather.timezone}): {liveTime.local}
                </span>
                <span className="badge bg-warning text-dark p-2">
                  🇮🇳 India (IST): {liveTime.india}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
