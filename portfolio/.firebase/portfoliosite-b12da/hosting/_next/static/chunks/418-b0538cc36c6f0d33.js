(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[418],{4203:function(e,t){"use strict";t.E=function(e,t){return e.split(",").map(function(e){var t=(e=e.trim()).match(r),i=t[1],a=t[2],u=t[3]||"",s={};return s.inverse=!!i&&"not"===i.toLowerCase(),s.type=a?a.toLowerCase():"all",u=u.match(/\([^\)]+\)/g)||[],s.expressions=u.map(function(e){var t=e.match(n),r=t[1].toLowerCase().match(o);return{modifier:r[1],feature:r[2],value:t[2]}}),s}).some(function(e){var r=e.inverse,n="all"===e.type||t.type===e.type;if(n&&r||!(n||r))return!1;var o=e.expressions.every(function(e){var r=e.feature,n=e.modifier,o=e.value,i=t[r];if(!i)return!1;switch(r){case"orientation":case"scan":return i.toLowerCase()===o.toLowerCase();case"width":case"height":case"device-width":case"device-height":o=l(o),i=l(i);break;case"resolution":o=s(o),i=s(i);break;case"aspect-ratio":case"device-aspect-ratio":case"device-pixel-ratio":o=u(o),i=u(i);break;case"grid":case"color":case"color-index":case"monochrome":o=parseInt(o,10)||1,i=parseInt(i,10)||0}switch(n){case"min":return i>=o;case"max":return i<=o;default:return i===o}});return o&&!r||!o&&r})};var r=/(?:(only|not)?\s*([^\s\(\)]+)(?:\s*and)?\s*)?(.+)?/i,n=/\(\s*([^\s\:\)]+)\s*(?:\:\s*([^\s\)]+))?\s*\)/,o=/^(?:(min|max)-)?(.+)/,i=/(em|rem|px|cm|mm|in|pt|pc)?$/,a=/(dpi|dpcm|dppx)?$/;function u(e){var t,r=Number(e);return r||(r=(t=e.match(/^(\d+)\s*\/\s*(\d+)$/))[1]/t[2]),r}function s(e){var t=parseFloat(e);switch(String(e).match(a)[1]){case"dpcm":return t/2.54;case"dppx":return 96*t;default:return t}}function l(e){var t=parseFloat(e);switch(String(e).match(i)[1]){case"em":case"rem":return 16*t;case"cm":return 96*t/2.54;case"mm":return 96*t/2.54/10;case"in":return 96*t;case"pt":return 72*t;case"pc":return 72*t/12;default:return t}}},8155:function(e,t,r){"use strict";var n=r(4203).E,o="undefined"!=typeof window?window.matchMedia:null;function i(e,t,r){var i,a=this;function u(e){a.matches=e.matches,a.media=e.media}o&&!r&&(i=o.call(window,e)),i?(this.matches=i.matches,this.media=i.media,i.addListener(u)):(this.matches=n(e,t),this.media=e),this.addListener=function(e){i&&i.addListener(e)},this.removeListener=function(e){i&&i.removeListener(e)},this.dispose=function(){i&&i.removeListener(u)}}e.exports=function(e,t,r){return new i(e,t,r)}},7138:function(e,t,r){"use strict";r.d(t,{default:function(){return o.a}});var n=r(231),o=r.n(n)},844:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"addLocale",{enumerable:!0,get:function(){return n}}),r(8157);let n=function(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];return e};("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},5944:function(e,t,r){"use strict";function n(e,t,r,n){return!1}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"getDomainLocale",{enumerable:!0,get:function(){return n}}),r(8157),("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},231:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return O}});let n=r(9920),o=r(7437),i=n._(r(2265)),a=r(8016),u=r(8029),s=r(1142),l=r(3461),c=r(844),f=r(291),d=r(4467),p=r(3106),h=r(5944),m=r(4897),g=r(1507),y=new Set;function b(e,t,r,n,o,i){if("undefined"!=typeof window&&(i||(0,u.isLocalURL)(t))){if(!n.bypassPrefetchedCheck){let o=t+"%"+r+"%"+(void 0!==n.locale?n.locale:"locale"in e?e.locale:void 0);if(y.has(o))return;y.add(o)}Promise.resolve(i?e.prefetch(t,o):e.prefetch(t,r,n)).catch(e=>{})}}function v(e){return"string"==typeof e?e:(0,s.formatUrl)(e)}let O=i.default.forwardRef(function(e,t){let r,n;let{href:s,as:y,children:O,prefetch:_=null,passHref:R,replace:P,shallow:x,scroll:j,locale:w,onClick:E,onMouseEnter:S,onTouchStart:C,legacyBehavior:M=!1,...N}=e;r=O,M&&("string"==typeof r||"number"==typeof r)&&(r=(0,o.jsx)("a",{children:r}));let k=i.default.useContext(f.RouterContext),I=i.default.useContext(d.AppRouterContext),L=null!=k?k:I,T=!k,A=!1!==_,U=null===_?g.PrefetchKind.AUTO:g.PrefetchKind.FULL,{href:W,as:D}=i.default.useMemo(()=>{if(!k){let e=v(s);return{href:e,as:y?v(y):e}}let[e,t]=(0,a.resolveHref)(k,s,!0);return{href:e,as:y?(0,a.resolveHref)(k,y):t||e}},[k,s,y]),$=i.default.useRef(W),q=i.default.useRef(D);M&&(n=i.default.Children.only(r));let z=M?n&&"object"==typeof n&&n.ref:t,[F,K,H]=(0,p.useIntersection)({rootMargin:"200px"}),B=i.default.useCallback(e=>{(q.current!==D||$.current!==W)&&(H(),q.current=D,$.current=W),F(e),z&&("function"==typeof z?z(e):"object"==typeof z&&(z.current=e))},[D,z,W,H,F]);i.default.useEffect(()=>{L&&K&&A&&b(L,W,D,{locale:w},{kind:U},T)},[D,W,K,w,A,null==k?void 0:k.locale,L,T,U]);let Y={ref:B,onClick(e){M||"function"!=typeof E||E(e),M&&n.props&&"function"==typeof n.props.onClick&&n.props.onClick(e),L&&!e.defaultPrevented&&function(e,t,r,n,o,a,s,l,c){let{nodeName:f}=e.currentTarget;if("A"===f.toUpperCase()&&(function(e){let t=e.currentTarget.getAttribute("target");return t&&"_self"!==t||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.nativeEvent&&2===e.nativeEvent.which}(e)||!c&&!(0,u.isLocalURL)(r)))return;e.preventDefault();let d=()=>{let e=null==s||s;"beforePopState"in t?t[o?"replace":"push"](r,n,{shallow:a,locale:l,scroll:e}):t[o?"replace":"push"](n||r,{scroll:e})};c?i.default.startTransition(d):d()}(e,L,W,D,P,x,j,w,T)},onMouseEnter(e){M||"function"!=typeof S||S(e),M&&n.props&&"function"==typeof n.props.onMouseEnter&&n.props.onMouseEnter(e),L&&(A||!T)&&b(L,W,D,{locale:w,priority:!0,bypassPrefetchedCheck:!0},{kind:U},T)},onTouchStart:function(e){M||"function"!=typeof C||C(e),M&&n.props&&"function"==typeof n.props.onTouchStart&&n.props.onTouchStart(e),L&&(A||!T)&&b(L,W,D,{locale:w,priority:!0,bypassPrefetchedCheck:!0},{kind:U},T)}};if((0,l.isAbsoluteUrl)(D))Y.href=D;else if(!M||R||"a"===n.type&&!("href"in n.props)){let e=void 0!==w?w:null==k?void 0:k.locale,t=(null==k?void 0:k.isLocaleDomain)&&(0,h.getDomainLocale)(D,e,null==k?void 0:k.locales,null==k?void 0:k.domainLocales);Y.href=t||(0,m.addBasePath)((0,c.addLocale)(D,e,null==k?void 0:k.defaultLocale))}return M?i.default.cloneElement(n,Y):(0,o.jsx)("a",{...N,...Y,children:r})});("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},9189:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cancelIdleCallback:function(){return n},requestIdleCallback:function(){return r}});let r="undefined"!=typeof self&&self.requestIdleCallback&&self.requestIdleCallback.bind(window)||function(e){let t=Date.now();return self.setTimeout(function(){e({didTimeout:!1,timeRemaining:function(){return Math.max(0,50-(Date.now()-t))}})},1)},n="undefined"!=typeof self&&self.cancelIdleCallback&&self.cancelIdleCallback.bind(window)||function(e){return clearTimeout(e)};("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},8016:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"resolveHref",{enumerable:!0,get:function(){return f}});let n=r(8323),o=r(1142),i=r(5519),a=r(3461),u=r(8157),s=r(8029),l=r(9195),c=r(20);function f(e,t,r){let f;let d="string"==typeof t?t:(0,o.formatWithValidation)(t),p=d.match(/^[a-zA-Z]{1,}:\/\//),h=p?d.slice(p[0].length):d;if((h.split("?",1)[0]||"").match(/(\/\/|\\)/)){console.error("Invalid href '"+d+"' passed to next/router in page: '"+e.pathname+"'. Repeated forward-slashes (//) or backslashes \\ are not valid in the href.");let t=(0,a.normalizeRepeatedSlashes)(h);d=(p?p[0]:"")+t}if(!(0,s.isLocalURL)(d))return r?[d]:d;try{f=new URL(d.startsWith("#")?e.asPath:e.pathname,"http://n")}catch(e){f=new URL("/","http://n")}try{let e=new URL(d,f);e.pathname=(0,u.normalizePathTrailingSlash)(e.pathname);let t="";if((0,l.isDynamicRoute)(e.pathname)&&e.searchParams&&r){let r=(0,n.searchParamsToUrlQuery)(e.searchParams),{result:a,params:u}=(0,c.interpolateAs)(e.pathname,e.pathname,r);a&&(t=(0,o.formatWithValidation)({pathname:a,hash:e.hash,query:(0,i.omit)(r,u)}))}let a=e.origin===f.origin?e.href.slice(e.origin.length):e.href;return r?[a,t||a]:a}catch(e){return r?[d]:d}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},3106:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"useIntersection",{enumerable:!0,get:function(){return s}});let n=r(2265),o=r(9189),i="function"==typeof IntersectionObserver,a=new Map,u=[];function s(e){let{rootRef:t,rootMargin:r,disabled:s}=e,l=s||!i,[c,f]=(0,n.useState)(!1),d=(0,n.useRef)(null),p=(0,n.useCallback)(e=>{d.current=e},[]);return(0,n.useEffect)(()=>{if(i){if(l||c)return;let e=d.current;if(e&&e.tagName)return function(e,t,r){let{id:n,observer:o,elements:i}=function(e){let t;let r={root:e.root||null,margin:e.rootMargin||""},n=u.find(e=>e.root===r.root&&e.margin===r.margin);if(n&&(t=a.get(n)))return t;let o=new Map;return t={id:r,observer:new IntersectionObserver(e=>{e.forEach(e=>{let t=o.get(e.target),r=e.isIntersecting||e.intersectionRatio>0;t&&r&&t(r)})},e),elements:o},u.push(r),a.set(r,t),t}(r);return i.set(e,t),o.observe(e),function(){if(i.delete(e),o.unobserve(e),0===i.size){o.disconnect(),a.delete(n);let e=u.findIndex(e=>e.root===n.root&&e.margin===n.margin);e>-1&&u.splice(e,1)}}}(e,e=>e&&f(e),{root:null==t?void 0:t.current,rootMargin:r})}else if(!c){let e=(0,o.requestIdleCallback)(()=>f(!0));return()=>(0,o.cancelIdleCallback)(e)}},[l,r,t,c,d.current]),[p,c,(0,n.useCallback)(()=>{f(!1)},[])]}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},1943:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"escapeStringRegexp",{enumerable:!0,get:function(){return o}});let r=/[|\\{}()[\]^$+*?.-]/,n=/[|\\{}()[\]^$+*?.-]/g;function o(e){return r.test(e)?e.replace(n,"\\$&"):e}},291:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"RouterContext",{enumerable:!0,get:function(){return n}});let n=r(9920)._(r(2265)).default.createContext(null)},1142:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{formatUrl:function(){return i},formatWithValidation:function(){return u},urlObjectKeys:function(){return a}});let n=r(1452)._(r(8323)),o=/https?|ftp|gopher|file/;function i(e){let{auth:t,hostname:r}=e,i=e.protocol||"",a=e.pathname||"",u=e.hash||"",s=e.query||"",l=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?l=t+e.host:r&&(l=t+(~r.indexOf(":")?"["+r+"]":r),e.port&&(l+=":"+e.port)),s&&"object"==typeof s&&(s=String(n.urlQueryToSearchParams(s)));let c=e.search||s&&"?"+s||"";return i&&!i.endsWith(":")&&(i+=":"),e.slashes||(!i||o.test(i))&&!1!==l?(l="//"+(l||""),a&&"/"!==a[0]&&(a="/"+a)):l||(l=""),u&&"#"!==u[0]&&(u="#"+u),c&&"?"!==c[0]&&(c="?"+c),""+i+l+(a=a.replace(/[?#]/g,encodeURIComponent))+(c=c.replace("#","%23"))+u}let a=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function u(e){return i(e)}},9195:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{getSortedRoutes:function(){return n.getSortedRoutes},isDynamicRoute:function(){return o.isDynamicRoute}});let n=r(9089),o=r(8083)},20:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"interpolateAs",{enumerable:!0,get:function(){return i}});let n=r(1533),o=r(3169);function i(e,t,r){let i="",a=(0,o.getRouteRegex)(e),u=a.groups,s=(t!==e?(0,n.getRouteMatcher)(a)(t):"")||r;i=e;let l=Object.keys(u);return l.every(e=>{let t=s[e]||"",{repeat:r,optional:n}=u[e],o="["+(r?"...":"")+e+"]";return n&&(o=(t?"":"/")+"["+o+"]"),r&&!Array.isArray(t)&&(t=[t]),(n||e in s)&&(i=i.replace(o,r?t.map(e=>encodeURIComponent(e)).join("/"):encodeURIComponent(t))||"/")})||(i=""),{params:l,result:i}}},8083:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"isDynamicRoute",{enumerable:!0,get:function(){return i}});let n=r(2269),o=/\/\[[^/]+?\](?=\/|$)/;function i(e){return(0,n.isInterceptionRouteAppPath)(e)&&(e=(0,n.extractInterceptionRouteInformation)(e).interceptedRoute),o.test(e)}},8029:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"isLocalURL",{enumerable:!0,get:function(){return i}});let n=r(3461),o=r(9404);function i(e){if(!(0,n.isAbsoluteUrl)(e))return!0;try{let t=(0,n.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,o.hasBasePath)(r.pathname)}catch(e){return!1}}},5519:function(e,t){"use strict";function r(e,t){let r={};return Object.keys(e).forEach(n=>{t.includes(n)||(r[n]=e[n])}),r}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"omit",{enumerable:!0,get:function(){return r}})},8323:function(e,t){"use strict";function r(e){let t={};return e.forEach((e,r)=>{void 0===t[r]?t[r]=e:Array.isArray(t[r])?t[r].push(e):t[r]=[t[r],e]}),t}function n(e){return"string"!=typeof e&&("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function o(e){let t=new URLSearchParams;return Object.entries(e).forEach(e=>{let[r,o]=e;Array.isArray(o)?o.forEach(e=>t.append(r,n(e))):t.set(r,n(o))}),t}function i(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];return r.forEach(t=>{Array.from(t.keys()).forEach(t=>e.delete(t)),t.forEach((t,r)=>e.append(r,t))}),e}Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{assign:function(){return i},searchParamsToUrlQuery:function(){return r},urlQueryToSearchParams:function(){return o}})},1533:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"getRouteMatcher",{enumerable:!0,get:function(){return o}});let n=r(3461);function o(e){let{re:t,groups:r}=e;return e=>{let o=t.exec(e);if(!o)return!1;let i=e=>{try{return decodeURIComponent(e)}catch(e){throw new n.DecodeError("failed to decode param")}},a={};return Object.keys(r).forEach(e=>{let t=r[e],n=o[t.pos];void 0!==n&&(a[e]=~n.indexOf("/")?n.split("/").map(e=>i(e)):t.repeat?[i(n)]:i(n))}),a}}},3169:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{getNamedMiddlewareRegex:function(){return d},getNamedRouteRegex:function(){return f},getRouteRegex:function(){return s}});let n=r(2269),o=r(1943),i=r(7741);function a(e){let t=e.startsWith("[")&&e.endsWith("]");t&&(e=e.slice(1,-1));let r=e.startsWith("...");return r&&(e=e.slice(3)),{key:e,repeat:r,optional:t}}function u(e){let t=(0,i.removeTrailingSlash)(e).slice(1).split("/"),r={},u=1;return{parameterizedRoute:t.map(e=>{let t=n.INTERCEPTION_ROUTE_MARKERS.find(t=>e.startsWith(t)),i=e.match(/\[((?:\[.*\])|.+)\]/);if(t&&i){let{key:e,optional:n,repeat:s}=a(i[1]);return r[e]={pos:u++,repeat:s,optional:n},"/"+(0,o.escapeStringRegexp)(t)+"([^/]+?)"}if(!i)return"/"+(0,o.escapeStringRegexp)(e);{let{key:e,repeat:t,optional:n}=a(i[1]);return r[e]={pos:u++,repeat:t,optional:n},t?n?"(?:/(.+?))?":"/(.+?)":"/([^/]+?)"}}).join(""),groups:r}}function s(e){let{parameterizedRoute:t,groups:r}=u(e);return{re:RegExp("^"+t+"(?:/)?$"),groups:r}}function l(e){let{interceptionMarker:t,getSafeRouteKey:r,segment:n,routeKeys:i,keyPrefix:u}=e,{key:s,optional:l,repeat:c}=a(n),f=s.replace(/\W/g,"");u&&(f=""+u+f);let d=!1;(0===f.length||f.length>30)&&(d=!0),isNaN(parseInt(f.slice(0,1)))||(d=!0),d&&(f=r()),u?i[f]=""+u+s:i[f]=s;let p=t?(0,o.escapeStringRegexp)(t):"";return c?l?"(?:/"+p+"(?<"+f+">.+?))?":"/"+p+"(?<"+f+">.+?)":"/"+p+"(?<"+f+">[^/]+?)"}function c(e,t){let r;let a=(0,i.removeTrailingSlash)(e).slice(1).split("/"),u=(r=0,()=>{let e="",t=++r;for(;t>0;)e+=String.fromCharCode(97+(t-1)%26),t=Math.floor((t-1)/26);return e}),s={};return{namedParameterizedRoute:a.map(e=>{let r=n.INTERCEPTION_ROUTE_MARKERS.some(t=>e.startsWith(t)),i=e.match(/\[((?:\[.*\])|.+)\]/);if(r&&i){let[r]=e.split(i[0]);return l({getSafeRouteKey:u,interceptionMarker:r,segment:i[1],routeKeys:s,keyPrefix:t?"nxtI":void 0})}return i?l({getSafeRouteKey:u,segment:i[1],routeKeys:s,keyPrefix:t?"nxtP":void 0}):"/"+(0,o.escapeStringRegexp)(e)}).join(""),routeKeys:s}}function f(e,t){let r=c(e,t);return{...s(e),namedRegex:"^"+r.namedParameterizedRoute+"(?:/)?$",routeKeys:r.routeKeys}}function d(e,t){let{parameterizedRoute:r}=u(e),{catchAll:n=!0}=t;if("/"===r)return{namedRegex:"^/"+(n?".*":"")+"$"};let{namedParameterizedRoute:o}=c(e,!1);return{namedRegex:"^"+o+(n?"(?:(/.*)?)":"")+"$"}}},9089:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"getSortedRoutes",{enumerable:!0,get:function(){return n}});class r{insert(e){this._insert(e.split("/").filter(Boolean),[],!1)}smoosh(){return this._smoosh()}_smoosh(e){void 0===e&&(e="/");let t=[...this.children.keys()].sort();null!==this.slugName&&t.splice(t.indexOf("[]"),1),null!==this.restSlugName&&t.splice(t.indexOf("[...]"),1),null!==this.optionalRestSlugName&&t.splice(t.indexOf("[[...]]"),1);let r=t.map(t=>this.children.get(t)._smoosh(""+e+t+"/")).reduce((e,t)=>[...e,...t],[]);if(null!==this.slugName&&r.push(...this.children.get("[]")._smoosh(e+"["+this.slugName+"]/")),!this.placeholder){let t="/"===e?"/":e.slice(0,-1);if(null!=this.optionalRestSlugName)throw Error('You cannot define a route with the same specificity as a optional catch-all route ("'+t+'" and "'+t+"[[..."+this.optionalRestSlugName+']]").');r.unshift(t)}return null!==this.restSlugName&&r.push(...this.children.get("[...]")._smoosh(e+"[..."+this.restSlugName+"]/")),null!==this.optionalRestSlugName&&r.push(...this.children.get("[[...]]")._smoosh(e+"[[..."+this.optionalRestSlugName+"]]/")),r}_insert(e,t,n){if(0===e.length){this.placeholder=!1;return}if(n)throw Error("Catch-all must be the last part of the URL.");let o=e[0];if(o.startsWith("[")&&o.endsWith("]")){let r=o.slice(1,-1),a=!1;if(r.startsWith("[")&&r.endsWith("]")&&(r=r.slice(1,-1),a=!0),r.startsWith("...")&&(r=r.substring(3),n=!0),r.startsWith("[")||r.endsWith("]"))throw Error("Segment names may not start or end with extra brackets ('"+r+"').");if(r.startsWith("."))throw Error("Segment names may not start with erroneous periods ('"+r+"').");function i(e,r){if(null!==e&&e!==r)throw Error("You cannot use different slug names for the same dynamic path ('"+e+"' !== '"+r+"').");t.forEach(e=>{if(e===r)throw Error('You cannot have the same slug name "'+r+'" repeat within a single dynamic path');if(e.replace(/\W/g,"")===o.replace(/\W/g,""))throw Error('You cannot have the slug names "'+e+'" and "'+r+'" differ only by non-word symbols within a single dynamic path')}),t.push(r)}if(n){if(a){if(null!=this.restSlugName)throw Error('You cannot use both an required and optional catch-all route at the same level ("[...'+this.restSlugName+']" and "'+e[0]+'" ).');i(this.optionalRestSlugName,r),this.optionalRestSlugName=r,o="[[...]]"}else{if(null!=this.optionalRestSlugName)throw Error('You cannot use both an optional and required catch-all route at the same level ("[[...'+this.optionalRestSlugName+']]" and "'+e[0]+'").');i(this.restSlugName,r),this.restSlugName=r,o="[...]"}}else{if(a)throw Error('Optional route parameters are not yet supported ("'+e[0]+'").');i(this.slugName,r),this.slugName=r,o="[]"}}this.children.has(o)||this.children.set(o,new r),this.children.get(o)._insert(e.slice(1),t,n)}constructor(){this.placeholder=!0,this.children=new Map,this.slugName=null,this.restSlugName=null,this.optionalRestSlugName=null}}function n(e){let t=new r;return e.forEach(e=>t.insert(e)),t.smoosh()}},3461:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{DecodeError:function(){return h},MiddlewareNotFoundError:function(){return b},MissingStaticPage:function(){return y},NormalizeError:function(){return m},PageNotFoundError:function(){return g},SP:function(){return d},ST:function(){return p},WEB_VITALS:function(){return r},execOnce:function(){return n},getDisplayName:function(){return s},getLocationOrigin:function(){return a},getURL:function(){return u},isAbsoluteUrl:function(){return i},isResSent:function(){return l},loadGetInitialProps:function(){return f},normalizeRepeatedSlashes:function(){return c},stringifyError:function(){return v}});let r=["CLS","FCP","FID","INP","LCP","TTFB"];function n(e){let t,r=!1;return function(){for(var n=arguments.length,o=Array(n),i=0;i<n;i++)o[i]=arguments[i];return r||(r=!0,t=e(...o)),t}}let o=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,i=e=>o.test(e);function a(){let{protocol:e,hostname:t,port:r}=window.location;return e+"//"+t+(r?":"+r:"")}function u(){let{href:e}=window.location,t=a();return e.substring(t.length)}function s(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function l(e){return e.finished||e.headersSent}function c(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?"?"+t.slice(1).join("?"):"")}async function f(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await f(t.Component,t.ctx)}:{};let n=await e.getInitialProps(t);if(r&&l(r))return n;if(!n)throw Error('"'+s(e)+'.getInitialProps()" should resolve to an object. But found "'+n+'" instead.');return n}let d="undefined"!=typeof performance,p=d&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class h extends Error{}class m extends Error{}class g extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message="Cannot find module for page: "+e}}class y extends Error{constructor(e,t){super(),this.message="Failed to load static file for page: "+e+" "+t}}class b extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function v(e){return JSON.stringify({message:e.message,stack:e.stack})}},9949:function(e,t,r){"use strict";var n=r(8877);function o(){}function i(){}i.resetWarningCache=o,e.exports=function(){function e(e,t,r,o,i,a){if(a!==n){var u=Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw u.name="Invariant Violation",u}}function t(){return e}e.isRequired=e;var r={array:e,bigint:e,bool:e,func:e,number:e,object:e,string:e,symbol:e,any:e,arrayOf:t,element:e,elementType:e,instanceOf:t,node:e,objectOf:t,oneOf:t,oneOfType:t,shape:t,exact:t,checkPropTypes:i,resetWarningCache:o};return r.PropTypes=r,r}},1448:function(e,t,r){e.exports=r(9949)()},8877:function(e){"use strict";e.exports="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"},2916:function(e,t,r){"use strict";r.d(t,{ac:function(){return N}});var n=r(2265),o=r(8155),i=r.n(o),a=/[A-Z]/g,u=/^ms-/,s={};function l(e){return"-"+e.toLowerCase()}var c=function(e){if(s.hasOwnProperty(e))return s[e];var t=e.replace(a,l);return s[e]=u.test(t)?"-"+t:t},f=r(1448),d=r.n(f);let p=d().oneOfType([d().string,d().number]),h={all:d().bool,grid:d().bool,aural:d().bool,braille:d().bool,handheld:d().bool,print:d().bool,projection:d().bool,screen:d().bool,tty:d().bool,tv:d().bool,embossed:d().bool},{type:m,...g}={orientation:d().oneOf(["portrait","landscape"]),scan:d().oneOf(["progressive","interlace"]),aspectRatio:d().string,deviceAspectRatio:d().string,height:p,deviceHeight:p,width:p,deviceWidth:p,color:d().bool,colorIndex:d().bool,monochrome:d().bool,resolution:p,type:Object.keys(h)},y={minAspectRatio:d().string,maxAspectRatio:d().string,minDeviceAspectRatio:d().string,maxDeviceAspectRatio:d().string,minHeight:p,maxHeight:p,minDeviceHeight:p,maxDeviceHeight:p,minWidth:p,maxWidth:p,minDeviceWidth:p,maxDeviceWidth:p,minColor:d().number,maxColor:d().number,minColorIndex:d().number,maxColorIndex:d().number,minMonochrome:d().number,maxMonochrome:d().number,minResolution:p,maxResolution:p,...g};var b={...h,...y};let v=e=>`not ${e}`,O=(e,t)=>{let r=c(e);return("number"==typeof t&&(t=`${t}px`),!0===t)?r:!1===t?v(r):`(${r}: ${t})`},_=e=>e.join(" and "),R=e=>{let t=[];return Object.keys(b).forEach(r=>{let n=e[r];null!=n&&t.push(O(r,n))}),_(t)},P=(0,n.createContext)(void 0),x=e=>e.query||R(e),j=e=>{if(e)return Object.keys(e).reduce((t,r)=>(t[c(r)]=e[r],t),{})},w=()=>{let e=(0,n.useRef)(!1);return(0,n.useEffect)(()=>{e.current=!0},[]),e.current},E=e=>{let t=(0,n.useContext)(P),r=()=>j(e)||j(t),[o,i]=(0,n.useState)(r);return(0,n.useEffect)(()=>{let e=r();!function(e,t){if(e===t)return!0;if(!e||!t)return!1;let r=Object.keys(e),n=Object.keys(t),o=r.length;if(n.length!==o)return!1;for(let n=0;n<o;n++){let o=r[n];if(e[o]!==t[o]||!Object.prototype.hasOwnProperty.call(t,o))return!1}return!0}(o,e)&&i(e)},[e,t]),o},S=e=>{let t=()=>x(e),[r,o]=(0,n.useState)(t);return(0,n.useEffect)(()=>{let e=t();r!==e&&o(e)},[e]),r},C=(e,t)=>{let r=()=>i()(e,t||{},!!t),[o,a]=(0,n.useState)(r),u=w();return(0,n.useEffect)(()=>{if(u){let e=r();return a(e),()=>{e&&e.dispose()}}},[e,t]),o},M=e=>{let[t,r]=(0,n.useState)(e.matches);return(0,n.useEffect)(()=>{let t=e=>{r(e.matches)};return e.addListener(t),r(e.matches),()=>{e.removeListener(t)}},[e]),t},N=(e,t,r)=>{let o=E(t),i=S(e);if(!i)throw Error("Invalid or missing MediaQuery!");let a=C(i,o),u=M(a),s=w();return(0,n.useEffect)(()=>{s&&r&&r(u)},[u]),(0,n.useEffect)(()=>()=>{a&&a.dispose()},[]),u}}}]);