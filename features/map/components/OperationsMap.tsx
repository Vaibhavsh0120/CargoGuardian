"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import { latLngBounds, type LatLngExpression } from "leaflet";

import type { MapIncidentMarker, MapTrainRecord } from "@/types/map";

type OperationsMapProps = {
  trains: MapTrainRecord[];
  incidents: MapIncidentMarker[];
  selectedTrainId: string | null;
  onSelectTrain: (trainId: string) => void;
  onTileError: () => void;
};

function buildBoundsPoints(
  selectedTrain: MapTrainRecord | null,
  incidents: MapIncidentMarker[]
): LatLngExpression[] {
  const points: LatLngExpression[] = [];

  if (selectedTrain?.route?.plannedGeometry.length) {
    selectedTrain.route.plannedGeometry.forEach((point) => {
      points.push([point.lat, point.lng]);
    });
  }

  selectedTrain?.breadcrumbs.forEach((point) => {
    if (point.gpsLat !== null && point.gpsLng !== null) {
      points.push([point.gpsLat, point.gpsLng]);
    }
  });

  if (selectedTrain && selectedTrain.telemetry.gpsLat !== null && selectedTrain.telemetry.gpsLng !== null) {
    points.push([selectedTrain.telemetry.gpsLat, selectedTrain.telemetry.gpsLng]);
  }

  incidents.forEach((incident) => {
    points.push([incident.lat, incident.lng]);
  });

  return points;
}

function ViewportSync({
  selectedTrain,
  incidents
}: {
  selectedTrain: MapTrainRecord | null;
  incidents: MapIncidentMarker[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = buildBoundsPoints(selectedTrain, incidents);

    if (!points.length) {
      map.setView([21.5937, 78.9629], 4);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }

    map.fitBounds(latLngBounds(points), {
      padding: [32, 32]
    });
  }, [incidents, map, selectedTrain]);

  return null;
}

function getTrainColor(status: MapTrainRecord["telemetry"]["status"], selected: boolean) {
  if (selected) {
    return "#c2410c";
  }

  switch (status) {
    case "critical":
      return "#dc2626";
    case "warning":
      return "#d97706";
    case "active":
      return "#2563eb";
    case "offline":
      return "#64748b";
    default:
      return "#0f766e";
  }
}

export default function OperationsMap({
  trains,
  incidents,
  selectedTrainId,
  onSelectTrain,
  onTileError
}: OperationsMapProps) {
  const selectedTrain = trains.find((train) => train.train.id === selectedTrainId) ?? trains[0] ?? null;
  const routeGeometry =
    selectedTrain?.route?.plannedGeometry.map((point) => [point.lat, point.lng] as LatLngExpression) ?? [];
  const breadcrumbGeometry =
    selectedTrain?.breadcrumbs
      .filter((point) => point.gpsLat !== null && point.gpsLng !== null)
      .map((point) => [point.gpsLat as number, point.gpsLng as number] as LatLngExpression) ?? [];

  return (
    <MapContainer
      center={[21.5937, 78.9629]}
      zoom={4}
      zoomControl={false}
      className="h-[30rem] w-full rounded-[1.75rem]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          tileerror: () => {
            onTileError();
          }
        }}
      />

      <ViewportSync selectedTrain={selectedTrain} incidents={incidents} />

      <Pane name="planned-route" style={{ zIndex: 350 }}>
        {routeGeometry.length >= 2 ? (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: "#2563eb",
              weight: 4,
              opacity: 0.8,
              dashArray: "8 10"
            }}
          />
        ) : null}
      </Pane>

      <Pane name="actual-route" style={{ zIndex: 400 }}>
        {breadcrumbGeometry.length >= 2 ? (
          <Polyline
            positions={breadcrumbGeometry}
            pathOptions={{
              color: "#f59e0b",
              weight: 4,
              opacity: 0.9
            }}
          />
        ) : null}
      </Pane>

      {selectedTrain?.route ? (
        <>
          <CircleMarker
            center={[selectedTrain.route.source.lat, selectedTrain.route.source.lng]}
            radius={8}
            pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.95, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              Source: {selectedTrain.route.source.name}
            </Tooltip>
          </CircleMarker>
          <CircleMarker
            center={[selectedTrain.route.destinationStop.lat, selectedTrain.route.destinationStop.lng]}
            radius={8}
            pathOptions={{ color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.95, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              Destination: {selectedTrain.route.destinationStop.name}
            </Tooltip>
          </CircleMarker>
          {selectedTrain.route.waypoints.map((waypoint) => (
            <CircleMarker
              key={waypoint.id}
              center={[waypoint.lat, waypoint.lng]}
              radius={6}
              pathOptions={{ color: "#7c3aed", fillColor: "#a855f7", fillOpacity: 0.9, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                Waypoint: {waypoint.name}
              </Tooltip>
            </CircleMarker>
          ))}
        </>
      ) : null}

      {trains.map((record) => {
        if (record.telemetry.gpsLat === null || record.telemetry.gpsLng === null) {
          return null;
        }

        const selected = record.train.id === selectedTrain?.train.id;

        return (
          <CircleMarker
            key={record.train.id}
            center={[record.telemetry.gpsLat, record.telemetry.gpsLng]}
            radius={selected ? 11 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: selected ? 3 : 2,
              fillColor: getTrainColor(record.telemetry.status, selected),
              fillOpacity: selected ? 1 : 0.88
            }}
            eventHandlers={{
              click: () => {
                onSelectTrain(record.train.id);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              {record.train.code}
            </Tooltip>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{record.train.label}</p>
                <p>{record.train.code}</p>
                <p>Status: {record.telemetry.status}</p>
                <button
                  type="button"
                  className="text-sm font-semibold text-blue-700"
                  onClick={() => {
                    onSelectTrain(record.train.id);
                  }}
                >
                  Focus train
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {incidents.map((incident) => (
        <CircleMarker
          key={incident.alertId}
          center={[incident.lat, incident.lng]}
          radius={10}
          pathOptions={{
            color: "#7f1d1d",
            weight: 2,
            fillColor: "#ef4444",
            fillOpacity: 0.95
          }}
          eventHandlers={{
            click: () => {
              onSelectTrain(incident.trainId);
            }
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{incident.title}</p>
              <p>
                {incident.trainCode} | {incident.severity}
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  onSelectTrain(incident.trainId);
                }}
              >
                Open train context
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
