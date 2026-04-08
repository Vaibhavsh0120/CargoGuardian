import "server-only";

import {
  fetchOverpassJson,
  type OverpassNodeElement,
  type OverpassWayElement
} from "@/services/osm/overpass";
import type { PlannedGeometryPoint, RouteStop } from "@/types/route";

type RailwayGraphElement = OverpassNodeElement | OverpassWayElement;

type GraphCoordinate = {
  lat: number;
  lng: number;
};

type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type PathNode = {
  id: number;
  priority: number;
};

const MAX_SAVED_GEOMETRY_POINTS = 1200;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(start: GraphCoordinate, end: GraphCoordinate) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createBoundingBoxes(stops: RouteStop[], paddingDegrees: number): BoundingBox[] {
  const boxes: BoundingBox[] = [];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = stops[index];
    const end = stops[index + 1];
    const distanceKm = haversineDistanceKm(start, end);
    const samples = Math.max(2, Math.ceil(distanceKm / 60));

    for (let sampleIndex = 0; sampleIndex <= samples; sampleIndex += 1) {
      const ratio = sampleIndex / samples;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      const lngPadding = paddingDegrees / Math.max(0.25, Math.cos(toRadians(lat)));

      boxes.push({
        south: clamp(lat - paddingDegrees, 6, 38.5),
        west: clamp(lng - lngPadding, 68, 97.5),
        north: clamp(lat + paddingDegrees, 6, 38.5),
        east: clamp(lng + lngPadding, 68, 97.5)
      });
    }
  }

  return boxes.filter((box, index) => {
    const key = `${box.south.toFixed(2)}:${box.west.toFixed(2)}:${box.north.toFixed(2)}:${box.east.toFixed(2)}`;
    return boxes.findIndex(
      (candidate) =>
        `${candidate.south.toFixed(2)}:${candidate.west.toFixed(2)}:${candidate.north.toFixed(2)}:${candidate.east.toFixed(2)}` ===
        key
    ) === index;
  });
}

function buildRailNetworkQuery(boxes: BoundingBox[]) {
  const selectors = boxes.map(
    (box) =>
      `way["railway"="rail"]["service"!~"(yard|siding|spur|crossover|crossing)"](${box.south},${box.west},${box.north},${box.east});`
  );

  return `[out:json][timeout:60];
(
${selectors.join("\n")}
);
(._;>;);
out body;`;
}

function buildGraph(elements: RailwayGraphElement[]) {
  const nodeCoordinates = new Map<number, GraphCoordinate>();
  const adjacency = new Map<number, Array<{ to: number; distanceKm: number }>>();

  elements.forEach((element) => {
    if (element.type === "node") {
      nodeCoordinates.set(element.id, {
        lat: element.lat,
        lng: element.lon
      });
    }
  });

  elements.forEach((element) => {
    if (element.type !== "way" || !element.nodes?.length) {
      return;
    }

    for (let index = 1; index < element.nodes.length; index += 1) {
      const from = element.nodes[index - 1];
      const to = element.nodes[index];
      const fromCoordinate = nodeCoordinates.get(from);
      const toCoordinate = nodeCoordinates.get(to);

      if (!fromCoordinate || !toCoordinate) {
        continue;
      }

      const distanceKm = haversineDistanceKm(fromCoordinate, toCoordinate);
      adjacency.set(from, [...(adjacency.get(from) ?? []), { to, distanceKm }]);
      adjacency.set(to, [...(adjacency.get(to) ?? []), { to: from, distanceKm }]);
    }
  });

  return {
    nodeCoordinates,
    adjacency
  };
}

function findNearestGraphNode(target: GraphCoordinate, nodeCoordinates: Map<number, GraphCoordinate>) {
  let nearestNodeId: number | null = null;
  let nearestDistanceKm = Number.POSITIVE_INFINITY;

  nodeCoordinates.forEach((coordinate, nodeId) => {
    const distanceKm = haversineDistanceKm(target, coordinate);

    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestNodeId = nodeId;
    }
  });

  return {
    nodeId: nearestNodeId,
    distanceKm: nearestDistanceKm
  };
}

class MinHeap {
  private heap: PathNode[] = [];

  push(value: PathNode) {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (!this.heap.length) {
      return null;
    }

    const min = this.heap[0];
    const end = this.heap.pop();

    if (end && this.heap.length) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }

    return min;
  }

  get size() {
    return this.heap.length;
  }

  private bubbleUp(index: number) {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[currentIndex].priority) {
        break;
      }

      [this.heap[parentIndex], this.heap[currentIndex]] = [this.heap[currentIndex], this.heap[parentIndex]];
      currentIndex = parentIndex;
    }
  }

  private bubbleDown(index: number) {
    let currentIndex = index;

    while (true) {
      const leftIndex = currentIndex * 2 + 1;
      const rightIndex = currentIndex * 2 + 2;
      let smallestIndex = currentIndex;

      if (
        leftIndex < this.heap.length &&
        this.heap[leftIndex].priority < this.heap[smallestIndex].priority
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.heap[rightIndex].priority < this.heap[smallestIndex].priority
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === currentIndex) {
        break;
      }

      [this.heap[currentIndex], this.heap[smallestIndex]] = [this.heap[smallestIndex], this.heap[currentIndex]];
      currentIndex = smallestIndex;
    }
  }
}

