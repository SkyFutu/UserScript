import { getConfig } from '../utils/menu';
import { createLogger } from '../utils/logger';

const logger = createLogger('Video');
const PCDN_PATTERN = /(mcdn\.bilivideo\.(com|cn)|edge\.mountaintoys\.cn)/;
const BCACHE_PATTERN = /(cn-.*\.bilivideo\.(com|cn))/;

function filterUrls(urls: string[]): { baseUrl: string, backupUrls: string[] } {
    let restUrls = urls.filter(url => !PCDN_PATTERN.test(url));

    if (getConfig("blockBCacheCDN")) {
        restUrls = restUrls.filter(url => !BCACHE_PATTERN.test(url));
    }

    return { baseUrl: restUrls[0], backupUrls: restUrls.slice(1) };
}

export function cleanVideoPlayInfo(data: any) {
    if (!data) return;

    logger.debug("视频列表 fetch 处理前", JSON.parse(JSON.stringify(data)));
    
    let count = 0;
    const videoHosts = new Set<string>();
    const audioHosts = new Set<string>();

    const extractHost = (urlStr: string) => {
        try { return new URL(urlStr).host; } catch { return urlStr; }
    };

    // 💡 targetBasket 现在的类型是 Set string
    const cleanMedia = (media: any, targetBasket: Set<string>) => {
            if (!media) return;
            const allUrls = [media.baseUrl || media.base_url, ...(media.backupUrl || media.backup_url || [])].filter(Boolean);
            if (allUrls.length === 0) return;
            
            const { baseUrl, backupUrls } = filterUrls(allUrls);
            
            media.baseUrl = media.base_url = baseUrl;
            media.backupUrl = media.backup_url = backupUrls;
            
            if (baseUrl) {
                targetBasket.add(extractHost(baseUrl));
                if (backupUrls.length > 0) {
                    backupUrls.forEach(url => targetBasket.add(extractHost(url)));
                }
                count++;
            }
        };

    const dash = data.dash || data.video_info?.dash;
    if (dash) {
        dash.video?.forEach((m: any) => cleanMedia(m, videoHosts));
        dash.audio?.forEach((m: any) => cleanMedia(m, audioHosts));
        dash.dolby?.audio?.forEach((m: any) => cleanMedia(m, audioHosts));
        if (dash.flac?.audio) cleanMedia(dash.flac.audio, audioHosts);
    }

    const durlGroup = data.durl || data.video_info?.durl || data.video_info?.durls;
    if (Array.isArray(durlGroup)) {
        durlGroup.forEach((item: any) => {
            if (item.durl) item.durl.forEach((m: any) => cleanMedia(m, videoHosts));
            else cleanMedia(item, videoHosts);
        });
    }

    if (count > 0) {
        logger.log(`${count} 条音视频轨道并使用以下节点分发`, {   
            Audio: [...audioHosts],   
            Video: [...videoHosts], 
        });
    }
}