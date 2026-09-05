// Structure adapted from alan2207/bulletproof-react src/testing/mocks/handlers (MIT); see README.md#credits.
// Handlers mirror the Django routes in api/percontra/urls.py, typed from the shared contract.
import type { RequestHandler } from "msw";

// Empty by default: setup.ts runs with onUnhandledRequest "error", so a surface
// that starts fetching must add its handler here in the same change.
export const handlers: RequestHandler[] = [];
