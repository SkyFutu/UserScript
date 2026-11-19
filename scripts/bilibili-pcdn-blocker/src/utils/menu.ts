import { GM_getValue, GM_setValue, GM_registerMenuCommand, GM_unregisterMenuCommand } from '$';

export const Configs = {
    blockBCacheCDN:    { title: '屏蔽地区自建CDN', default: false },
    blockLivePCDN:     { title: '屏蔽直播PCDN', default: true },
    fallbackIfAllPCDN: { title: '至少保留一条链接', default: true },
};

const menuIds: (number | string)[] = [];

export function getConfig(key: keyof typeof Configs): boolean {
    return GM_getValue(key, Configs[key].default);
}

export function registerMenus() {
    menuIds.forEach(id => GM_unregisterMenuCommand(id));
    menuIds.length = 0;
    
    for (const [key, config] of Object.entries(Configs)) {
        const currentVal = getConfig(key as keyof typeof Configs);
        const title = `${currentVal ? '✅' : '❌'} ${config.title}`;
        
        const id = GM_registerMenuCommand(title, () => {
            GM_setValue(key, !currentVal);
            registerMenus();
            location.reload();
        });
        menuIds.push(id);
    }
}
