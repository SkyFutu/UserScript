import { createMonkeyConfig } from '../../vite.base.config';

export default createMonkeyConfig({
  name: 'Bilibili PCDN Blocker',
  version: '2.0.0',
  description: '屏蔽B站PCDN并直连官方CDN加载',
  icon: 'https://static.hdslb.com/images/favicon.ico',
  match: [
    'https://www.bilibili.com/video/*',
    'https://www.bilibili.com/list/*',
    'https://www.bilibili.com/bangumi/play/*',
    'https://www.bilibili.com/blackboard/live/live-activity-player.html*',
    'https://live.bilibili.com/*',
  ],
  grant: [
    'unsafeWindow',
    'GM_registerMenuCommand',
    'GM_unregisterMenuCommand',
    'GM_getValue',
    'GM_setValue',
  ],
  downloadURL: 'https://fastly.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js',
  updateURL: 'https://fastly.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js',
});
