import { useEffect, useState } from "react";
const BASE = import.meta.env.BASE_URL;
export const routeHref = (path: string) => `${BASE}${path.replace(/^\//, "")}`;
export const assetUrl = (name: string) => routeHref(name);
export function currentRoute() {
  const legacy = location.hash.match(/^#\/?([a-z0-9-]+)$/);
  if (legacy && legacy[1] !== "main-content") return `tools/${legacy[1]}`;
  return decodeURI(
    location.pathname.startsWith(BASE)
      ? location.pathname.slice(BASE.length)
      : location.pathname.replace(/^\//, ""),
  ).replace(/^\/+|\/+$/g, "");
}
export function navigate(path: string, replace = false) {
  history[replace ? "replaceState" : "pushState"](
    {},
    "",
    routeHref(path ? `${path.replace(/\/$/, "")}/` : ""),
  );
  window.dispatchEvent(new Event("toolinger:navigate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}
export function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);
    window.addEventListener("toolinger:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("toolinger:navigate", update);
    };
  }, []);
  return route;
}
