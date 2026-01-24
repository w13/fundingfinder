module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/Repositories/FundingFinder/fundingfinder/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function SearchForm({ query, source, minScore, mode = "smart", sources = [] }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        method: "get",
        action: "/",
        className: "card card--flat grid search-form",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "grid",
                    gap: "6px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "pill",
                        children: "Keyword search"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 13,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "input",
                        name: "q",
                        defaultValue: query,
                        placeholder: "digital therapeutics, clinical decision support"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 14,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "grid",
                    gap: "6px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "pill",
                        children: "Source"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "input",
                        list: "sourceOptions",
                        name: "source",
                        defaultValue: source ?? "",
                        placeholder: "all sources"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                        id: "sourceOptions",
                        children: sources.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: item.id,
                                children: item.name
                            }, item.id, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "grid",
                    gap: "6px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "pill",
                        children: "Min feasibility"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "input",
                        name: "minScore",
                        defaultValue: minScore,
                        placeholder: "80"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "grid",
                    gap: "6px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "pill",
                        children: "Search mode"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "select",
                        name: "mode",
                        defaultValue: mode,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "smart",
                                children: "Smart (all terms)"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "any",
                                children: "Any term"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "exact",
                                children: "Exact phrase"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                className: "button",
                children: "Search"
            }, void 0, false, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/lib/opportunities.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchOpportunities",
    ()=>fetchOpportunities,
    "fetchOpportunityById",
    ()=>fetchOpportunityById
]);
const API_BASE_URL = process.env.GRANT_SENTINEL_API_URL ?? ("TURBOPACK compile-time value", "https://grant-sentinel.wakas.workers.dev") ?? "";
async function fetchOpportunities(params) {
    if (!API_BASE_URL) {
        return {
            items: [],
            warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint."
        };
    }
    const url = new URL("/api/opportunities", API_BASE_URL);
    if (params.query) url.searchParams.set("query", params.query);
    if (params.source) url.searchParams.set("source", params.source);
    if (params.minScore) url.searchParams.set("minScore", params.minScore);
    if (typeof params.limit === "number") url.searchParams.set("limit", params.limit.toString());
    if (params.mode) url.searchParams.set("mode", params.mode);
    const response = await fetch(url.toString(), {
        cache: "no-store"
    });
    if (!response.ok) {
        return {
            items: [],
            warning: `API error ${response.status}`
        };
    }
    const payload = await response.json();
    return {
        items: payload.items ?? [],
        warning: payload.warning
    };
}
async function fetchOpportunityById(id) {
    if (!API_BASE_URL) return null;
    const url = new URL(`/api/opportunities/${id}`, API_BASE_URL);
    const response = await fetch(url.toString(), {
        cache: "no-store"
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.item ?? null;
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/lib/sources.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchSourceOptions",
    ()=>fetchSourceOptions
]);
const API_BASE_URL = process.env.GRANT_SENTINEL_API_URL ?? ("TURBOPACK compile-time value", "https://grant-sentinel.wakas.workers.dev") ?? "";
async function fetchSourceOptions() {
    if (!API_BASE_URL) {
        return {
            sources: [],
            warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint."
        };
    }
    const response = await fetch(new URL("/api/sources", API_BASE_URL), {
        cache: "no-store"
    });
    if (!response.ok) {
        return {
            sources: [],
            warning: `API error ${response.status}`
        };
    }
    const payload = await response.json();
    return {
        sources: payload.sources ?? []
    };
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$SearchForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/components/SearchForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$opportunities$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/lib/opportunities.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$sources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/lib/sources.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$shortlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/lib/shortlist.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function Page({ searchParams }) {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams ?? {};
    const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
    const source = typeof resolvedSearchParams?.source === "string" ? resolvedSearchParams.source : "";
    const minScore = typeof resolvedSearchParams?.minScore === "string" ? resolvedSearchParams.minScore : "";
    const rawMode = typeof resolvedSearchParams?.mode === "string" ? resolvedSearchParams.mode : "smart";
    const resolvedMode = rawMode === "exact" || rawMode === "any" ? rawMode : "smart";
    const [{ items, warning }, sourcesResult, shortlistResult] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$opportunities$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchOpportunities"])({
            query: query || undefined,
            source: source || undefined,
            minScore: minScore || undefined,
            mode: resolvedMode
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$sources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchSourceOptions"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$shortlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchShortlist"])()
    ]);
    const shortlistKeys = shortlistResult.items.map((item)=>`${item.source}:${item.opportunityId}`);
    const combinedWarning = warning ?? sourcesResult.warning ?? shortlistResult.warning;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "hero",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "pill",
                        children: "AI-native grant aggregation"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "hero__title",
                        children: "Funding Intelligence Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "hero__subtitle",
                        children: "The Grant Sentinel funnel mirrors public grant metadata, filters for private-sector eligibility, and escalates the top matches into AI-powered feasibility scoring."
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    combinedWarning ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card card--flat",
                        style: {
                            background: "#fef3c7",
                            color: "#92400e"
                        },
                        children: combinedWarning
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid grid-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    marginTop: 0
                                },
                                children: "Stage 1 · Metadata Mirror"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "muted",
                                children: "Polls federal APIs and global funding registries to capture the latest listings with private-sector eligibility."
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    marginTop: 0
                                },
                                children: "Stage 2 · PDF Harvester"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "muted",
                                children: "Uses Browser Rendering and R2 storage to extract program requirements and evaluation criteria at scale."
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    marginTop: 0
                                },
                                children: "Stage 3 · AI Analyst"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "muted",
                                children: "Scores feasibility, profitability, and vectors each opportunity for semantic search."
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$SearchForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                query: query,
                source: source,
                minScore: minScore,
                mode: resolvedMode,
                sources: sourcesResult.sources
            }, void 0, false, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                items: items,
                shortlistKeys: shortlistKeys,
                showShortlistActions: true
            }, void 0, false, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a6360c44._.js.map