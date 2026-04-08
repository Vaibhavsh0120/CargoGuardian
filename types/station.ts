export const RAILWAY_STATION_OSM_TYPE_VALUES = ["node", "way", "relation"] as const;

export type RailwayStationOsmType = (typeof RAILWAY_STATION_OSM_TYPE_VALUES)[number];

export const RAILWAY_STATION_KIND_VALUES = ["station", "halt", "stop"] as const;

export type RailwayStationKind = (typeof RAILWAY_STATION_KIND_VALUES)[number];

export const RAILWAY_STATION_SOURCE_VALUES = ["openstreetmap"] as const;

export type RailwayStationSource = (typeof RAILWAY_STATION_SOURCE_VALUES)[number];

export type RailwayStation = {
  id: string;
  code: string | null;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  source: RailwayStationSource;
  osmType: RailwayStationOsmType;
  osmId: number;
  kind: RailwayStationKind;
};

export type RailwayStationSearchResponse = {
  stations: RailwayStation[];
  fetchedAt: string;
};
