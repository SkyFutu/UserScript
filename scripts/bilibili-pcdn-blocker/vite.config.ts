import { createMonkeyConfig } from '../../vite.base.config';

// 现在只需传一个对象，name 也写在这里面
export default createMonkeyConfig({
  name: 'Bilibili PCDN Blocker', 
  version: '1.0.1',
  description: '屏蔽B站PCDN并直连官方CDN加载',
  icon: 'https://static.hdslb.com/images/favicon.ico',
  match: [
    'https://www.bilibili.com/video/*',
    'https://www.bilibili.com/list/*',
    'https://www.bilibili.com/bangumi/play/*',
    'https://live.bilibili.com/*',
  ],
  grant: [
    'unsafeWindow',
    'GM_registerMenuCommand',
    'GM_getValue',
    'GM_setValue'
  ],
  downloadURL: 'https://fastly.jsdelivr.net.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js',
  updateURL: 'https://fastly.jsdelivr.net.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js',
});