import {
  OFFICE_LATITUDE,
  OFFICE_LOCALITY,
  OFFICE_LONGITUDE,
  OFFICE_TIMEZONE,
} from '@/lib/office-location'

export type WeatherSnapshot = {
  temperature: number
  weatherCode: number
  locality: string
  timezone: string
}

type ReverseGeocodeResponse = {
  city?: string
  locality?: string
  principalSubdivision?: string
}

function parseWeather(
  data: {
    current?: { temperature_2m?: number; weather_code?: number }
    timezone?: string
  },
  locality: string,
  fallbackTimezone: string,
): WeatherSnapshot | null {
  const temperature = data.current?.temperature_2m
  const weatherCode = data.current?.weather_code
  if (typeof temperature !== 'number' || typeof weatherCode !== 'number') return null

  return {
    temperature: Math.round(temperature),
    weatherCode,
    locality,
    timezone: data.timezone || fallbackTimezone,
  }
}

function weatherUrl(latitude: number, longitude: number, timezone: string) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    timezone,
  })
  return `https://api.open-meteo.com/v1/forecast?${params}`
}

export async function resolveLocality(latitude: number, longitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  })

  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
    )
    if (!response.ok) return null
    const data = (await response.json()) as ReverseGeocodeResponse
    const locality = data.locality?.trim()
    const city = data.city?.trim()
    const region = data.principalSubdivision?.trim()
    return locality || city || region || null
  } catch {
    return null
  }
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  locality: string = '',
): Promise<WeatherSnapshot | null> {
  try {
    const response = await fetch(weatherUrl(latitude, longitude, 'auto'))
    if (!response.ok) return null
    return parseWeather(await response.json(), locality, OFFICE_TIMEZONE)
  } catch {
    return null
  }
}

export async function getOfficeWeather(): Promise<WeatherSnapshot | null> {
  try {
    const response = await fetch(weatherUrl(OFFICE_LATITUDE, OFFICE_LONGITUDE, OFFICE_TIMEZONE), {
      next: { revalidate: 900 },
    })
    if (!response.ok) return null
    return parseWeather(await response.json(), OFFICE_LOCALITY, OFFICE_TIMEZONE)
  } catch {
    return null
  }
}
