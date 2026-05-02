# SkyFutureの自用脚本

[![GitHub license](https://img.shields.io/github/license/SkyFutu/UserScript.svg?style=flat-square&color=4285dd&logo=github)](https://github.com/SkyFutu/UserScript/)
[![GitHub Star](https://img.shields.io/github/stars/SkyFutu/UserScript.svg?style=flat-square&label=Star&color=4285dd&logo=github)](https://github.com/SkyFutu/UserScript/)

🔨 自用的一些乱七八糟油猴脚本，**有什么需求、建议、问题直接提 [Issues](https://github.com/SkyFutu/UserScript/issues/new/choose)**，觉得**好用请点个⭐鼓励一下叭~**   

## 脚本列表

|  | 脚本名称 | 脚本功能 | 安装 |
| :----: | :---- | :---- | :----: |
| [<img src="https://static.hdslb.com/images/favicon.ico" height="16px" />](https://github.com/SkyFutu) | **Bilibili PCDN Blocker** | 屏蔽B站 **PCDN** 并直连**官方 CDN** 加载| **[安装](https://fastly.jsdelivr.net/gh/SkyFutu/UserScript@build/bilibili-pcdn-blocker.user.js)** |

> [!TIP]
> _持续更新中..._

****

## 如何安装/使用脚本？

要使用任何脚本，首先需要浏览器安装 **Tampermonkey  脚本管理器扩展（[Chrome](https://pan.lanpw.com/b073l8d1e)** / **[Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)** / **[Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-CN)）。**  

- 点击上方表格中的 **[安装]**，浏览器会自动弹出 Tampermonkey 的安装界面，点击 **安装** 即可。

> [!IMPORTANT]
> - _其他基于 **Chromium** 内核的浏览器（如国内套皮浏览器）一般都可以使用 Chrome 扩展。_  
> - _请确保使用 **Tampermonkey 正式版** 扩展，其他的用户脚本管理器可能导致**无法正常使用**脚本。_  
> - _如果要重装脚本，请记得在 Tampermonkey 扩展的**回收站中彻底删除**脚本后再去重新安装脚本。_  

> _**不会离线安装 .crx 扩展？[Chrome、Edge 重新开启隐藏的 [拖入安装 .crx 扩展] 功能！](https://zhuanlan.zhihu.com/p/276027099)**_  

****

## Tampermonkey `v5.0.0` 后脚本在 `部分网站` 无法正常运行？

Tampermonkey 为了顺应 Chrome 的 Manifest V3 要求，在 v5.0.0 版本中修改了 CSP 相关选项的默认值。

你只需要去 Tampermonkey 设置中，先把最顶端的第一个选项 `配置模式:` 默认的 `新手` 改为 `高级`。  
然后翻到下面的 `安全` 选项区域，找到 `修改内容安全策略（CSP）头信息:` 把默认的 `自动` 改为 **`是` 或 `全部移除`** 并点击下面一点的 `保存` 按钮即可解决。

****

## Tampermonkey `v5.2.0` 后脚本无法正常运行？

因为其 v5.2.0 版本转为了 Manifest V3，所以需要在浏览器的**扩展管理**界面**启用 `开发者模式`** 才能正常运行脚本！

****

## 💖 鸣谢
- **README** 模板由 [XIU2/UserScript](https://github.com/XIU2/UserScript) 提供
- **Bilibili PCDN Blocker** 重构于 [AkagiYui/UserScript](https://github.com/AkagiYui/UserScript) **【哔哩哔哩】屏蔽视频PCDN地址**

****

## License

[MIT License](./LICENSE)