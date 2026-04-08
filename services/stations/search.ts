import "server-only";

import {
  fetchOverpassJson,
  escapeOverpassRegex,
  type OverpassNodeElement,
  type OverpassRelationElement,
  type OverpassWayElement
} from "@/services/osm/overpass";
import type { RailwayStation, RailwayStationSearchResponse } from "@/types/station";

const INDIA_BOUNDS = {
  south: 6,
  west: 68,
  north: 38.5,
  east: 97.5
} as const;

const CACHE_TTL_MS = 10 * 60_000;
const searchCache = new Map<string, { expiresAt: number; value: RailwayStationSearchResponse }>();

type StationSearchElement = OverpassNodeElement | OverpassWayElement | OverpassRelationElement;

function getElementCoordinates(element: StationSearchElement) {
  if (element.type === "node") {
    return {
      lat: element.lat,
      lng: element.lon
    };
  }

  if (element.center) {
    return {
      lat: element.center.lat,
      lng: element.center.lon
    };
  }

  return null;
}

function normalizeStationKind(value: string | undefined): RailwayStation["kind"] | null {
  if (value === "station" || value === "halt" || value === "stop") {
    return value;
  }

  return null;
}

function formatStationDisplayName(station: Pick<RailwayStation, "name" | "code">) {
  return station.code ? `${station.name} (${station.code})` : station.name;
}

function mapStation(element: StationSearchElement): RailwayStation | null {
  const tags = element.tags ?? {};
  const coords = getElementCoordinates(element);
  const kind = normalizeStationKind(tags.railway);
  const name = (tags["name:en"] ?? tags.name ?? "").trim();

  if (!coords || !kind || !name) {
    return null;
  }

  const code = (tags.ref ?? tags["railway:ref"] ?? tags.local_ref ?? tags.uic_ref ?? "").trim() || null;

  const station: RailwayStation = {
    id: `${element.type}:${element.id}`,
    code: code ? code.toUpperCase() : null,
    name,
    displayName: "",
    lat: coords.lat,
    lng: coords.lng,
    source: "openstreetmap",
    osmType: element.type,
    osmId: element.id,
    kind
  };

  return {
    ...station,
    displayName: formatStationDisplayName(station)
  };
}

function buildStationSearchQuery(term: string, limit: number) {
  const escaped = escapeOverpassRegex(term.trim());
  const filters = [
    `["name"~"${escaped}",i"]`,
    `["name:en"~"${escaped}",i"]`,
    `["ref"~"${escaped}",i"]`,
    `["railway:ref"~"${escaped}",i"]`,
    `["local_ref"~"${escaped}",i"]`
  ];

  const elementQueries = ["node", "way", "relation"].flatMap((elementType) =>
    filters.map(
      (filter) =>
        `${elementType}["railway"~"^(station|halt|stop)$"]${filter}(${INDIA_BOUNDS.south},${INDIA_BOUNDS.west},${INDIA_BOUNDS.north},${INDIA_BOUNDS.east});`
    )
  );

  return `[out:json][timeout:25];
(
${elementQueries.join("\n")}
);
out center tags ${limit};`;
}

function scoreStation(station: RailwayStation, term: string) {
  const normalizedTerm = term.trim().toLowerCase();
  const code = station.code?.toLowerCase() ?? "";
  const name = station.name.toLowerCase();

  if (code === normalizedTerm) {
    return 0;
  }

  if (name === normalizedTerm) {
    return 1;
  }

  if (code.startsWith(normalizedTerm)) {
    return 2;
  }

  if (name.startsWith(normalizedTerm)) {
    return 3;
  }

  if (name.includes(normalizedTerm)) {
    return 4;
  }

  return 5;
}

export async function searchRailwayStations(term: string, limit = 8): Promise<RailwayStationSearchResponse> {
  const normalizedTerm = term.trim();
  const fetchedAt = new Date().toISOString();

  if (normalizedTerm.length < 2) {
    return {
      stations: [],
      fetchedAt
    };
  }

  const cacheKey = `${normalizedTerm.toLowerCase()}::${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const query = buildStationSearchQuery(normalizedTerm, Math.min(limit * 3, 30));
  const response = await fetchOverpassJson<StationSearchElement>(query);
  const seen = new Set<string>();
  const stations = response.elements
    .map(mapStation)
    .filter((station): station is RailwayStation => station !== null)
    .reduce<RailwayStation[]>((unique, station) => {
      const dedupeKey = `${station.code ?? ""}:${station.name.toLowerCase()}:${station.lat.toFixed(4)}:${station.lng.toFixed(4)}`;
      if (seen.has(dedupeKey)) {
        return unique;
      }

      seen.add(dedupeKey);
      return [...unique, station];
    }, [])
    .sort((left, right) => {
      const scoreDiff = scoreStation(left, normalizedTerm) - scoreStation(right, normalizedTerm);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      if (left.kind !== right.kind) {
        return left.kind === "station" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);

  const value = {
    stations,
    fetchedAt
  } satisfies RailwayStationSearchResponse;

  searchCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value
  });

  return value;
}
