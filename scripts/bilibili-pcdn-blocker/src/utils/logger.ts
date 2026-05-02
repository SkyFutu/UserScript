import { GM_info } from '$';

const getBadgeStyles = (level: 'info' | 'warn' | 'error') => {
    let mainBg = '#00A1D6'; 
    let subBg = '#FB7299';  

    if (level === 'warn') {
        mainBg = '#F5A623'; 
        subBg = '#E08E00';
    } else if (level === 'error') {
        mainBg = '#F04C49'; 
        subBg = '#D03430';
    }

    const baseStyle = 'color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;';
    
    const mainStyle = `background: ${mainBg}; ${baseStyle}`;
    const subStyle = `background: ${subBg}; ${baseStyle}`;
    
    return { mainStyle, subStyle };
};

export const createLogger = (subTag?: string) => {
    const mainTag = ' Bilibili PCDN Blocker ';
    
    return {
        log: (...args: any[]) => {
            const { mainStyle, subStyle } = getBadgeStyles('info');
            subTag ? console.log(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.log(`%c${mainTag}`, mainStyle, ...args);
        },
        debug: (...args: any[]) => {
            const { mainStyle, subStyle } = getBadgeStyles('info');
            subTag ? console.debug(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.debug(`%c${mainTag}`, mainStyle, ...args);
        },
        warn: (...args: any[]) => {
            const { mainStyle, subStyle } = getBadgeStyles('warn');
            subTag ? console.warn(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.warn(`%c${mainTag}`, mainStyle, ...args);
        },
        error: (...args: any[]) => {
            const { mainStyle, subStyle } = getBadgeStyles('error');
            subTag ? console.error(`%c${mainTag}%c ${subTag} `, mainStyle, subStyle, ...args) : console.error(`%c${mainTag}`, mainStyle, ...args);
        },
        withtag: (tag: string) => createLogger(tag)
    };
};

export const printStartupBadge = () => {
    const mainStyle = 'color: white; background: #00A1D6; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;';
    const versionStyle = 'color: white; background: #6b7a8c; padding: 2px 4px; border-radius: 3px; font-weight: bold; margin-right: 6px;';
    
    console.log(`%c Bilibili PCDN Blocker %c v${GM_info.script.version} `, mainStyle, versionStyle);
};