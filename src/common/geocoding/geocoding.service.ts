import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Reverse-geocodes coordinates into a human-readable address using the free
 * OpenStreetMap Nominatim service. No API key required.
 *
 * Notes:
 *  - Nominatim's usage policy requires an identifying User-Agent.
 *  - Calls are wrapped in a short timeout so a slow/unreachable geocoder can
 *    never block an attendance check-in/out; callers should treat `null` as
 *    "no address available" and fall back to coordinates.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly endpoint = 'https://nominatim.openstreetmap.org/reverse';

  constructor(private config: ConfigService) {}

  async reverse(lat: number, lng: number): Promise<string | null> {
    try {
      const url =
        `${this.endpoint}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': `${this.config.get('APP_NAME') ?? 'SRL Pulse'} attendance geocoder`,
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status} for ${lat},${lng}`);
        return null;
      }

      const data: any = await res.json();
      return this.format(data?.address) ?? data?.display_name ?? null;
    } catch (err: any) {
      this.logger.warn(`Reverse geocode failed for ${lat},${lng}: ${err?.message ?? err}`);
      return null;
    }
  }

  /**
   * Build the full street address from Nominatim's address components, ordered
   * narrowest to widest.
   *
   * Each level is kept rather than collapsed with `||`: a manager checking where
   * a rep clocked in needs the building and road, not just "Sector 62, Noida".
   * Country is dropped (every user is in India) and repeated components are
   * removed, because Nominatim frequently returns the same name for several
   * levels (e.g. suburb === city_district === city).
   */
  private format(a: any): string | null {
    if (!a) return null;
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const parts = [
      a.amenity || a.building || a.shop || a.office,
      street,
      a.neighbourhood,
      a.suburb,
      a.city_district || a.village || a.town,
      a.city || a.municipality,
      a.county || a.state_district,
      a.state,
      a.postcode,
    ].filter(Boolean);

    const seen = new Set<string>();
    const unique = parts.filter((p: string) => {
      const key = String(p).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.length ? unique.join(', ') : null;
  }
}
