import "server-only";

import { getServerEnv } from "@/lib/env/server";

type OverpassErrorBody = {
  remark?: string;
};

export type OverpassNodeElement = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

export type OverpassWayElement = {
  type: "way";
  id: number;
  nodes?: number[];
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

export type OverpassRelationElement = {
  type: "relation";
  id: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

export type OverpassResponse<TElement extends OverpassNodeElement | OverpassWayElement | OverpassRelationElement> = {
  elements: TElement[];
  remark?: string;
};

export class OverpassRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverpassRequestError";
  }
}

export async function fetchOverpassJson<
  TElement extends OverpassNodeElement | OverpassWayElement | OverpassRelationElement
>(query: string): Promise<OverpassResponse<TElement>> {
  const env = getServerEnv();
  const endpoint = env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
  const contactSuffix = env.OSM_CONTACT_EMAIL ? `; ${env.OSM_CONTACT_EMAIL}` : "";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": `CargoGuardian/0.1 (server-side rail routing${contactSuffix})`
    },
    body: new URLSearchParams({
      data: query
    }).toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as OverpassErrorBody | null;
    throw new OverpassRequestError(body?.remark ?? `Overpass request failed with ${response.status}.`);
  }

  const body = (await response.json()) as OverpassResponse<TElement>;
  if (body.remark) {
    throw new OverpassRequestError(body.remark);
  }

  return body;
}

export function escapeOverpassRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
