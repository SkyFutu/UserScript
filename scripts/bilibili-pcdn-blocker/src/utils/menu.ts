import { GM_getValue, GM_setValue, GM_registerMenuCommand, GM_unregisterMenuCommand } from '$';

export const Configs = {
    blockBCacheCDN: { title: "屏蔽视频地区 CDN", default: false },
    blockLivePCDN:  { title: "屏蔽直播 PCDN", default: true },
};

const menuIds: any[] = [];

export function getConfig(key: keyof typeof Configs): boolean {
    return GM_getValue(key, Configs[key].default);
}

export function registerMenus() {
    menuIds.forEach(id => GM_unregisterMenuCommand(id));
    menuIds.length = 0;
    
    for (const [key, config] of Object.entries(Configs)) {
        const currentVal = getConfig(key as keyof typeof Configs);
        const title = `${currentVal ? "✅" : "❌"} ${config.title}`;
        
        const id = GM_registerMenuCommand(title, () => {
            GM_setValue(key, !currentVal);
            registerMenus();
        });
        menuIds.push(id);
    }
}