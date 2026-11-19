// ==UserScript==
// @name         Bilibili PCDN Blocker
// @namespace    https://github.com/SkyFutu/UserScript
// @version      2.0.0
// @author       Sky
// @description  屏蔽B站PCDN并直连官方CDN加载
// @license      MIT
// @icon         https://static.hdslb.com/images/favicon.ico
// @homepage     https://github.com/SkyFutu/UserScript
// @supportURL   https://github.com/SkyFutu/UserScript/issues
// @downloadURL  https://fastly.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js
// @updateURL    https://fastly.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/blackboard/live/live-activity-player.html*
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
    blockBCacheCDN: { title: "屏蔽地区自建CDN", default: false },
    blockLivePCDN: { title: "屏蔽直播PCDN", default: true },
    fallbackIfAllPCDN: { title: "至少保留一条链接", default: true }
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
        location.reload();
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
      }
    };
  };
  const printStartupBadge = () => {
    const mainStyle = "color: white; background: #00A1D6; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;";
    const versionStyle = "color: white; background: #6b7a8c; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;";
    console.log(`%c Bilibili PCDN Blocker %c v${_GM_info.script.version} `, mainStyle, versionStyle);
  };
  const PCDN_PATTERN = /(?:mcdn\.bilivideo\.(?:cn|com)|mountaintoys\.cn)/i;
  const BCACHE_PATTERN = /cn-.*\.bilivideo\.(?:com|cn)/;
  const logger$1 = createLogger("Video");
  function filterCandidateUrls(allUrls) {
    let cleanUrls = allUrls.filter((url) => !PCDN_PATTERN.test(url));
    if (getConfig("blockBCacheCDN")) {
      const withoutBcache = cleanUrls.filter((url) => !BCACHE_PATTERN.test(url));
      if (withoutBcache.length > 0) cleanUrls = withoutBcache;
    }
    let primary = cleanUrls[0];
    const backups = cleanUrls.slice(1);
    if (!primary && getConfig("fallbackIfAllPCDN")) {
      primary = allUrls[0];
    }
    return { primary: primary ?? "", backups };
  }
  function cleanMediaItem(media, type, formatMap, cleanedTracks) {
    const primary = media.baseUrl ?? media.base_url;
    const backups = media.backupUrl ?? media.backup_url ?? [];
    const allUrls = primary ? [primary, ...backups] : backups;
    if (allUrls.length === 0) return;
    const { primary: chosenUrl, backups: cleanBackups } = filterCandidateUrls(allUrls);
    media.baseUrl = media.base_url = chosenUrl;
    media.backupUrl = media.backup_url = cleanBackups;
    const spec = type === "video" ? formatMap.get(media.id) ?? `${media.id}P` : media.bandwidth ? `${Math.round(media.bandwidth / 1e3)} kbps` : String(media.id);
    const codec = media.codecs?.split(".")[0] ?? String(media.codecid ?? "-");
    cleanedTracks.push({
      type,
      quality: spec,
      codec,
      cdn: chosenUrl ? new URL(chosenUrl).host : ""
    });
  }
  function getPlayUrlBody(data) {
    return data?.result?.video_info ?? data?.data ?? data;
  }
  function cleanVideoPlayInfo(raw) {
    const body = getPlayUrlBody(raw);
    if (!body) return;
    const cleanedTracks = [];
    const dash = body.dash;
    if (dash) {
      const formatMap = new Map(
        (body.support_formats ?? []).map((f) => [f.quality, f.new_description])
      );
      dash.video?.forEach((v) => cleanMediaItem(v, "video", formatMap, cleanedTracks));
      dash.audio?.forEach((a) => cleanMediaItem(a, "audio", formatMap, cleanedTracks));
      if (dash.dolby?.audio) {
        const dolbys = Array.isArray(dash.dolby.audio) ? dash.dolby.audio : [dash.dolby.audio];
        dolbys.forEach((d) => cleanMediaItem(d, "audio", formatMap, cleanedTracks));
      }
      if (dash.flac?.audio) {
        cleanMediaItem(dash.flac.audio, "audio", formatMap, cleanedTracks);
      }
    }
    if (Array.isArray(body.durl)) {
      body.durl.forEach((seg) => {
        const allUrls = seg.url ? [seg.url, ...seg.backup_url ?? []] : seg.backup_url ?? [];
        if (allUrls.length === 0) return;
        const { primary, backups } = filterCandidateUrls(allUrls);
        seg.url = primary;
        seg.backup_url = backups;
      });
    }
    if (cleanedTracks.length > 0) {
      logger$1.debug(`处理音视频轨 (${cleanedTracks.length})`, cleanedTracks);
    }
  }
  const logger = createLogger("Live");
  function getLivePlayUrl(raw) {
    return raw?.roomInitRes?.data?.playurl_info?.playurl ?? raw?.data?.playurl_info?.playurl;
  }
  function cleanLivePlayInfo(raw) {
    if (!getConfig("blockLivePCDN")) return;
    const playurl = getLivePlayUrl(raw);
    if (!playurl?.stream) return;
    if (playurl.p2p_data) {
      playurl.p2p_data.p2p = false;
      playurl.p2p_data.p2p_type = -1;
    }
    const qnMap = new Map(
      (playurl.g_qn_desc ?? []).map((item) => [item.qn, item.desc])
    );
    const streams = [];
    playurl.stream.forEach((stream) => {
      stream.format?.forEach((format) => {
        if (format.master_url) {
          format.master_url = format.master_url.replace(/([?&]p2p_type=)\d+/, "$1-1");
        }
        format.codec?.forEach((codec) => {
          codec.url_info?.forEach((info) => {
            info.extra = info.extra.replace(/([?&]p2p_type=)\d+/, "$1-1");
          });
          streams.push({
            protocol: stream.protocol_name,
            format: format.format_name,
            codec: codec.codec_name,
            quality: qnMap.get(codec.current_qn) ?? `${codec.current_qn}P`,
            cdn: codec.url_info?.[0]?.host ?? ""
          });
        });
      });
    });
    if (streams.length > 0) {
      logger.debug(`处理直播流 (${streams.length})`, streams);
    }
  }
  const win = _unsafeWindow;
  if (win.self === win.top) {
    printStartupBadge();
  }
  registerMenus();
  let _playinfo = win.__playinfo__;
  if (_playinfo) cleanVideoPlayInfo(_playinfo);
  Object.defineProperty(win, "__playinfo__", {
    get: () => _playinfo,
    set: (val) => {
      cleanVideoPlayInfo(val);
      _playinfo = val;
    }
  });
  let _neptune = win.__NEPTUNE_IS_MY_WAIFU__;
  if (_neptune) cleanLivePlayInfo(_neptune);
  Object.defineProperty(win, "__NEPTUNE_IS_MY_WAIFU__", {
    get: () => _neptune,
    set: (val) => {
      cleanLivePlayInfo(val);
      _neptune = val;
    }
  });
  function cleanJsonString(str, cleanFn) {
    try {
      const json = JSON.parse(str);
      cleanFn(json);
      return JSON.stringify(json);
    } catch {
      return str;
    }
  }
  const responseGetter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, "response")?.get;
  const textGetter = Object.getOwnPropertyDescriptor(win.XMLHttpRequest.prototype, "responseText")?.get;
  function hookXhr(xhr, cleanFn) {
    if (responseGetter) {
      Object.defineProperty(xhr, "response", {
        get: () => {
          const res = responseGetter.call(xhr);
          if (xhr.responseType === "json" && res && typeof res === "object") {
            cleanFn(res);
            return res;
          }
          return typeof res === "string" ? cleanJsonString(res, cleanFn) : res;
        }
      });
    }
    if (textGetter) {
      Object.defineProperty(xhr, "responseText", {
        get: () => {
          if (xhr.responseType && xhr.responseType !== "text") {
            return textGetter.call(xhr);
          }
          return cleanJsonString(textGetter.call(xhr), cleanFn);
        }
      });
    }
  }
  const origOpen = win.XMLHttpRequest.prototype.open;
  win.XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const urlStr = String(url);
    if (urlStr.includes("/playurl")) {
      hookXhr(this, cleanVideoPlayInfo);
    } else if (urlStr.includes("/getRoomPlayInfo")) {
      hookXhr(this, cleanLivePlayInfo);
    }
    return origOpen.call(this, method, url, ...args);
  };
  const origFetch = win.fetch;
  win.fetch = async function(...args) {
    const rawUrl = args[0];
    const urlStr = String(rawUrl instanceof Request ? rawUrl.url : rawUrl);
    const response = await origFetch.apply(this, args);
    const isVideo = urlStr.includes("/playurl");
    const isLive = urlStr.includes("/getRoomPlayInfo");
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

})();