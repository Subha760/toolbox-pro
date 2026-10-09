export const CONTROL_ORIGIN = "https://tools.choicematrix.in";
export async function control(path: string, body?: unknown) {
  const response = await fetch(`${CONTROL_ORIGIN}/api/${path}`, {
    method: body ? "POST" : "GET",
    credentials: path.startsWith("admin/") ? "include" : "omit",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401)
    throw Error(
      "Sign in at tools.choicematrix.in/admin/ to open the private dashboard.",
    );
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error(
      "Open the secure website to sign in, then refresh this dashboard.",
    );
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Request failed");
  return data;
}
