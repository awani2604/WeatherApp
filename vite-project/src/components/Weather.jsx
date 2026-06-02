import React, { useEffect, useRef, useState } from 'react'
import './Weather.css'

import Search_Icon   from '../assets/search.png'
import cloud_Icon    from '../assets/cloud.png'
import clear_Icon    from '../assets/clear.png'
import rain_Icon     from '../assets/rain.png'
import snow_Icon     from '../assets/snow.png'
import drizzle_Icon  from '../assets/drizzle.png'
import wind_Icon     from '../assets/wind.png'
import humidity_Icon from '../assets/humidity.png'

const allIcons = {
  "01d": clear_Icon,   "01n": clear_Icon,
  "02d": cloud_Icon,   "02n": cloud_Icon,
  "03d": cloud_Icon,   "03n": cloud_Icon,
  "04d": drizzle_Icon, "04n": drizzle_Icon,
  "09d": rain_Icon,    "09n": rain_Icon,
  "10d": rain_Icon,    "10n": rain_Icon,
  "13d": snow_Icon,    "13n": snow_Icon,
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/* ── AI suggestions ── */
const fetchAISuggestions = async (location, desc, temp, humidity, wind) => {
  const prompt = `You are a helpful weather assistant.Songs should match the weather mood.
Song language rules:
- If country is India (IN), suggest Hindi and English songs.
- If country is outside India, suggest  songs of there country only.
- Choose songs popular in that region.
Current weather in ${location}:
- Condition: ${desc}
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Wind Speed: ${wind} km/h

Give exactly this JSON format and nothing else:
{
  "precautions": ["item1", "item2", "item3", "item4"],
  "songs": ["item1", "item2", "item3", "item4"],
  "food": ["item1", "item2", "item3", "item4"]
}

Each item should have a relevant emoji at the start. Precautions should be practical safety tips. Songs should match the weather mood and country location(but don't show the country name and language name like hindi or english). Food should suit the weather. Keep each item short (max 8 words). Respond ONLY with the JSON, no extra text.`

  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not found')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (response.status === 429) throw new Error('429')
  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

const Weather = () => {
  const [weatherData,   setWeatherData]   = useState(null)
  const [forecast,      setForecast]      = useState([])
  const [activeDay,     setActiveDay]     = useState(0)
  const [unit,          setUnit]          = useState('C')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [locating,      setLocating]      = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [aiLoading,     setAiLoading]     = useState(false)
  const [aiError,       setAiError]       = useState('')

  const inputRef   = useRef()
  const aiCacheRef = useRef({})

  const toDisplay = (tempC) =>
    unit === 'C' ? `${tempC}°C` : `${Math.round(tempC * 9 / 5 + 32)}°F`

  const fetchCurrent = async (query) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
    const res  = await fetch(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'City not found')
    return {
      humidity  : data.main.humidity,
      location  : data.name,
      country   : data.sys.country,
      tempC     : Math.floor(data.main.temp),
      feelsLikeC: Math.floor(data.main.feels_like),
      windSpeed : data.wind.speed,
      desc      : data.weather[0].description,
      icon      : allIcons[data.weather[0].icon] || clear_Icon,
    }
  }

  const fetchForecast = async (query) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?${query}&units=metric&cnt=40&appid=${import.meta.env.VITE_APP_ID}`
    const res  = await fetch(url)
    const data = await res.json()
    if (!res.ok) return []
    const seen = new Set()
    return data.list
      .filter(item => {
        const key = new Date(item.dt * 1000).toDateString()
        if (seen.has(key)) return false
        seen.add(key); return true
      })
      .slice(0, 5)
      .map(item => ({
        dayName : DAY_NAMES[new Date(item.dt * 1000).getDay()],
        hiC     : Math.floor(item.main.temp_max),
        loC     : Math.floor(item.main.temp_min),
        icon    : allIcons[item.weather[0].icon] || clear_Icon,
      }))
  }

  const loadAISuggestions = async (current) => {
    const cacheKey = `${current.location}_${current.desc}_${current.tempC}`
    if (aiCacheRef.current[cacheKey]) {
      setAiSuggestions(aiCacheRef.current[cacheKey])
      return
    }
    setAiLoading(true); setAiError(''); setAiSuggestions(null)
    try {
      const sug = await fetchAISuggestions(
        current.location, current.desc, current.tempC, current.humidity, current.windSpeed
      )
      aiCacheRef.current[cacheKey] = sug
      setAiSuggestions(sug)
    } catch (e) {
      if (e?.message === '429') setAiError('Rate limit ho gayi. 1 minute baad Retry karein.')
      else if (e?.message?.includes('key not found')) setAiError('VITE_GROQ_API_KEY .env mein set nahi hai.')
      else setAiError('AI suggestions load nahi ho sakin. Retry karein.')
    } finally {
      setAiLoading(false)
    }
  }

  const search = async (query) => {
    setLoading(true); setError(''); setAiSuggestions(null)
    try {
      const [current, fcst] = await Promise.all([
        fetchCurrent(query),
        fetchForecast(query),
      ])
      setWeatherData(current)
      setForecast(fcst)
      setActiveDay(0)
      loadAISuggestions(current)
    } catch (e) {
      setError(e.message || 'City not found!')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Validation yahan hai
  const searchByCity = (city) => {
    const trimmed = city.trim()

    if (!trimmed) {
      setError('Please enter a city name!')
      return
    }

    if (!/^[a-zA-Z\s\-\.]+$/.test(trimmed)) {
      setError('Invalid city name! Sirf letters use karein.')
      return
    }

    search(`q=${encodeURIComponent(trimmed)}`)
  }

  const searchByLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        search(`lat=${coords.latitude}&lon=${coords.longitude}`)
      },
      (err) => {
        setLocating(false)
        if (err.code === 1)      setError('Location permission denied. Browser settings mein allow karein.')
        else if (err.code === 2) setError('Location unavailable. Device GPS check karein.')
        else                     setError('Location timeout. Dobara try karein.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => { searchByCity('London') }, [])

  return (
    <div className='Weather'>

      <div className='top-bar'>
        <div className='search-bar'>
          <input
            ref={inputRef}
            type='text'
            placeholder='Search city...'
            onKeyDown={e => e.key === 'Enter' && searchByCity(inputRef.current.value)}
          />
          <button className='icon-btn' onClick={() => searchByCity(inputRef.current.value)} aria-label='Search'>
            <img src={Search_Icon} alt='' />
          </button>
        </div>

        <button
          className={`icon-btn gps-btn${locating ? ' spinning' : ''}`}
          onClick={searchByLocation}
          title='Use my location'
        >📍</button>

        <button className='unit-toggle' onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}>
          <span className={unit === 'C' ? 'active' : ''}>°C</span>
          <span className='sep'>|</span>
          <span className={unit === 'F' ? 'active' : ''}>°F</span>
        </button>
      </div>

      {loading && <p className='status-msg'>Fetching weather...</p>}
      {error   && <p className='status-msg error'>{error}</p>}

      {!loading && weatherData && (
        <div className='weather-body'>

          {(() => {
            const isToday = activeDay === 0 || forecast.length === 0
            const displayIcon = isToday ? weatherData.icon : forecast[activeDay].icon
            const displayTemp = isToday ? weatherData.tempC : forecast[activeDay].hiC
            const displayDesc = isToday ? weatherData.desc : forecast[activeDay].dayName + ' ka mausam'
            return (
              <>
                <div className='weather-icon-wrap'>
                  <img src={displayIcon} alt='weather' className='weather-icon' />
                </div>
                <p className='temperature'>{toDisplay(displayTemp)}</p>
                <p className='weather-desc'>{displayDesc}</p>
                <p className='location'>📍 {weatherData.location}, {weatherData.country}</p>

                <div className='weather-data'>
                  {isToday ? (
                    <>
                      <div className='col'>
                        <img src={wind_Icon} alt='wind' />
                        <p>{weatherData.windSpeed} <small>km/h</small></p>
                        <span>Wind</span>
                      </div>
                      <div className='col'>
                        <img src={humidity_Icon} alt='humidity' />
                        <p>{weatherData.humidity}<small>%</small></p>
                        <span>Humidity</span>
                      </div>
                      <div className='col'>
                        <img src={clear_Icon} alt='feels like' />
                        <p>{toDisplay(weatherData.feelsLikeC)}</p>
                        <span>Feels Like</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className='col'>
                        <img src={clear_Icon} alt='high' />
                        <p>{toDisplay(forecast[activeDay].hiC)}</p>
                        <span>High</span>
                      </div>
                      <div className='col'>
                        <img src={wind_Icon} alt='low' />
                        <p>{toDisplay(forecast[activeDay].loC)}</p>
                        <span>Low</span>
                      </div>
                      <div className='col'>
                        <img src={cloud_Icon} alt='day' />
                        <p>{forecast[activeDay].dayName}</p>
                        <span>Day</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          })()}

          <div className='divider' />

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
                    <img src={day.icon} alt='forecast' />
                    <span className='day-hi'>{toDisplay(day.hiC)}</span>
                    <span className='day-lo'>{toDisplay(day.loC)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className='divider' style={{ marginTop: '24px' }} />
          <p className='forecast-title'>✨ AI Suggestions</p>

          {aiLoading && (
            <div className='ai-loading'>
              <span className='ai-dot' /><span className='ai-dot' /><span className='ai-dot' />
              <span className='ai-loading-text'>Loading...</span>
            </div>
          )}

          {aiError && (
            <div className='ai-error-wrap'>
              <p className='ai-error-text'>{aiError}</p>
              <button className='ai-retry-btn' onClick={() => loadAISuggestions(weatherData)}>
                🔄 Retry
              </button>
            </div>
          )}

          {aiSuggestions && (
            <div className='suggestions-list'>
              <div className='sug-section'>
                <p className='sug-heading'>⚠️ Precautions</p>
                {aiSuggestions.precautions.map((s, i) => <p key={i} className='sug-item'>{s}</p>)}
              </div>
              <div className='sug-section'>
                <p className='sug-heading'>🎵 Songs to Listen</p>
                {aiSuggestions.songs.map((s, i) => <p key={i} className='sug-item'>{s}</p>)}
              </div>
              <div className='sug-section'>
                <p className='sug-heading'>🍽️ What to Eat</p>
                {aiSuggestions.food.map((s, i) => <p key={i} className='sug-item'>{s}</p>)}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default Weather
