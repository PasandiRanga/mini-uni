"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/me/route";
exports.ids = ["app/api/auth/me/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Fme%2Froute&page=%2Fapi%2Fauth%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fme%2Froute.ts&appDir=E%3A%5CMiniUni%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CMiniUni&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Fme%2Froute&page=%2Fapi%2Fauth%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fme%2Froute.ts&appDir=E%3A%5CMiniUni%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CMiniUni&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var E_MiniUni_src_app_api_auth_me_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/me/route.ts */ \"(rsc)/./src/app/api/auth/me/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/me/route\",\n        pathname: \"/api/auth/me\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/me/route\"\n    },\n    resolvedPagePath: \"E:\\\\MiniUni\\\\src\\\\app\\\\api\\\\auth\\\\me\\\\route.ts\",\n    nextConfigOutput,\n    userland: E_MiniUni_src_app_api_auth_me_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/me/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGbWUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkZtZSUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkZtZSUyRnJvdXRlLnRzJmFwcERpcj1FJTNBJTVDTWluaVVuaSU1Q3NyYyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9RSUzQSU1Q01pbmlVbmkmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ0Y7QUFDM0U7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9taW5pdW5pLz9hNzk0Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkU6XFxcXE1pbmlVbmlcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcYXV0aFxcXFxtZVxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9tZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvbWVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvbWUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJFOlxcXFxNaW5pVW5pXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcbWVcXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvbWUvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Fme%2Froute&page=%2Fapi%2Fauth%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fme%2Froute.ts&appDir=E%3A%5CMiniUni%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CMiniUni&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/me/route.ts":
/*!**************************************!*\
  !*** ./src/app/api/auth/me/route.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\nasync function GET(request) {\n    try {\n        const session = await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.getSessionFromRequest)(request);\n        if (!session || !session.sub) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__[\"default\"].user.findUnique({\n            where: {\n                id: session.sub\n            },\n            select: {\n                id: true,\n                email: true,\n                firstName: true,\n                lastName: true,\n                role: true,\n                isActive: true\n            }\n        });\n        if (!user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"User not found\"\n            }, {\n                status: 404\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(user);\n    } catch (error) {\n        console.error(\"Error fetching current user:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Internal server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL21lL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBMkM7QUFDUTtBQUNqQjtBQUUzQixlQUFlRyxJQUFJQyxPQUFnQjtJQUN0QyxJQUFJO1FBQ0EsTUFBTUMsVUFBVSxNQUFNSixnRUFBcUJBLENBQUNHO1FBRTVDLElBQUksQ0FBQ0MsV0FBVyxDQUFDQSxRQUFRQyxHQUFHLEVBQUU7WUFDMUIsT0FBT04scURBQVlBLENBQUNPLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFlLEdBQUc7Z0JBQUVDLFFBQVE7WUFBSTtRQUN0RTtRQUVBLE1BQU1DLE9BQU8sTUFBTVIsbURBQU1BLENBQUNRLElBQUksQ0FBQ0MsVUFBVSxDQUFDO1lBQ3RDQyxPQUFPO2dCQUFFQyxJQUFJUixRQUFRQyxHQUFHO1lBQUM7WUFDekJRLFFBQVE7Z0JBQ0pELElBQUk7Z0JBQ0pFLE9BQU87Z0JBQ1BDLFdBQVc7Z0JBQ1hDLFVBQVU7Z0JBQ1ZDLE1BQU07Z0JBQ05DLFVBQVU7WUFDZDtRQUNKO1FBRUEsSUFBSSxDQUFDVCxNQUFNO1lBQ1AsT0FBT1YscURBQVlBLENBQUNPLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFpQixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDeEU7UUFFQSxPQUFPVCxxREFBWUEsQ0FBQ08sSUFBSSxDQUFDRztJQUM3QixFQUFFLE9BQU9GLE9BQU87UUFDWlksUUFBUVosS0FBSyxDQUFDLGdDQUFnQ0E7UUFDOUMsT0FBT1IscURBQVlBLENBQUNPLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQXdCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQy9FO0FBQ0oiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9taW5pdW5pLy4vc3JjL2FwcC9hcGkvYXV0aC9tZS9yb3V0ZS50cz81OGJmIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xyXG5pbXBvcnQgeyBnZXRTZXNzaW9uRnJvbVJlcXVlc3QgfSBmcm9tIFwiQC9saWIvYXV0aFwiO1xyXG5pbXBvcnQgcHJpc21hIGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdDogUmVxdWVzdCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2Vzc2lvbkZyb21SZXF1ZXN0KHJlcXVlc3QpO1xyXG5cclxuICAgICAgICBpZiAoIXNlc3Npb24gfHwgIXNlc3Npb24uc3ViKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICAgIHdoZXJlOiB7IGlkOiBzZXNzaW9uLnN1YiB9LFxyXG4gICAgICAgICAgICBzZWxlY3Q6IHtcclxuICAgICAgICAgICAgICAgIGlkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBmaXJzdE5hbWU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHJvbGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBpc0FjdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVzZXIgbm90IGZvdW5kXCIgfSwgeyBzdGF0dXM6IDQwNCB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih1c2VyKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIGN1cnJlbnQgdXNlcjpcIiwgZXJyb3IpO1xyXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiIH0sIHsgc3RhdHVzOiA1MDAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldFNlc3Npb25Gcm9tUmVxdWVzdCIsInByaXNtYSIsIkdFVCIsInJlcXVlc3QiLCJzZXNzaW9uIiwic3ViIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImlkIiwic2VsZWN0IiwiZW1haWwiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsInJvbGUiLCJpc0FjdGl2ZSIsImNvbnNvbGUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/me/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   decrypt: () => (/* binding */ decrypt),\n/* harmony export */   encrypt: () => (/* binding */ encrypt),\n/* harmony export */   getSession: () => (/* binding */ getSession),\n/* harmony export */   getSessionFromRequest: () => (/* binding */ getSessionFromRequest),\n/* harmony export */   updateSession: () => (/* binding */ updateSession)\n/* harmony export */ });\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/sign.js\");\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/verify.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n\n\nconst secretKey = process.env.JWT_SECRET || \"default-secret-key-change-me\";\nconst key = new TextEncoder().encode(secretKey);\nasync function encrypt(payload) {\n    return await new jose__WEBPACK_IMPORTED_MODULE_2__.SignJWT(payload).setProtectedHeader({\n        alg: \"HS256\"\n    }).setIssuedAt().setExpirationTime(\"24h\").sign(key);\n}\nasync function decrypt(input) {\n    const { payload } = await (0,jose__WEBPACK_IMPORTED_MODULE_3__.jwtVerify)(input, key, {\n        algorithms: [\n            \"HS256\"\n        ]\n    });\n    return payload;\n}\nasync function getSession() {\n    const token = (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)().get(\"token\")?.value;\n    if (!token) return null;\n    try {\n        return await decrypt(token);\n    } catch (err) {\n        return null;\n    }\n}\nasync function getSessionFromRequest(request) {\n    let token;\n    if (request instanceof next_server__WEBPACK_IMPORTED_MODULE_1__.NextRequest) {\n        token = request.cookies.get(\"token\")?.value;\n    }\n    if (!token) {\n        const authHeader = request.headers.get(\"authorization\");\n        if (authHeader && authHeader.startsWith(\"Bearer \")) {\n            token = authHeader.substring(7);\n        }\n    }\n    if (!token) return null;\n    try {\n        return await decrypt(token);\n    } catch (err) {\n        return null;\n    }\n}\nasync function updateSession(request) {\n    const token = request.cookies.get(\"token\")?.value;\n    if (!token) return;\n    // Refresh the session so it doesn't expire\n    const parsed = await decrypt(token);\n    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);\n    const res = next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.next();\n    res.cookies.set({\n        name: \"token\",\n        value: await encrypt(parsed),\n        httpOnly: true,\n        expires: parsed.expires\n    });\n    return res;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQTBDO0FBQ0g7QUFDaUI7QUFFeEQsTUFBTUssWUFBWUMsUUFBUUMsR0FBRyxDQUFDQyxVQUFVLElBQUk7QUFDNUMsTUFBTUMsTUFBTSxJQUFJQyxjQUFjQyxNQUFNLENBQUNOO0FBRTlCLGVBQWVPLFFBQVFDLE9BQVk7SUFDdEMsT0FBTyxNQUFNLElBQUliLHlDQUFPQSxDQUFDYSxTQUNwQkMsa0JBQWtCLENBQUM7UUFBRUMsS0FBSztJQUFRLEdBQ2xDQyxXQUFXLEdBQ1hDLGlCQUFpQixDQUFDLE9BQ2xCQyxJQUFJLENBQUNUO0FBQ2Q7QUFFTyxlQUFlVSxRQUFRQyxLQUFhO0lBQ3ZDLE1BQU0sRUFBRVAsT0FBTyxFQUFFLEdBQUcsTUFBTVosK0NBQVNBLENBQUNtQixPQUFPWCxLQUFLO1FBQzVDWSxZQUFZO1lBQUM7U0FBUTtJQUN6QjtJQUNBLE9BQU9SO0FBQ1g7QUFFTyxlQUFlUztJQUNsQixNQUFNQyxRQUFRckIscURBQU9BLEdBQUdzQixHQUFHLENBQUMsVUFBVUM7SUFDdEMsSUFBSSxDQUFDRixPQUFPLE9BQU87SUFDbkIsSUFBSTtRQUNBLE9BQU8sTUFBTUosUUFBUUk7SUFDekIsRUFBRSxPQUFPRyxLQUFLO1FBQ1YsT0FBTztJQUNYO0FBQ0o7QUFFTyxlQUFlQyxzQkFBc0JDLE9BQThCO0lBQ3RFLElBQUlMO0lBRUosSUFBSUssbUJBQW1CekIsb0RBQVdBLEVBQUU7UUFDaENvQixRQUFRSyxRQUFRMUIsT0FBTyxDQUFDc0IsR0FBRyxDQUFDLFVBQVVDO0lBQzFDO0lBRUEsSUFBSSxDQUFDRixPQUFPO1FBQ1IsTUFBTU0sYUFBYUQsUUFBUUUsT0FBTyxDQUFDTixHQUFHLENBQUM7UUFDdkMsSUFBSUssY0FBY0EsV0FBV0UsVUFBVSxDQUFDLFlBQVk7WUFDaERSLFFBQVFNLFdBQVdHLFNBQVMsQ0FBQztRQUNqQztJQUNKO0lBRUEsSUFBSSxDQUFDVCxPQUFPLE9BQU87SUFFbkIsSUFBSTtRQUNBLE9BQU8sTUFBTUosUUFBUUk7SUFDekIsRUFBRSxPQUFPRyxLQUFLO1FBQ1YsT0FBTztJQUNYO0FBQ0o7QUFFTyxlQUFlTyxjQUFjTCxPQUFvQjtJQUNwRCxNQUFNTCxRQUFRSyxRQUFRMUIsT0FBTyxDQUFDc0IsR0FBRyxDQUFDLFVBQVVDO0lBQzVDLElBQUksQ0FBQ0YsT0FBTztJQUVaLDJDQUEyQztJQUMzQyxNQUFNVyxTQUFTLE1BQU1mLFFBQVFJO0lBQzdCVyxPQUFPQyxPQUFPLEdBQUcsSUFBSUMsS0FBS0EsS0FBS0MsR0FBRyxLQUFLLEtBQUssS0FBSyxLQUFLO0lBQ3RELE1BQU1DLE1BQU1sQyxxREFBWUEsQ0FBQ21DLElBQUk7SUFDN0JELElBQUlwQyxPQUFPLENBQUNzQyxHQUFHLENBQUM7UUFDWkMsTUFBTTtRQUNOaEIsT0FBTyxNQUFNYixRQUFRc0I7UUFDckJRLFVBQVU7UUFDVlAsU0FBU0QsT0FBT0MsT0FBTztJQUMzQjtJQUNBLE9BQU9HO0FBQ1giLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9taW5pdW5pLy4vc3JjL2xpYi9hdXRoLnRzPzY2OTIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2lnbkpXVCwgand0VmVyaWZ5IH0gZnJvbSBcImpvc2VcIjtcclxuaW1wb3J0IHsgY29va2llcyB9IGZyb20gXCJuZXh0L2hlYWRlcnNcIjtcclxuaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xyXG5cclxuY29uc3Qgc2VjcmV0S2V5ID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCBcImRlZmF1bHQtc2VjcmV0LWtleS1jaGFuZ2UtbWVcIjtcclxuY29uc3Qga2V5ID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHNlY3JldEtleSk7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jcnlwdChwYXlsb2FkOiBhbnkpIHtcclxuICAgIHJldHVybiBhd2FpdCBuZXcgU2lnbkpXVChwYXlsb2FkKVxyXG4gICAgICAgIC5zZXRQcm90ZWN0ZWRIZWFkZXIoeyBhbGc6IFwiSFMyNTZcIiB9KVxyXG4gICAgICAgIC5zZXRJc3N1ZWRBdCgpXHJcbiAgICAgICAgLnNldEV4cGlyYXRpb25UaW1lKFwiMjRoXCIpXHJcbiAgICAgICAgLnNpZ24oa2V5KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY3J5cHQoaW5wdXQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgICBjb25zdCB7IHBheWxvYWQgfSA9IGF3YWl0IGp3dFZlcmlmeShpbnB1dCwga2V5LCB7XHJcbiAgICAgICAgYWxnb3JpdGhtczogW1wiSFMyNTZcIl0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwYXlsb2FkO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2Vzc2lvbigpIHtcclxuICAgIGNvbnN0IHRva2VuID0gY29va2llcygpLmdldChcInRva2VuXCIpPy52YWx1ZTtcclxuICAgIGlmICghdG9rZW4pIHJldHVybiBudWxsO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZGVjcnlwdCh0b2tlbik7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlc3Npb25Gcm9tUmVxdWVzdChyZXF1ZXN0OiBOZXh0UmVxdWVzdCB8IFJlcXVlc3QpIHtcclxuICAgIGxldCB0b2tlbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChyZXF1ZXN0IGluc3RhbmNlb2YgTmV4dFJlcXVlc3QpIHtcclxuICAgICAgICB0b2tlbiA9IHJlcXVlc3QuY29va2llcy5nZXQoXCJ0b2tlblwiKT8udmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0b2tlbikge1xyXG4gICAgICAgIGNvbnN0IGF1dGhIZWFkZXIgPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKTtcclxuICAgICAgICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICAgICAgICAgIHRva2VuID0gYXV0aEhlYWRlci5zdWJzdHJpbmcoNyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghdG9rZW4pIHJldHVybiBudWxsO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGRlY3J5cHQodG9rZW4pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVTZXNzaW9uKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XHJcbiAgICBjb25zdCB0b2tlbiA9IHJlcXVlc3QuY29va2llcy5nZXQoXCJ0b2tlblwiKT8udmFsdWU7XHJcbiAgICBpZiAoIXRva2VuKSByZXR1cm47XHJcblxyXG4gICAgLy8gUmVmcmVzaCB0aGUgc2Vzc2lvbiBzbyBpdCBkb2Vzbid0IGV4cGlyZVxyXG4gICAgY29uc3QgcGFyc2VkID0gYXdhaXQgZGVjcnlwdCh0b2tlbik7XHJcbiAgICBwYXJzZWQuZXhwaXJlcyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyAyNCAqIDYwICogNjAgKiAxMDAwKTtcclxuICAgIGNvbnN0IHJlcyA9IE5leHRSZXNwb25zZS5uZXh0KCk7XHJcbiAgICByZXMuY29va2llcy5zZXQoe1xyXG4gICAgICAgIG5hbWU6IFwidG9rZW5cIixcclxuICAgICAgICB2YWx1ZTogYXdhaXQgZW5jcnlwdChwYXJzZWQpLFxyXG4gICAgICAgIGh0dHBPbmx5OiB0cnVlLFxyXG4gICAgICAgIGV4cGlyZXM6IHBhcnNlZC5leHBpcmVzLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcbiJdLCJuYW1lcyI6WyJTaWduSldUIiwiand0VmVyaWZ5IiwiY29va2llcyIsIk5leHRSZXF1ZXN0IiwiTmV4dFJlc3BvbnNlIiwic2VjcmV0S2V5IiwicHJvY2VzcyIsImVudiIsIkpXVF9TRUNSRVQiLCJrZXkiLCJUZXh0RW5jb2RlciIsImVuY29kZSIsImVuY3J5cHQiLCJwYXlsb2FkIiwic2V0UHJvdGVjdGVkSGVhZGVyIiwiYWxnIiwic2V0SXNzdWVkQXQiLCJzZXRFeHBpcmF0aW9uVGltZSIsInNpZ24iLCJkZWNyeXB0IiwiaW5wdXQiLCJhbGdvcml0aG1zIiwiZ2V0U2Vzc2lvbiIsInRva2VuIiwiZ2V0IiwidmFsdWUiLCJlcnIiLCJnZXRTZXNzaW9uRnJvbVJlcXVlc3QiLCJyZXF1ZXN0IiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJzdGFydHNXaXRoIiwic3Vic3RyaW5nIiwidXBkYXRlU2Vzc2lvbiIsInBhcnNlZCIsImV4cGlyZXMiLCJEYXRlIiwibm93IiwicmVzIiwibmV4dCIsInNldCIsIm5hbWUiLCJodHRwT25seSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst prismaClientSingleton = ()=>{\n    return new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\n};\nconst prisma = globalThis.prisma ?? prismaClientSingleton();\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\nif (true) globalThis.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBOEM7QUFFOUMsTUFBTUMsd0JBQXdCO0lBQzFCLE9BQU8sSUFBSUQsd0RBQVlBO0FBQzNCO0FBTUEsTUFBTUUsU0FBU0MsV0FBV0QsTUFBTSxJQUFJRDtBQUVwQyxpRUFBZUMsTUFBTUEsRUFBQztBQUV0QixJQUFJRSxJQUF5QixFQUFjRCxXQUFXRCxNQUFNLEdBQUdBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWluaXVuaS8uL3NyYy9saWIvcHJpc21hLnRzPzAxZDciXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xyXG5cclxuY29uc3QgcHJpc21hQ2xpZW50U2luZ2xldG9uID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcmlzbWFDbGllbnQoKTtcclxufTtcclxuXHJcbmRlY2xhcmUgZ2xvYmFsIHtcclxuICAgIHZhciBwcmlzbWE6IHVuZGVmaW5lZCB8IFJldHVyblR5cGU8dHlwZW9mIHByaXNtYUNsaWVudFNpbmdsZXRvbj47XHJcbn1cclxuXHJcbmNvbnN0IHByaXNtYSA9IGdsb2JhbFRoaXMucHJpc21hID8/IHByaXNtYUNsaWVudFNpbmdsZXRvbigpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJpc21hO1xyXG5cclxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGdsb2JhbFRoaXMucHJpc21hID0gcHJpc21hO1xyXG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwicHJpc21hQ2xpZW50U2luZ2xldG9uIiwicHJpc21hIiwiZ2xvYmFsVGhpcyIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/jose"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Fme%2Froute&page=%2Fapi%2Fauth%2Fme%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fme%2Froute.ts&appDir=E%3A%5CMiniUni%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CMiniUni&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();