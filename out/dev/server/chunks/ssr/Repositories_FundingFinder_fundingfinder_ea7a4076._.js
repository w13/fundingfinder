module.exports = [
"[project]/Repositories/FundingFinder/fundingfinder/lib/format.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatSourceLabel",
    ()=>formatSourceLabel
]);
function formatSourceLabel(source) {
    return source.split("_").filter(Boolean).map((token)=>token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/lib/shortlist.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addShortlist",
    ()=>addShortlist,
    "analyzeShortlist",
    ()=>analyzeShortlist,
    "fetchShortlist",
    ()=>fetchShortlist,
    "removeShortlist",
    ()=>removeShortlist
]);
const API_BASE_URL = process.env.GRANT_SENTINEL_API_URL ?? ("TURBOPACK compile-time value", "https://grant-sentinel.wakas.workers.dev") ?? "";
async function fetchShortlist() {
    if (!API_BASE_URL) {
        return {
            items: [],
            warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint."
        };
    }
    const response = await fetch(new URL("/api/shortlist", API_BASE_URL), {
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
        items: payload.items ?? []
    };
}
async function addShortlist(opportunityId, source) {
    if (!API_BASE_URL) return false;
    const response = await fetch(new URL("/api/shortlist", API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            opportunityId,
            source
        })
    });
    return response.ok;
}
async function removeShortlist(shortlistId) {
    if (!API_BASE_URL) return false;
    const response = await fetch(new URL("/api/shortlist/remove", API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            shortlistId
        })
    });
    return response.ok;
}
async function analyzeShortlist(shortlistIds) {
    if (!API_BASE_URL) return false;
    const response = await fetch(new URL("/api/shortlist/analyze", API_BASE_URL), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            shortlistIds
        })
    });
    return response.ok;
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/components/ScoreBadge.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScoreBadge",
    ()=>ScoreBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function ScoreBadge({ label, value }) {
    const score = value ?? 0;
    const variant = value === null ? "muted" : score >= 80 ? "good" : score >= 60 ? "warn" : "low";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `badge badge--${variant}`,
        children: [
            label,
            ": ",
            value ?? "N/A"
        ]
    }, void 0, true, {
        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/ScoreBadge.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "$$RSC_SERVER_ACTION_0",
    ()=>$$RSC_SERVER_ACTION_0,
    "default",
    ()=>OpportunityList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"40ae5a1aba4cd59064f371f11958c3bdab34bb555c":"$$RSC_SERVER_ACTION_0"},"",""] */ var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$format$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/lib/format.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$shortlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/lib/shortlist.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$ScoreBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/components/ScoreBadge.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const $$RSC_SERVER_ACTION_0 = async function handleShortlist(formData) {
    const opportunityId = String(formData.get("opportunityId") ?? "").trim();
    const source = String(formData.get("source") ?? "").trim();
    if (!opportunityId || !source) return;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$shortlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addShortlist"])(opportunityId, source);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/shortlist");
};
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])($$RSC_SERVER_ACTION_0, "40ae5a1aba4cd59064f371f11958c3bdab34bb555c", null);
function OpportunityList({ items, shortlistKeys = [], showShortlistActions = false }) {
    const shortlistSet = new Set(shortlistKeys);
    var handleShortlist = $$RSC_SERVER_ACTION_0;
    if (items.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "card",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    style: {
                        margin: 0
                    },
                    children: "No opportunities yet"
                }, void 0, false, {
                    fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "muted",
                    style: {
                        marginTop: "8px"
                    },
                    children: "Trigger the ingestion Worker to populate the database, or refine your search."
                }, void 0, false, {
                    fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid",
        children: items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card",
                style: {
                    display: "grid",
                    gap: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/opportunities/${item.id}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            style: {
                                                margin: 0,
                                                fontSize: "18px"
                                            },
                                            children: item.title
                                        }, void 0, false, {
                                            fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                            lineNumber: 45,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "muted",
                                        style: {
                                            margin: "4px 0 0"
                                        },
                                        children: [
                                            item.agency ?? "Unknown agency",
                                            " · ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$lib$2f$format$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["formatSourceLabel"])(item.source)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 47,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    justifyContent: "flex-end"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$ScoreBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ScoreBadge"], {
                                        label: "Feasibility",
                                        value: item.feasibilityScore
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 52,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$ScoreBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ScoreBadge"], {
                                        label: "Suitability",
                                        value: item.suitabilityScore ?? null
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 53,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$ScoreBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ScoreBadge"], {
                                        label: "Profitability",
                                        value: item.profitabilityScore
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 54,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: 0
                        },
                        children: item.summary ?? "No summary captured yet."
                    }, void 0, false, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "16px",
                            fontSize: "12px",
                            color: "#64748b",
                            flexWrap: "wrap"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Posted: ",
                                    item.postedDate ?? "N/A"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 59,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Due: ",
                                    item.dueDate ?? "N/A"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 60,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Keyword score: ",
                                    item.keywordScore
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                        lineNumber: 58,
                        columnNumber: 11
                    }, this),
                    showShortlistActions ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap"
                        },
                        children: [
                            shortlistSet.has(`${item.source}:${item.opportunityId}`) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "pill",
                                children: "Shortlisted"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 66,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                action: handleShortlist,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "hidden",
                                        name: "opportunityId",
                                        value: item.opportunityId
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 69,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "hidden",
                                        name: "source",
                                        value: item.source
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 70,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "button button--secondary",
                                        type: "submit",
                                        children: "Add to shortlist"
                                    }, void 0, false, {
                                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                        lineNumber: 71,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 68,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `/opportunities/${item.id}`,
                                className: "button button--secondary",
                                children: "View details"
                            }, void 0, false, {
                                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                                lineNumber: 76,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                        lineNumber: 64,
                        columnNumber: 13
                    }, this) : null
                ]
            }, item.id, true, {
                fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
                lineNumber: 41,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
"[project]/Repositories/FundingFinder/fundingfinder/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)");
;
}),
"[project]/Repositories/FundingFinder/fundingfinder/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40ae5a1aba4cd59064f371f11958c3bdab34bb555c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$$RSC_SERVER_ACTION_0"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Repositories/FundingFinder/fundingfinder/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Repositories$2f$FundingFinder$2f$fundingfinder$2f$components$2f$OpportunityList$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Repositories/FundingFinder/fundingfinder/components/OpportunityList.tsx [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Repositories_FundingFinder_fundingfinder_ea7a4076._.js.map