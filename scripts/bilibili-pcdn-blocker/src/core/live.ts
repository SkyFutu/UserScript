import { getConfig } from '../utils/menu';
import { createLogger } from '../utils/logger';

const logger = createLogger('Live');
const LIVE_PCDN_PATTERN = /(mcdn\.bilivideo\.(com|cn))/;

export function cleanLivePlayInfo(playurlInfo: any) {
    if (!playurlInfo || !getConfig("blockLivePCDN")) return;
    
    logger.debug("直播列表 fetch 处理前", JSON.parse(JSON.stringify(playurlInfo)));

    let count = 0;
    const collectedHosts = new Set<string>();

    if (playurlInfo.p2p_data) {
        playurlInfo.p2p_data.p2p = false;
        playurlInfo.p2p_data.p2p_type = 0;
        // playurlInfo.p2p_data.m_p2p = false;
        // playurlInfo.p2p_data.m_servers = null;
    }

    playurlInfo.stream?.forEach((stream: any) => {
        stream.format?.forEach((format: any) => {
            format.codec?.forEach((codec: any) => {
                if (codec.url_info) {
                    codec.url_info = codec.url_info.filter((info: any) => !LIVE_PCDN_PATTERN.test(info.host));
                    
                    if (codec.url_info.length > 0) {
                        codec.url_info.forEach((info: any) => collectedHosts.add(info.host));
                        count++;
                    }
                }
            });
        });
    });

    if (count > 0) {
        logger.log(`${count} 条直播流并使用以下节点分发`, [...collectedHosts]);
    }
}