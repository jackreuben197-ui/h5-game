interface MttRegistrationRecord {
  mtt_buy?: unknown
}

export function isMttRegistered(record: MttRegistrationRecord): boolean {
  const value = Number(record.mtt_buy)
  return Number.isFinite(value) && value > 0
}

export interface MttRegistrationGps {
  gps_authorized: true
  gps_latitude: number
  gps_longitude: number
  gps_accuracy_m: number
  gps_timestamp_ms: number
}

type MttRegistrationLocation =
  | ({ status: 'located' } & MttRegistrationGps)
  | { status: 'permission-denied' | 'unavailable' }

export async function getMttRegistrationLocation(
  geolocation?: Pick<Geolocation, 'getCurrentPosition'>,
): Promise<MttRegistrationLocation> {
  if (!geolocation) return { status: 'unavailable' }

  try {
    // 由浏览器复用或重新申请定位权限，每次报名读取当前位置。
    return await new Promise<MttRegistrationLocation>((resolve) => {
      geolocation.getCurrentPosition(
        ({ coords, timestamp }) => {
          const { latitude, longitude, accuracy } = coords ?? {}
          const age = Date.now() - timestamp
          if (
            !Number.isFinite(latitude) ||
            Math.abs(latitude) > 90 ||
            !Number.isFinite(longitude) ||
            Math.abs(longitude) > 180 ||
            !Number.isFinite(accuracy) ||
            accuracy < 0 ||
            accuracy > 50 ||
            !Number.isSafeInteger(timestamp) ||
            timestamp <= 0 ||
            age < 0 ||
            age > 5 * 60 * 1000
          ) {
            resolve({ status: 'unavailable' })
            return
          }
          resolve({
            status: 'located',
            gps_authorized: true,
            gps_latitude: latitude,
            gps_longitude: longitude,
            gps_accuracy_m: accuracy,
            gps_timestamp_ms: timestamp,
          })
        },
        ({ code }) => resolve({ status: code === 1 ? 'permission-denied' : 'unavailable' }),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      )
    })
  } catch {
    return { status: 'unavailable' }
  }
}
