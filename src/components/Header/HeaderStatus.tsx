'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from '@phosphor-icons/react'

import { OFFICE_TIMEZONE } from '@/lib/office-location'
import { fetchWeather, resolveLocality, type WeatherSnapshot } from '@/lib/weather'

const CLOCK_TICK_MS = 15 * 1000
const WEATHER_REFRESH_MS = 15 * 60 * 1000

function WeatherGlyph({
  code,
  zone,
  className,
}: {
  code: number
  zone: string
  className?: string
}) {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: zone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  const night = hour < 6 || hour >= 18
  const props = { size: 16, weight: 'fill' as const, className, 'aria-hidden': true as const }

  if (code === 0) return night ? <Moon {...props} /> : <Sun {...props} />
  if (code <= 3) return night ? <CloudMoon {...props} /> : <CloudSun {...props} />
  if (code === 45 || code === 48) return <CloudFog {...props} />
  if (code >= 51 && code <= 67) return <CloudRain {...props} />
  if (code >= 71 && code <= 77) return <CloudSnow {...props} />
  if (code >= 80 && code <= 82) return <CloudRain {...props} />
  if (code >= 85 && code <= 86) return <CloudSnow {...props} />
  if (code >= 95) return <CloudLightning {...props} />
  return <Cloud {...props} />
}

type HeaderStatusProps = {
  weather?: WeatherSnapshot | null
}

export function HeaderStatus({ weather: initialWeather = null }: HeaderStatusProps) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState<WeatherSnapshot | null>(initialWeather)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const [snapshot, locality] = await Promise.all([
          fetchWeather(latitude, longitude),
          resolveLocality(latitude, longitude),
        ])
        if (cancelled || !snapshot) return
        setWeather({ ...snapshot, locality: locality ?? snapshot.locality })
      },
      () => {},
      { maximumAge: WEATHER_REFRESH_MS, enableHighAccuracy: false },
    )

    return () => {
      cancelled = true
    }
  }, [])

  const zone = weather?.timezone ?? OFFICE_TIMEZONE
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [zone],
  )
  const time = timeFormatter.format(now)

  const place = weather?.locality
  const label = weather
    ? place
      ? `${time}, ${weather.temperature}° em ${place}`
      : `${time}, ${weather.temperature}°`
    : time

  return (
    <div className="site-header__status" role="group" aria-label={label}>
      <time className="site-header__clock" dateTime={time} suppressHydrationWarning>
        {time}
      </time>
      {weather ? (
        <span className="site-header__weather" aria-hidden="true">
          <WeatherGlyph
            code={weather.weatherCode}
            zone={zone}
            className="site-header__weather-icon"
          />
          <span className="site-header__weather-temp">{weather.temperature}°</span>
          {place ? <span className="site-header__weather-place">{place}</span> : null}
        </span>
      ) : null}
    </div>
  )
}
