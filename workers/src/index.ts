import type { Env, PdfJob } from "./types";
import "./utils/polyfill";

import { runSync, processPdfJob } from "./jobs/sync";
import { processPendingTasks } from "./jobs/scheduler";
import { handleAdminRoutes } from "./routes/admin";
import { handleShortlistRoutes } from "./routes/shortlist";
import { handleOpportunities, handleOpportunityDetail, handleSources } from "./routes/opportunities";
import { handleSavedSearchRoutes, handleSearchEventRoutes } from "./routes/search";
import { jsonResponse } from "./utils/response";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSync(env, ctx, true));
    ctx.waitUntil(processPendingTasks(env, ctx));
  },

  async queue(batch: MessageBatch<PdfJob>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processPdfJob(env, ctx, message.body);
      } catch (error) {
        console.error("pdf job failed", error);
        message.retry();
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return jsonResponse(null, 204, request);
    }

    if (url.pathname === "/" || url.pathname === "") {
      return jsonResponse({
        name: "Grant Sentinel API",
        version: "1.0.0",
        endpoints: {
          health: "GET /health",
          opportunities: "GET /api/opportunities?query=&source=&minScore=&limit=&mode=",
          opportunityDetail: "GET /api/opportunities/:id",
          sources: "GET /api/sources",
          savedSearches: {
            list: "GET /api/saved-searches",
            create: "POST /api/saved-searches",
            delete: "POST /api/saved-searches/delete"
          },
          searchEvents: "POST /api/search-events",
          shortlist: {
            list: "GET /api/shortlist",
            add: "POST /api/shortlist",
            remove: "POST /api/shortlist/remove",
            analyze: "POST /api/shortlist/analyze"
          },
          admin: {
            summary: "GET /api/admin/summary",
            overview: "GET /api/admin/overview",
            sources: "GET /api/admin/sources",
            createSource: "POST /api/admin/sources",
            previewSource: "POST /api/admin/sources/preview",
            updateSource: "PATCH /api/admin/sources/:id",
            syncSource: "POST /api/admin/sources/:id/sync",
            exclusions: "GET /api/admin/exclusions",
            addExclusion: "POST /api/admin/exclusions",
            deleteExclusion: "DELETE /api/admin/exclusions/:id",
            runSync: "POST /api/admin/run-sync",
            notifications: "GET/POST/PATCH /api/admin/notifications",
            searchBoosts: "GET/POST /api/admin/search-boosts",
            searchAnalytics: "GET /api/admin/search-analytics",
            diagnostics: "GET /api/admin/diagnostics",
            failedJobs: "GET /api/admin/failed-jobs"
          }
        }
      }, 200, request);
    }

    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok" }, 200, request);
    }

    const opportunityResponse = await handleOpportunities(request, env, url);
    if (opportunityResponse) return opportunityResponse;

    const adminResponse = await handleAdminRoutes(request, env, ctx, url);
    if (adminResponse) return adminResponse;

    const sourceResponse = await handleSources(request, env);
    if (sourceResponse) return sourceResponse;

    const shortlistResponse = await handleShortlistRoutes(request, env, ctx, url);
    if (shortlistResponse) return shortlistResponse;

    const savedSearchResponse = await handleSavedSearchRoutes(request, env, url);
    if (savedSearchResponse) return savedSearchResponse;

    const searchEventResponse = await handleSearchEventRoutes(request, env, url);
    if (searchEventResponse) return searchEventResponse;

    const opportunityDetail = await handleOpportunityDetail(request, env, url);
    if (opportunityDetail) return opportunityDetail;

    return jsonResponse({ error: "Not found" }, 404, request);
  }
};