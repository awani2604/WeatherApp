import React, { useEffect, useRef, useState } from 'react'
import './Weather.css'
 
import Search_Icon  from '../assets/search.png'
import cloud_Icon   from '../assets/cloud.png'
import clear_Icon   from '../assets/clear.png'
import rain_Icon    from '../assets/rain.png'
import snow_Icon    from '../assets/snow.png'
import drizzle_Icon from '../assets/drizzle.png'
import wind_Icon    from '../assets/wind.png'
import humidity_Icon from '../assets/humidity.png'
 
const allIcons = {
  "01d": clear_Icon,  "01n": clear_Icon,
  "02d": cloud_Icon,  "02n": cloud_Icon,
  "03d": cloud_Icon,  "03n": cloud_Icon,
  "04d": drizzle_Icon,"04n": drizzle_Icon,
  "09d": rain_Icon,   "09n": rain_Icon,
  "10d": rain_Icon,   "10n": rain_Icon,
  "13d": snow_Icon,   "13n": snow_Icon,
}
 
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
 
/* ── Generate stars once ── */
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  size:   Math.random() * 2.5 + 1,
  top:    Math.random() * 95,
  left:   Math.random() * 100,
  dur:    (2 + Math.random() * 4).toFixed(1) + 's',
  delay:  (Math.random() * 5).toFixed(1) + 's',
  bright: (0.4 + Math.random() * 0.6).toFixed(2),
}))
 
const SHOOTS = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  top:    Math.random() * 40,
  left:   Math.random() * 60,
  sdur:   (1.5 + Math.random() * 1.5).toFixed(1) + 's',
  sdelay: (i * 4 + Math.random() * 4).toFixed(1) + 's',
}))
 
const Weather = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [forecast, setForecast]       = useState([])
  const [activeDay, setActiveDay]     = useState(0)
  const inputRef = useRef()
 
  /* ── Fetch current weather ── */
  const fetchCurrent = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.cod === "404") throw new Error("City not found")
 
    return {
      humidity  : data.main.humidity,
      location  : data.name,
      country   : data.sys.country,
      temp      : Math.floor(data.main.temp),
      feelsLike : Math.floor(data.main.feels_like),
      windSpeed : data.wind.speed,
      desc      : data.weather[0].description,
      icon      : allIcons[data.weather[0].icon] || clear_Icon,
    }
  }
 
  /* ── Fetch 5-day forecast ── */
  const fetchForecast = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=40&appid=${import.meta.env.VITE_APP_ID}`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.cod !== "200") return []
 
    // one entry per day (noon reading)
    const seen = new Set()
    return data.list
      .filter(item => {
        const d = new Date(item.dt * 1000)
        const dateStr = d.toDateString()
        if (seen.has(dateStr)) return false
        seen.add(dateStr)
        return true
      })
      .slice(0, 5)
      .map(item => {
        const d = new Date(item.dt * 1000)
        return {
          dayName : DAY_NAMES[d.getDay()],
          hi      : Math.floor(item.main.temp_max),
          lo      : Math.floor(item.main.temp_min),
          icon    : allIcons[item.weather[0].icon] || clear_Icon,
        }
      })
  }
 
  /* ── Search handler ── */
  const search = async (city) => {
    if (!city.trim()) { alert("Please enter a city name!"); return }
    try {
      const [current, fcst] = await Promise.all([
        fetchCurrent(city),
        fetchForecast(city),
      ])
      setWeatherData(current)
      setForecast(fcst)
      setActiveDay(0)
    } catch {
      alert("City not found! Please enter a valid city name.")
    }
  }
 
  useEffect(() => { search("London") }, [])
 
  return (
    <div className='Weather'>
 
      {/* Twinkling Stars */}
      {STARS.map(s => (
        <span key={s.id} className='star' style={{
          width: s.size + 'px',
          height: s.size + 'px',
          top: s.top + '%',
          left: s.left + '%',
          '--dur': s.dur,
          '--delay': s.delay,
          '--bright': s.bright,
        }} />
      ))}
 
      {/* Shooting Stars */}
      {SHOOTS.map(s => (
        <span key={s.id} className='shooting-star' style={{
          top: s.top + '%',
          left: s.left + '%',
          '--sdur': s.sdur,
          '--sdelay': s.sdelay,
        }} />
      ))}
 
      {/* Search */}
      <div className='search-bar'>
        <input
          ref={inputRef}
          type='text'
          placeholder='Search city...'
          onKeyDown={e => e.key === 'Enter' && search(inputRef.current.value)}
        />
        <img
          src={Search_Icon}
          alt='Search'
          onClick={() => search(inputRef.current.value)}
        />
      </div>
 
      {/* Main weather */}
      {weatherData && (
        <>
          {/* Icon */}
          <div className='weather-icon-wrap'>
            <img src={weatherData.icon} alt='weather icon' className='weather-icon' />
          </div>
 
          {/* Temp */}
          <p className='temperature'>{weatherData.temp}°C</p>
 
          {/* Description + location */}
          <p className='location'>
            {weatherData.desc} &nbsp;·&nbsp; {weatherData.location}, {weatherData.country}
          </p>
 
          {/* Stats */}
          <div className='weather-data'>
            <div className='col'>
              <img src={wind_Icon} alt='wind' />
              <p>{weatherData.windSpeed} km/h</p>
              <span>Wind</span>
            </div>
            <div className='col'>
              <img src={humidity_Icon} alt='humidity' />
              <p>{weatherData.humidity}%</p>
              <span>Humidity</span>
            </div>
            <div className='col'>
              <img src={clear_Icon} alt='feels like' />
              <p>{weatherData.feelsLike}°C</p>
              <span>Feels Like</span>
            </div>
          </div>
 
          {/* Divider */}
          <div className='divider' />
 
          {/* 5-Day Forecast */}
          {forecast.length > 0 && (
            <>
              <p className='forecast-title'>5-Day Forecast</p>
              <div className='forecast'>
                {forecast.map((day, i) => (
                  <div
                    key={i}
                    className={`forecast-day${activeDay === i ? ' active' : ''}`}
                    onClick={() => setActiveDay(i)}
                  >
                    <span className='day-name'>{day.dayName}</span>
                    <img src={day.icon} alt='forecast icon' />
                    <span className='day-hi'>{day.hi}°</span>
                    <span className='day-lo'>{day.lo}°</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
 
export default Weather
 
 