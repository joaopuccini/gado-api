import { DomainError } from '../../../common/errors/domain-error';

export interface GeoJsonPolygon {
  readonly type: 'Feature';
  readonly properties: Readonly<Record<string, unknown>>;
  readonly geometry: {
    readonly type: 'Polygon';
    readonly coordinates: readonly (readonly (readonly [number, number])[])[];
  };
}

const invalid = (field: string, reason: string): never => {
  throw new DomainError('validationFailed', 'Dados do pasto inválidos.', [
    { field, reason },
  ]);
};

export const normalizePastureDescription = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) invalid('description', 'required');
  return normalized;
};

export const normalizeAreaHectares = (value?: string): string | undefined => {
  if (value === undefined) return undefined;
  if (!/^\d+(?:\.\d{1,3})?$/.test(value) || Number(value) <= 0) {
    invalid('areaHectares', 'positiveDecimalRequired');
  }
  return value;
};

const isPosition = (value: unknown): value is readonly [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(
    (coordinate) =>
      typeof coordinate === 'number' && Number.isFinite(coordinate),
  );

export const normalizePastureGeoJson = (value: unknown): GeoJsonPolygon => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalid('geoJson', 'polygonRequired');
  }
  const feature = value as Record<string, unknown>;
  const geometry = feature.geometry;
  if (
    feature.type !== 'Feature' ||
    !geometry ||
    typeof geometry !== 'object' ||
    Array.isArray(geometry)
  ) {
    return invalid('geoJson', 'polygonRequired');
  }
  const candidate = geometry as Record<string, unknown>;
  if (candidate.type !== 'Polygon' || !Array.isArray(candidate.coordinates)) {
    return invalid('geoJson', 'polygonRequired');
  }
  const rings = candidate.coordinates;
  if (
    rings.length === 0 ||
    rings.some(
      (ring) =>
        !Array.isArray(ring) ||
        ring.length < 4 ||
        !ring.every(isPosition) ||
        ring[0]?.[0] !== ring[ring.length - 1]?.[0] ||
        ring[0]?.[1] !== ring[ring.length - 1]?.[1],
    )
  ) {
    return invalid('geoJson', 'closedPolygonRequired');
  }
  return {
    type: 'Feature',
    properties:
      feature.properties &&
      typeof feature.properties === 'object' &&
      !Array.isArray(feature.properties)
        ? (feature.properties as Record<string, unknown>)
        : {},
    geometry: {
      type: 'Polygon',
      coordinates:
        rings as unknown as GeoJsonPolygon['geometry']['coordinates'],
    },
  };
};
