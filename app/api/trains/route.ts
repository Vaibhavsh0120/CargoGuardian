import { failure, created, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { createTrainSchema, trainListQuerySchema } from "@/lib/validation/trains";
import { listTrains, listTrainSelectorItems } from "@/services/trains/read";
import { createTrain, TrainAlreadyExistsError } from "@/services/trains/write";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  // Selector mode returns the lightweight train picker data (backward compat)
  if (mode === "selector") {
    return ok(await listTrainSelectorItems(user));
  }

  const parsed = trainListQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDir: searchParams.get("sortDir") ?? undefined
  });

  if (!parsed.success) {
    return failure("Invalid query parameters.", 400);
  }

  const trains = await listTrains(parsed.data, user);
  return ok({ trains, fetchedAt: new Date().toISOString() });
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (user.role !== "admin") {
    return failure("Only administrators can create trains.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid JSON body.", 400);
  }

  const parsed = createTrainSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return failure(firstError, 422);
  }

  try {
    const train = await createTrain(parsed.data, user.uid);
    return created(train);
  } catch (error) {
    if (error instanceof TrainAlreadyExistsError) {
      return failure(error.message, 409);
    }
    throw error;
  }
}
