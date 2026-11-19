import { unsafeWindow } from '$';
import { registerMenus } from './utils/menu';
import { cleanVideoPlayInfo } from './core/video';
import { cleanLivePlayInfo } from './core/live';
import { printStartupBadge } from './utils/logger';

const win = unsafeWindow as any;

if (win.self === win.top) {
    printStartupBadge();
}
registerMenus();

// Hook: __playinfo__
let _playinfo = win.__playinfo__;
if (_playinfo) cleanVideoPlayInfo(_playinfo);
Object.defineProperty(win, '__playinfo__', {
    get: () => _playinfo,
    set: (val) => {
        cleanVideoPlayInfo(val);
        _playinfo = val;
    }
});

// Hook: __NEPTUNE_IS_MY_WAIFU__
let _neptune = win.__NEPTUNE_IS_MY_WAIFU__;
if (_neptune) cleanLivePlayInfo(_neptune);
Object.defineProperty(win, '__NEPTUNE_IS_MY_WAIFU__', {
    get: () => _neptune,
    set: (val) => {
        cleanLivePlayInfo(val);
        _neptune = val;
    }
});

function cleanJsonString(str: string, cleanFn: (data: any) => void): string {
    try {
        const json = JSON.parse(str);
        cleanFn(json);
        return JSON.stringify(json);
    } catch {
        return str;
    }
}

// Hook: XHR
const responseGetter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, 'response')?.get;
const textGetter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, 'responseText')?.get;

function hookXhr(xhr: XMLHttpRequest, cleanFn: (data: any) => void) {
    if (responseGetter) {
        Object.defineProperty(xhr, 'response', {
            get: () => {
                const res = responseGetter.call(xhr);
                if (xhr.responseType === 'json' && res && typeof res === 'object') {
                    cleanFn(res);
                    return res;
                }
                return typeof res === 'string' ? cleanJsonString(res, cleanFn) : res;
            }
        });
    }

    if (textGetter) {
        Object.defineProperty(xhr, 'responseText', {
            get: () => {
                if (xhr.responseType && xhr.responseType !== 'text') {
                    return textGetter.call(xhr);
                }
                return cleanJsonString(textGetter.call(xhr), cleanFn);
            }
        });
    }
}

const origOpen = win.XMLHttpRequest.prototype.open;
win.XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    const urlStr = String(url);
    if (urlStr.includes('/playurl')) {
        hookXhr(this, cleanVideoPlayInfo);
    } else if (urlStr.includes('/getRoomPlayInfo')) {
        hookXhr(this, cleanLivePlayInfo);
    }
    return origOpen.call(this, method, url, ...args);
};

// Hook: Fetch
const origFetch = win.fetch;
win.fetch = async function(...args: any[]) {
    const rawUrl = args[0];
    const urlStr = String(rawUrl instanceof Request ? rawUrl.url : rawUrl);
    const response = await origFetch.apply(this, args);

    const isVideo = urlStr.includes('/playurl');
    const isLive = urlStr.includes('/getRoomPlayInfo');

    if (isVideo || isLive) {
        const clonedRes = response.clone();
        try {
            const json = await clonedRes.json();
            (isVideo ? cleanVideoPlayInfo : cleanLivePlayInfo)(json);
            return new Response(JSON.stringify(json), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch {
            return response;
        }
    }

    return response;
};
