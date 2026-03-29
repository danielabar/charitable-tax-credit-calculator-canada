/**
 * Minimal SPA router for three routes.
 * Uses pushState/popstate, template-loader caching, and view init/destroy lifecycle.
 * Base path is auto-detected — works on localhost, GitHub Pages, or any host.
 */

import { basePath } from "./base-path.js";
import { loadTemplate } from "./ui/template-loader.js";
import { trackPageView } from "./analytics.js";

const routes = {
  "/": "calculator",
  "/learn": "learn",
  "/about": "about",
};

let currentView = null;
let currentRoute = null;

/**
 * Strip the base path prefix to get the route path.
 * /repo-name/about → /about
 * /repo-name/      → /
 */
function normalizePath(fullPath) {
  let path = fullPath.split("?")[0].split("#")[0];

  if (basePath !== "/" && path.startsWith(basePath)) {
    path = path.slice(basePath.length - 1);
  }

  if (!path.startsWith("/")) path = "/" + path;
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);

  return path;
}

/**
 * Add the base path prefix to a route path for use in URLs.
 * /about → /repo-name/about
 */
function buildFullPath(routePath) {
  if (basePath === "/") return routePath;
  return basePath.replace(/\/$/, "") + routePath;
}

/**
 * Navigate to a route. Loads the view template, calls init/destroy lifecycle.
 * @param {string} routePath - e.g. "/" or "/about"
 * @param {object} options
 * @param {boolean} options.pushState - whether to push a history entry (false for popstate/initial load)
 */
async function navigate(routePath, { pushState = true, force = false } = {}) {
  if (routePath === currentRoute && !force) return;

  const viewDir = routes[routePath];
  if (!viewDir) {
    navigate("/", { pushState });
    return;
  }

  // Update URL and state synchronously (before async content loading)
  if (pushState) {
    history.pushState({ route: routePath }, "", buildFullPath(routePath));
  }

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("data-route") === routePath,
    );
  });

  currentRoute = routePath;

  // Destroy previous view and clear content before async load
  if (currentView?.destroy) {
    currentView.destroy();
  }
  const contentEl = document.getElementById("content");
  contentEl.innerHTML = "";

  // Load template and view module
  const html = await loadTemplate(`views/${viewDir}/template.html`);
  const viewModule = await import(`../views/${viewDir}/script.js`);
  currentView = viewModule;

  // Let the view control when its content enters the DOM
  if (viewModule.init) {
    await viewModule.init(contentEl, html);
  }

  // Signal that navigation is complete (used by e2e tests to detect route changes)
  contentEl.setAttribute("data-view", viewDir);

  trackPageView(currentRoute + location.search);
}

/**
 * Initialize the router: set up event listeners and load the initial route.
 */
function start() {
  // Browser back/forward
  window.addEventListener("popstate", () => {
    const routePath = normalizePath(location.pathname);
    navigate(routePath, { pushState: false });
  });

  // Intercept clicks on [data-route] links
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-route]");
    if (!link) return;
    event.preventDefault();
    const route = link.getAttribute("data-route");
    // Logo click forces fresh render even if already on the route
    navigate(route, { force: link.classList.contains("logo") });
  });

  // Initial route
  const routePath = normalizePath(location.pathname);
  navigate(routePath, { pushState: false });

  // Replace the initial history entry with a SPA-managed one.
  // Without this, the initial entry (from a real page load) can cause a full
  // page reload on back navigation instead of a popstate event.
  history.replaceState({ route: routePath }, "", location.href);
}

export { start, navigate, normalizePath, buildFullPath, basePath };
