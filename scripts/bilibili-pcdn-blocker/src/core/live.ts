import { getConfig } from '../utils/menu';
import { createLogger } from '../utils/logger';

const logger = createLogger('Live');

export interface LivePlayUrl {
    cid?: number;
    g_qn_desc?: Array<{
        qn: number;
        desc: string;
    }>;
    p2p_data?: {
        p2p: boolean;
        p2p_type: number;
    };
    stream?: Array<{
        protocol_name: string;
        format?: Array<{
            format_name: string;
            master_url?: string;
            codec?: Array<{
                codec_name: string;
                current_qn: number;
                base_url: string;
                url_info?: Array<{
                    host: string;
                    extra: string;
                }>;
            }>;
        }>;
    }>;
}

export interface CleanedLiveStream {
    protocol: string;
    format: string;
    codec: string;
    quality: string;
    cdn: string;
}

function getLivePlayUrl(raw: any): LivePlayUrl | undefined {
    return raw?.roomInitRes?.data?.playurl_info?.playurl ??
           raw?.data?.playurl_info?.playurl;
}

export function cleanLivePlayInfo(raw?: any): void {
    if (!getConfig('blockLivePCDN')) return;

    const playurl = getLivePlayUrl(raw);
    if (!playurl?.stream) return;

    if (playurl.p2p_data) {
        playurl.p2p_data.p2p = false;
        playurl.p2p_data.p2p_type = -1;
    }

    const qnMap = new Map<number, string>(
        (playurl.g_qn_desc ?? []).map((item) => [item.qn, item.desc])
    );

    const streams: CleanedLiveStream[] = [];

    playurl.stream.forEach((stream) => {
        stream.format?.forEach((format) => {
            if (format.master_url) {
                format.master_url = format.master_url.replace(/([?&]p2p_type=)\d+/, '$1-1');
            }
            format.codec?.forEach((codec) => {
                codec.url_info?.forEach((info) => {
                    info.extra = info.extra.replace(/([?&]p2p_type=)\d+/, '$1-1');
                });
                streams.push({
                    protocol: stream.protocol_name,
                    format: format.format_name,
                    codec: codec.codec_name,
                    quality: qnMap.get(codec.current_qn) ?? `${codec.current_qn}P`,
                    cdn: codec.url_info?.[0]?.host ?? ''
                });
            });
        });
    });

    if (streams.length > 0) {
        logger.debug(`处理直播流 (${streams.length})`, streams);
    }
}
