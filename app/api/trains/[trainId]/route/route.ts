import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { upsertTrainRouteSchema } from "@/lib/validation/routes";
import { getTrainRoute } from "@/services/routes/read";
import {
  RailRouteGeometryError,
  RouteTrainNotFoundError,
  RouteWritePermissionError,
  upsertTrainRoute
} from "@/services/routes/write";

export async function GET(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { trainId } = await params;
  const route = await getTrainRoute(trainId, user);

  if (!route) {
    return failure("Route not found.", 404);
  }

  return ok(route);
}

export async function PUT(request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid JSON body.", 400);
  }

  const parsed = upsertTrainRouteSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Validation failed.", 422);
  }

  const { trainId } = await params;

  try {
    const route = await upsertTrainRoute(trainId, parsed.data, user);
    return ok(route);
  } catch (error) {
    if (error instanceof RouteWritePermissionError) {
      return failure(error.message, 403);
    }

    if (error instanceof RouteTrainNotFoundError) {
      return failure(error.message, 404);
    }

    if (error instanceof RailRouteGeometryError) {
      return failure(error.message, 422);
    }

    throw error;
  }
}
