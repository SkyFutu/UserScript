import { unsafeWindow } from '$';
import { registerMenus } from './utils/menu';
import { cleanVideoPlayInfo } from './core/video';
import { cleanLivePlayInfo } from './core/live';
import { printStartupBadge, createLogger } from './utils/logger';

const logger = createLogger();
const win = unsafeWindow as any;

if (win.self === win.top) {
    printStartupBadge(); 
}
registerMenus();

// 1. 拦截页面初始化的全局变量
let _playinfo = win.__playinfo__;
if (_playinfo) {
    cleanVideoPlayInfo(_playinfo?.data || _playinfo?.result);
}

Object.defineProperty(win, "__playinfo__", {
    get: () => _playinfo,
    set: (val) => {
        cleanVideoPlayInfo(val?.data || val?.result);
        _playinfo = val;
    }
});

let _neptune = win.__NEPTUNE_IS_MY_WAIFU__;
if (_neptune) {
    cleanLivePlayInfo(_neptune?.roomInitRes?.data?.playurl_info?.playurl);
}
Object.defineProperty(win, "__NEPTUNE_IS_MY_WAIFU__", {
    get: () => _neptune,
    set: (val) => {
        cleanLivePlayInfo(val?.roomInitRes?.data?.playurl_info?.playurl);
        _neptune = val;
    }
});

// 定义需要拦截的视频接口
const isVideoApi = (url: string) => 
    url.includes("api.bilibili.com/x/player/wbi/playurl") || 
    url.includes("api.bilibili.com/pgc/player/web/v2/playurl") ||
    url.includes("api.bilibili.com/x/player/wbi/v2"); // v2 接口

const isLiveApi = (url: string) => 
    url.includes("api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo");

// 2. 拦截 XHR 请求
const origOpen = win.XMLHttpRequest.prototype.open;
win.XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
    if (typeof url === 'string') {
        if (isVideoApi(url)) {
            const getter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, "responseText")?.get;
            if (getter) {
                Object.defineProperty(this, "responseText", {
                    get: () => {
                        const res = getter.call(this);
                        try {
                            const json = JSON.parse(res);
                            cleanVideoPlayInfo(json.data || json.result);
                            return JSON.stringify(json);
                        } catch (e) {
                            logger.withtag('Video').error("解析视频 XHR 响应失败", e);
                            return res; 
                        }
                    }
                });
            }
        } else if (isLiveApi(url)) {
             const getter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, "responseText")?.get;
             if (getter) {
                 Object.defineProperty(this, "responseText", {
                     get: () => {
                         const res = getter.call(this);
                         try {
                             const json = JSON.parse(res);
                             cleanLivePlayInfo(json?.data?.playurl_info?.playurl);
                             return JSON.stringify(json);
                         } catch (e) {
                             logger.withtag('Live').error("解析直播 XHR 响应失败", e);
                             return res;
                         }
                     }
                 });
             }
        }
    }
    return origOpen.call(this, method, url, ...args);
};

// 3. 拦截 Fetch 请求
const origFetch = win.fetch;
win.fetch = async function(...args: any[]) {
    const url = args[0];
    const response = await origFetch.apply(this, args);
    
    if (typeof url === 'string') {
        // 拦截视频 Fetch 请求
        if (isVideoApi(url)) {
            const clonedRes = response.clone();
            try {
                const json = await clonedRes.json();
                cleanVideoPlayInfo(json?.data || json?.result);
                return new Response(JSON.stringify(json), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            } catch (e) {
                logger.withtag('Video').error("解析视频 Fetch 响应失败", e);
                return response;
            }
        } else if (isLiveApi(url)) {
            const clonedRes = response.clone();
            try {
                const json = await clonedRes.json();
                cleanLivePlayInfo(json?.data?.playurl_info?.playurl);
                return new Response(JSON.stringify(json), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            } catch (e) {
                logger.withtag('Live').error("解析直播 Fetch 响应失败", e);
                return response;
            }
        }
    }
    return response;
};