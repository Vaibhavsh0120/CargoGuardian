export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return Response.json(data, { status: 201, ...init });
}

export function failure(message: string, status = 500, init?: ResponseInit) {
  return Response.json({ error: message }, { status, ...init });
}
