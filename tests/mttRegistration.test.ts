import assert from 'node:assert/strict'
import test from 'node:test'
import { getMttRegistrationLocation, isMttRegistered } from '../src/utils/mttRegistration.ts'

test('positive mtt_buy marks the player as registered', () => {
  assert.equal(isMttRegistered({ mtt_buy: 1 }), true)
  assert.equal(isMttRegistered({ mtt_buy: '2' }), true)
})

test('missing, zero, and invalid mtt_buy are not registered', () => {
  assert.equal(isMttRegistered({}), false)
  assert.equal(isMttRegistered({ mtt_buy: 0 }), false)
  assert.equal(isMttRegistered({ mtt_buy: 'invalid' }), false)
})

test('each registration attempt reads fresh coordinates and can recover after permission is restored', async () => {
  const timestamp = Date.now()
  let denied = false
  let longitude = 0
  const geolocation: Pick<Geolocation, 'getCurrentPosition'> = {
    getCurrentPosition(success, failure, options) {
      assert.equal(options?.maximumAge, 0)
      if (denied) {
        failure?.({ code: 1 } as GeolocationPositionError)
      } else {
        success({ coords: { latitude: 0, longitude, accuracy: 50 }, timestamp } as GeolocationPosition)
      }
    },
  }

  assert.deepEqual(await getMttRegistrationLocation(geolocation), {
    status: 'located', gps_authorized: true, gps_latitude: 0, gps_longitude: 0,
    gps_accuracy_m: 50, gps_timestamp_ms: timestamp,
  })
  denied = true
  assert.deepEqual(await getMttRegistrationLocation(geolocation), { status: 'permission-denied' })
  denied = false
  longitude = 120.5
  assert.deepEqual(await getMttRegistrationLocation(geolocation), {
    status: 'located', gps_authorized: true, gps_latitude: 0, gps_longitude: 120.5,
    gps_accuracy_m: 50, gps_timestamp_ms: timestamp,
  })
})

test('an unsupported browser, timed out fix, or invalid coordinates cannot provide a location', async () => {
  assert.deepEqual(await getMttRegistrationLocation(), { status: 'unavailable' })
  assert.deepEqual(await getMttRegistrationLocation({
    getCurrentPosition(_success, failure) {
      failure?.({ code: 3 } as GeolocationPositionError)
    },
  }), { status: 'unavailable' })
  assert.deepEqual(await getMttRegistrationLocation({
    getCurrentPosition(success) {
      success({ coords: { latitude: NaN, longitude: 181, accuracy: 10 }, timestamp: Date.now() } as GeolocationPosition)
    },
  }), { status: 'unavailable' })
})

test('an imprecise or stale fix cannot be submitted', async () => {
  for (const [accuracy, age] of [[50.1, 0], [12, 5 * 60 * 1000 + 1]] as const) {
    const result = await getMttRegistrationLocation({
      getCurrentPosition(success) {
        success({
          coords: { latitude: 22.5, longitude: 113.9, accuracy },
          timestamp: Date.now() - age,
        } as GeolocationPosition)
      },
    })
    assert.deepEqual(result, { status: 'unavailable' })
  }
})
