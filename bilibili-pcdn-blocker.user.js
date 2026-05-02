// ==UserScript==
// @name         Bilibili PCDN Blocker
// @namespace    https://github.com/SkyFutu/UserScript
// @version      1.0.0
// @author       Sky
// @description  屏蔽B站PCDN并直连官方CDN加载
// @license      MIT
// @icon         https://static.hdslb.com/images/favicon.ico
// @homepage     https://github.com/SkyFutu/UserScript
// @supportURL   https://github.com/SkyFutu/UserScript/issues
// @downloadURL  https://fastly.jsdelivr.net.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js
// @updateURL    https://fastly.jsdelivr.net.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://live.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_info = (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_registerMenuCommand = (() => typeof GM_registerMenuCommand != "undefined" ? GM_registerMenuCommand : void 0)();
  var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_unregisterMenuCommand = (() => typeof GM_unregisterMenuCommand != "undefined" ? GM_unregisterMenuCommand : void 0)();
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  const Configs = {
    blockBCacheCDN: { title: "屏蔽视频地区 CDN", default: false },
    blockLivePCDN: { title: "屏蔽直播 PCDN", default: true }
  };
  const menuIds = [];
  function getConfig(key) {
    return _GM_getValue(key, Configs[key].default);
  }
  function registerMenus() {
    menuIds.forEach((id) => _GM_unregisterMenuCommand(id));
    menuIds.length = 0;
    for (const [key, config] of Object.entries(Configs)) {
      const currentVal = getConfig(key);
      const title = `${currentVal ? "✅" : "❌"} ${config.title}`;
      const id = _GM_registerMenuCommand(title, () => {
        _GM_setValue(key, !currentVal);
        registerMenus();
      });
      menuIds.push(id);
    }
  }
  const getBadgeStyles = (level) => {
    let mainBg = "#00A1D6";
    let subBg = "#FB7299";
    if (level === "warn") {
      mainBg = "#F5A623";
      subBg = "#E08E00";
    } else if (level === "error") {
      mainBg = "#F04C49";
      subBg = "#D03430";
    }
    const baseStyle = "color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;";
    const mainStyle = `background: ${mainBg}; ${baseStyle}`;
    const subStyle = `background: ${subBg}; ${baseStyle}`;
    return { mainStyle, subStyle };
  };
  const createLogger = (subTag) => {
    const mainTag = " Bilibili PCDN Blocker ";
    return {
      log: (...args) => {
        const { mainStyle, subStyle } = getBadgeStyles("info");
        subTag ? console.log(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.log(`%c${mainTag}`, mainStyle, ...args);
      },
      debug: (...args) => {
        const { mainStyle, subStyle } = getBadgeStyles("info");
        subTag ? console.debug(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.debug(`%c${mainTag}`, mainStyle, ...args);
      },
      warn: (...args) => {
        const { mainStyle, subStyle } = getBadgeStyles("warn");
        subTag ? console.warn(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.warn(`%c${mainTag}`, mainStyle, ...args);
      },
      error: (...args) => {
        const { mainStyle, subStyle } = getBadgeStyles("error");
        subTag ? console.error(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.error(`%c${mainTag}`, mainStyle, ...args);
      },
      withtag: (tag) => createLogger(tag)
    };
  };
  const printStartupBadge = () => {
    const mainStyle = "color: white; background: #00A1D6; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;";
    const versionStyle = "color: white; background: #6b7a8c; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;";
    console.log(`%c Bilibili PCDN Blocker %c v${_GM_info.script.version} `, mainStyle, versionStyle);
  };
  const logger$2 = createLogger("Video");
  const PCDN_PATTERN = /(mcdn\.bilivideo\.(com|cn)|edge\.mountaintoys\.cn)/;
  const BCACHE_PATTERN = /(cn-.*\.bilivideo\.(com|cn))/;
  function filterUrls(urls) {
    let restUrls = urls.filter((url) => !PCDN_PATTERN.test(url));
    if (getConfig("blockBCacheCDN")) {
      restUrls = restUrls.filter((url) => !BCACHE_PATTERN.test(url));
    }
    return { baseUrl: restUrls[0], backupUrls: restUrls.slice(1) };
  }
  function cleanVideoPlayInfo(data) {
    if (!data) return;
    logger$2.debug("视频列表 fetch 处理前", JSON.parse(JSON.stringify(data)));
    let count = 0;
    const videoHosts = new Set();
    const audioHosts = new Set();
    const extractHost = (urlStr) => {
      try {
        return new URL(urlStr).host;
      } catch {
        return urlStr;
      }
    };
    const cleanMedia = (media, targetBasket) => {
      if (!media) return;
      const allUrls = [media.baseUrl || media.base_url, ...media.backupUrl || media.backup_url || []].filter(Boolean);
      if (allUrls.length === 0) return;
      const { baseUrl, backupUrls } = filterUrls(allUrls);
      media.baseUrl = media.base_url = baseUrl;
      media.backupUrl = media.backup_url = backupUrls;
      if (baseUrl) {
        targetBasket.add(extractHost(baseUrl));
        if (backupUrls.length > 0) {
          backupUrls.forEach((url) => targetBasket.add(extractHost(url)));
        }
        count++;
      }
    };
    const dash = data.dash || data.video_info?.dash;
    if (dash) {
      dash.video?.forEach((m) => cleanMedia(m, videoHosts));
      dash.audio?.forEach((m) => cleanMedia(m, audioHosts));
      dash.dolby?.audio?.forEach((m) => cleanMedia(m, audioHosts));
      if (dash.flac?.audio) cleanMedia(dash.flac.audio, audioHosts);
    }
    const durlGroup = data.durl || data.video_info?.durl || data.video_info?.durls;
    if (Array.isArray(durlGroup)) {
      durlGroup.forEach((item) => {
        if (item.durl) item.durl.forEach((m) => cleanMedia(m, videoHosts));
        else cleanMedia(item, videoHosts);
      });
    }
    if (count > 0) {
      logger$2.log(`${count} 条音视频轨道并使用以下节点分发`, {
        Audio: [...audioHosts],
        Video: [...videoHosts]
      });
    }
  }
  const logger$1 = createLogger("Live");
  const LIVE_PCDN_PATTERN = /(mcdn\.bilivideo\.(com|cn))/;
  function cleanLivePlayInfo(playurlInfo) {
    if (!playurlInfo || !getConfig("blockLivePCDN")) return;
    logger$1.debug("直播列表 fetch 处理前", JSON.parse(JSON.stringify(playurlInfo)));
    let count = 0;
    const collectedHosts = new Set();
    if (playurlInfo.p2p_data) {
      playurlInfo.p2p_data.p2p = false;
      playurlInfo.p2p_data.p2p_type = 0;
    }
    playurlInfo.stream?.forEach((stream) => {
      stream.format?.forEach((format) => {
        format.codec?.forEach((codec) => {
          if (codec.url_info) {
            codec.url_info = codec.url_info.filter((info) => !LIVE_PCDN_PATTERN.test(info.host));
            if (codec.url_info.length > 0) {
              codec.url_info.forEach((info) => collectedHosts.add(info.host));
              count++;
            }
          }
        });
      });
    });
    if (count > 0) {
      logger$1.log(`${count} 条直播流并使用以下节点分发`, [...collectedHosts]);
    }
  }
  const logger = createLogger();
  const win = _unsafeWindow;
  if (win.self === win.top) {
    printStartupBadge();
  }
  registerMenus();
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
  const origOpen = win.XMLHttpRequest.prototype.open;
  win.XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === "string") {
      if (url.includes("api.bilibili.com/x/player/wbi/playurl") || url.includes("api.bilibili.com/pgc/player/web/v2/playurl")) {
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
                logger.withtag("Video").error("解析视频 XHR 响应失败", e);
                return res;
              }
            }
          });
        }
      } else if (url.includes("api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")) {
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
                logger.withtag("Live").error("解析直播 XHR 响应失败", e);
                return res;
              }
            }
          });
        }
      }
    }
    return origOpen.call(this, method, url, ...args);
  };
  const origFetch = win.fetch;
  win.fetch = async function(...args) {
    const url = args[0];
    const response = await origFetch.apply(this, args);
    if (typeof url === "string" && url.includes("api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")) {
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
        logger.withtag("Live").error("解析直播 Fetch 响应失败", e);
        return response;
      }
    }
    return response;
  };

})();