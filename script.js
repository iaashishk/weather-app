document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const searchForm = document.getElementById("search-form");
  const cityInput = document.getElementById("city-input");
  const unitToggle = document.getElementById("unit-toggle");

  const setupNotice = document.getElementById("setup-notice");
  const skeleton = document.getElementById("skeleton");
  const errorCard = document.getElementById("error-card");
  const errorText = document.getElementById("error-text");
  const emptyState = document.getElementById("empty-state");
  const weatherInfo = document.getElementById("weather-info");

  const conditionIcon = document.getElementById("condition-icon");
  const cityNameDisplay = document.getElementById("city-name");
  const temperatureDisplay = document.getElementById("temperature");
  const feelsLikeDisplay = document.getElementById("feels-like");
  const descriptionDisplay = document.getElementById("description");
  const statHumidity = document.getElementById("stat-humidity");
  const statWind = document.getElementById("stat-wind");
  const statPressure = document.getElementById("stat-pressure");
  const statVisibility = document.getElementById("stat-visibility");
  const lastUpdated = document.getElementById("last-updated");

  const STATE_CARDS = [setupNotice, skeleton, errorCard, emptyState, weatherInfo];

  const ICONS = {
    "clear-day": `<circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="3"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M32 6v8"/><path d="M32 50v8"/><path d="M6 32h8"/><path d="M50 32h8"/><path d="M13.5 13.5l5.6 5.6"/><path d="M44.9 44.9l5.6 5.6"/><path d="M13.5 50.5l5.6-5.6"/><path d="M44.9 19.1l5.6-5.6"/></g>`,
    "clear-night": `<path d="M40 8a24 24 0 1 0 16 40A20 20 0 0 1 40 8z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
    clouds: `<path d="M20 44a10 10 0 0 1 1-19.9A14 14 0 0 1 47 30a9 9 0 0 1-1 18H20z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
    "few-clouds": `<circle cx="21" cy="19" r="7.5" stroke="currentColor" stroke-width="2.6"/><path d="M23 44a10 10 0 0 1 1-19.9 13.9 13.9 0 0 1 3.8.5A14 14 0 0 1 50 30a9 9 0 0 1-1 18H23z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
    rain: `<path d="M18 34a10 10 0 0 1 1-19.9A14 14 0 0 1 45 20a9 9 0 0 1-1 18H18z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M22 46l-3 7"/><path d="M33 46l-3 7"/><path d="M44 46l-3 7"/></g>`,
    storm: `<path d="M18 30a10 10 0 0 1 1-19.9A14 14 0 0 1 45 16a9 9 0 0 1-1 18H18z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M35 34l-9 13h7l-4 11 13-15h-7l4-9z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>`,
    snow: `<path d="M18 32a10 10 0 0 1 1-19.9A14 14 0 0 1 45 18a9 9 0 0 1-1 18H18z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M23 46v8M19.5 48.5l7-5M19.5 51.5l7-5"/><path d="M41 46v8M37.5 48.5l7-5M37.5 51.5l7-5"/></g>`,
    mist: `<path d="M18 26a9 9 0 0 1 1-17.9A12.6 12.6 0 0 1 43 14a8 8 0 0 1-1 16H18z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 40h40"/><path d="M12 50h40"/></g>`,
  };

  const state = {
    unit: "metric", // "metric" | "imperial"
    lastData: null,
  };

  init();

  function init() {
    if (!hasApiKey()) {
      showOnly(setupNotice);
    } else {
      showOnly(emptyState);
    }

    searchForm.addEventListener("submit", handleSubmit);
    unitToggle.addEventListener("click", handleUnitToggle);
  }

  function hasApiKey() {
    return typeof API_KEY === "string" && API_KEY.trim() && !API_KEY.startsWith("YOUR_");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;

    if (!hasApiKey()) {
      showOnly(setupNotice);
      return;
    }

    showOnly(skeleton);

    try {
      const data = await fetchWeatherData(city);
      state.lastData = data;
      renderWeather(data);
      showOnly(weatherInfo);
    } catch (error) {
      errorText.textContent =
        error.code === 404
          ? "City not found. Check the spelling and try again."
          : "Something went wrong fetching the weather. Please try again.";
      showOnly(errorCard);
    }
  }

  async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      const err = new Error("Weather request failed");
      err.code = response.status;
      throw err;
    }

    return response.json();
  }

  function handleUnitToggle() {
    state.unit = state.unit === "metric" ? "imperial" : "metric";
    unitToggle.textContent = state.unit === "metric" ? "°C" : "°F";
    unitToggle.setAttribute("aria-pressed", String(state.unit === "imperial"));
    if (state.lastData) renderWeather(state.lastData);
  }

  function renderWeather(data) {
    const { name, main, weather, wind, visibility } = data;
    const condition = weather[0];
    const isImperial = state.unit === "imperial";

    const temp = isImperial ? cToF(main.temp) : main.temp;
    const feelsLike = isImperial ? cToF(main.feels_like) : main.feels_like;
    const windSpeed = isImperial ? msToMph(wind.speed) : wind.speed;
    const visibilityDist = isImperial ? metersToMiles(visibility) : (visibility ?? 0) / 1000;

    cityNameDisplay.textContent = name;
    temperatureDisplay.textContent = Math.round(temp);
    feelsLikeDisplay.textContent = `Feels like ${Math.round(feelsLike)}°`;
    descriptionDisplay.textContent = condition.description;

    statHumidity.textContent = `${main.humidity}%`;
    statWind.textContent = `${windSpeed.toFixed(1)} ${isImperial ? "mph" : "m/s"}`;
    statPressure.textContent = `${main.pressure} hPa`;
    statVisibility.textContent = `${visibilityDist.toFixed(1)} ${isImperial ? "mi" : "km"}`;

    const conditionKey = mapConditionKey(condition.id, condition.icon);
    app.dataset.condition = conditionKey.theme;
    conditionIcon.innerHTML = ICONS[conditionKey.icon];

    lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  function mapConditionKey(id, icon) {
    const isNight = icon.endsWith("n");

    if (id >= 200 && id < 300) return { theme: "storm", icon: "storm" };
    if (id >= 300 && id < 600) return { theme: "rain", icon: "rain" };
    if (id >= 600 && id < 700) return { theme: "snow", icon: "snow" };
    if (id >= 700 && id < 800) return { theme: "mist", icon: "mist" };
    if (id === 800) return { theme: "clear", icon: isNight ? "clear-night" : "clear-day" };
    if (id === 801) return { theme: "clouds", icon: "few-clouds" };
    return { theme: "clouds", icon: "clouds" };
  }

  function showOnly(target) {
    STATE_CARDS.forEach((el) => {
      el.hidden = el !== target;
    });
  }

  function cToF(c) {
    return (c * 9) / 5 + 32;
  }

  function msToMph(ms) {
    return ms * 2.23694;
  }

  function metersToMiles(m) {
    return (m ?? 0) / 1609.34;
  }
});