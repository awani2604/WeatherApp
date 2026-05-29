import React, { useEffect, useRef } from 'react'
import './Weather.css'

import Search_Icon from '../assets/search.png'
import cloud_Icon from '../assets/cloud.png'
import clear_Icon from '../assets/clear.png'
import rain_Icon from '../assets/rain.png'
import snow_Icon from '../assets/snow.png'
import drizzle_Icon from '../assets/drizzle.png'
import wind_Icon from '../assets/wind.png'
import humidity_Icon from '../assets/humidity.png'

const Weather = () => {

    const [weatherData, setWeatherData] = React.useState(false);
    const inputRef = useRef();

    const allIcons = {
        "01d": clear_Icon,
        "01n": clear_Icon,
        "02d": cloud_Icon,
        "02n": cloud_Icon,
        "03d": cloud_Icon,
        "03n": cloud_Icon,
        "04d": drizzle_Icon,
        "04n": drizzle_Icon,
        "09d": rain_Icon,
        "09n": rain_Icon,
        "10d": rain_Icon,
        "10n": rain_Icon,
        "13d": snow_Icon,
        "13n": snow_Icon,
    };

    const search = async (city) => {

        if (city.trim() === "") {
            alert("Please enter a city name!");
            return;
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod === "404") {
                alert("City not found! Please enter a valid city name.");
                return;
            }

            console.log(data);
            const icon = allIcons[data.weather[0].icon] || clear_Icon;
            setWeatherData({
                humidity: data.main.humidity,
                location: data.name,
                temp: Math.floor(data.main.temp),
                windSpeed: data.wind.speed,
                icon: icon,
            });
        } catch (error) {
            console.error("Error fetching weather:", error);
            alert("Something went wrong!");
        }
    }

    useEffect(() => {
        search("london");
    }, [])

    return (
        <div className='Weather'>
            <div className='search-bar'>
                <input ref={inputRef} type="text" placeholder="Enter city name..." />
                <img src={Search_Icon} alt="" onClick={() => search(inputRef.current.value)} />
            </div>

            {weatherData && <>
                <img src={weatherData.icon} alt="" className='weather-icon' />
                <p className='temperature'>{weatherData.temp}°C</p>
                <p className='location'>{weatherData.location}</p>
                <div className='weather-data'>
                    <div className='col'>
                        <img src={wind_Icon} alt="" />
                        <div>
                            <p>{weatherData.windSpeed} Km/h</p>
                            <span>Wind Speed</span>
                        </div>
                    </div>
                    <div className='col'>
                        <img src={humidity_Icon} alt="" />
                        <div>
                            <p>{weatherData.humidity}%</p>
                            <span>Humidity</span>
                        </div>
                    </div>
                </div>
            </>}
        </div>
    )
}

export default Weather