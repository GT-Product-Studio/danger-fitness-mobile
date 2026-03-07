// BLE Heart Rate Measurement parser (UUID 0x2A37)
// Parses standard BLE Heart Rate Service data packets

export interface HeartRateData {
  hr: number;
  rrIntervals: number[];
  energyExpended?: number;
  sensorContact: boolean;
}

/**
 * Parse a BLE Heart Rate Measurement characteristic value.
 *
 * Byte 0 (Flags):
 *   Bit 0: HR format (0 = UINT8, 1 = UINT16)
 *   Bit 1-2: Sensor contact status
 *   Bit 3: Energy expended present
 *   Bit 4: RR interval present
 */
export function parseHeartRate(value: number[]): HeartRateData {
  if (!value || value.length < 2) {
    return { hr: 0, rrIntervals: [], sensorContact: false };
  }

  const flags = value[0];
  const isUint16 = (flags & 0x01) === 1;
  const sensorContactSupported = (flags & 0x04) !== 0;
  const sensorContact = sensorContactSupported ? (flags & 0x02) !== 0 : true;
  const hasEnergy = (flags & 0x08) !== 0;
  const hasRR = (flags & 0x10) !== 0;

  let offset = 1;

  // Heart rate value
  let hr: number;
  if (isUint16) {
    hr = value[offset] | (value[offset + 1] << 8);
    offset += 2;
  } else {
    hr = value[offset];
    offset += 1;
  }

  // Energy expended (UINT16, kJ)
  let energyExpended: number | undefined;
  if (hasEnergy && offset + 1 < value.length) {
    energyExpended = value[offset] | (value[offset + 1] << 8);
    offset += 2;
  }

  // RR intervals (UINT16, 1/1024 second resolution)
  const rrIntervals: number[] = [];
  if (hasRR) {
    while (offset + 1 < value.length) {
      const rawRR = value[offset] | (value[offset + 1] << 8);
      // Convert from 1/1024s to milliseconds
      rrIntervals.push(Math.round((rawRR / 1024) * 1000));
      offset += 2;
    }
  }

  return { hr, rrIntervals, energyExpended, sensorContact };
}

// Standard BLE UUIDs
export const HR_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
export const HR_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb";
export const BODY_SENSOR_LOCATION_UUID = "00002a38-0000-1000-8000-00805f9b34fb";