function findShortestPath(
  startNodeId: number,
  endNodeId: number,
  adjacency: Map<number, Array<{ to: number; distanceKm: number }>>
) {
  const distances = new Map<number, number>([[startNodeId, 0]]);
  const previous = new Map<number, number>();
  const queue = new MinHeap();
  queue.push({
    id: startNodeId,
    priority: 0
  });

  while (queue.size) {
    const current = queue.pop();
    if (!current) {
      break;
    }

    if (current.id === endNodeId) {
      break;
    }

    const currentDistance = distances.get(current.id);
    if (currentDistance === undefined || current.priority > currentDistance) {
      continue;
    }

    (adjacency.get(current.id) ?? []).forEach((edge) => {
      const nextDistance = currentDistance + edge.distanceKm;
      const bestDistance = distances.get(edge.to);

      if (bestDistance !== undefined && bestDistance <= nextDistance) {
        return;
      }

      distances.set(edge.to, nextDistance);
      previous.set(edge.to, current.id);
      queue.push({
        id: edge.to,
        priority: nextDistance
      });
    });
  }

  if (!distances.has(endNodeId)) {
    return null;
  }

  const path: number[] = [];
  let current: number | undefined = endNodeId;

  while (current !== undefined) {
    path.unshift(current);
    current = previous.get(current);
  }

  return path;
}

function downsampleCoordinates(points: PlannedGeometryPoint[]) {
  if (points.length <= MAX_SAVED_GEOMETRY_POINTS) {
    return points.map((point, index) => ({
      ...point,
      orderIndex: index
    }));
  }

  const stride = Math.ceil(points.length / MAX_SAVED_GEOMETRY_POINTS);
  const sampled = points.filter((_, index) => index % stride === 0);

  const lastPoint = points[points.length - 1];
  if (!sampled.length || sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled.map((point, index) => ({
    ...point,
    orderIndex: index
  }));
}

function buildPlannedGeometry(
  stops: RouteStop[],
  pathNodes: number[][],
  nodeCoordinates: Map<number, GraphCoordinate>
) {
  const points: PlannedGeometryPoint[] = [];

  pathNodes.forEach((segmentNodeIds, segmentIndex) => {
    const startStop = stops[segmentIndex];
    const endStop = stops[segmentIndex + 1];

    if (!points.length) {
      points.push({
        lat: startStop.lat,
        lng: startStop.lng,
        orderIndex: points.length,
        kind: segmentIndex === 0 ? "source" : "waypoint"
      });
    }

    segmentNodeIds.forEach((nodeId, nodeIndex) => {
      const coordinate = nodeCoordinates.get(nodeId);
      if (!coordinate) {
        return;
      }

      if (nodeIndex === 0 || nodeIndex === segmentNodeIds.length - 1) {
        return;
      }

      points.push({
        lat: coordinate.lat,
        lng: coordinate.lng,
        orderIndex: points.length,
        kind: "waypoint"
      });
    });

    points.push({
      lat: endStop.lat,
      lng: endStop.lng,
      orderIndex: points.length,
      kind: segmentIndex === pathNodes.length - 1 ? "destination" : "waypoint"
    });
  });

  const deduped = points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previousPoint = points[index - 1];
    return previousPoint.lat !== point.lat || previousPoint.lng !== point.lng;
  });

  return downsampleCoordinates(deduped);
}

export class RailRouteGeometryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RailRouteGeometryError";
  }
}

export async function buildRailRouteGeometry(stops: RouteStop[]) {
  const routeStops = stops.filter(Boolean);

  if (routeStops.length < 2) {
    throw new RailRouteGeometryError("At least two stations are required to build a rail route.");
  }

  const paddingAttempts = [0.35, 0.55];

  for (const paddingDegrees of paddingAttempts) {
    const query = buildRailNetworkQuery(createBoundingBoxes(routeStops, paddingDegrees));
    const response = await fetchOverpassJson<RailwayGraphElement>(query);
    const graph = buildGraph(response.elements);

    if (!graph.nodeCoordinates.size || !graph.adjacency.size) {
      continue;
    }

    const snappedStops = routeStops.map((stop) => ({
      stop,
      snap: findNearestGraphNode(stop, graph.nodeCoordinates)
    }));

    if (snappedStops.some((entry) => entry.snap.nodeId === null || entry.snap.distanceKm > 10)) {
      continue;
    }

    const pathNodes: number[][] = [];
    let failed = false;

    for (let index = 0; index < snappedStops.length - 1; index += 1) {
      const startNodeId = snappedStops[index].snap.nodeId;
      const endNodeId = snappedStops[index + 1].snap.nodeId;

      if (startNodeId === null || endNodeId === null) {
        failed = true;
        break;
      }

      const path = findShortestPath(startNodeId, endNodeId, graph.adjacency);
      if (!path?.length) {
        failed = true;
        break;
      }

      pathNodes.push(path);
    }

    if (failed) {
      continue;
    }

    return buildPlannedGeometry(routeStops, pathNodes, graph.nodeCoordinates);
  }

  throw new RailRouteGeometryError(
    "CargoGuardian could not resolve a shaped rail corridor for these stations. Try a different station match or add via stations to constrain the corridor."
  );
}
