import { getConfig } from '../utils/menu';
import { createLogger } from '../utils/logger';
import { PCDN_PATTERN, BCACHE_PATTERN } from '../constants';

const logger = createLogger('Video');

export interface VideoMediaItem {
    id: number;
    codecid?: number;
    codecs?: string;
    bandwidth?: number;
    baseUrl?: string;
    base_url?: string;
    backupUrl?: string[];
    backup_url?: string[];
}

export interface CleanedTrack {
    type: 'video' | 'audio';
    quality: string;
    codec: string;
    cdn: string;
}

function filterCandidateUrls(allUrls: string[]): { primary: string; backups: string[] } {
    let cleanUrls = allUrls.filter(url => !PCDN_PATTERN.test(url));

    if (getConfig('blockBCacheCDN')) {
        const withoutBcache = cleanUrls.filter(url => !BCACHE_PATTERN.test(url));
        if (withoutBcache.length > 0) cleanUrls = withoutBcache;
    }

    let primary = cleanUrls[0];
    const backups = cleanUrls.slice(1);

    if (!primary && getConfig('fallbackIfAllPCDN')) {
        primary = allUrls[0];
    }

    return { primary: primary ?? '', backups };
}

function cleanMediaItem(
    media: VideoMediaItem,
    type: 'video' | 'audio',
    formatMap: Map<number, string>,
    cleanedTracks: CleanedTrack[]
): void {
    const primary = media.baseUrl ?? media.base_url;
    const backups = media.backupUrl ?? media.backup_url ?? [];
    const allUrls = primary ? [primary, ...backups] : backups;
    if (allUrls.length === 0) return;

    const { primary: chosenUrl, backups: cleanBackups } = filterCandidateUrls(allUrls);

    media.baseUrl = media.base_url = chosenUrl;
    media.backupUrl = media.backup_url = cleanBackups;

    const spec = type === 'video'
        ? (formatMap.get(media.id) ?? `${media.id}P`)
        : (media.bandwidth ? `${Math.round(media.bandwidth / 1000)} kbps` : String(media.id));

    const codec = media.codecs?.split('.')[0] ?? String(media.codecid ?? '-');

    cleanedTracks.push({
        type,
        quality: spec,
        codec,
        cdn: chosenUrl ? new URL(chosenUrl).host : ''
    });
}

function getPlayUrlBody(data: any): any {
    return data?.result?.video_info ?? data?.data ?? data;
}

export function cleanVideoPlayInfo(raw: any): void {
    const body = getPlayUrlBody(raw);
    if (!body) return;

    const cleanedTracks: CleanedTrack[] = [];
    const dash = body.dash;

    if (dash) {
        const formatMap = new Map<number, string>(
            (body.support_formats ?? []).map((f: any) => [f.quality, f.new_description])
        );

        dash.video?.forEach((v: VideoMediaItem) => cleanMediaItem(v, 'video', formatMap, cleanedTracks));
        dash.audio?.forEach((a: VideoMediaItem) => cleanMediaItem(a, 'audio', formatMap, cleanedTracks));

        if (dash.dolby?.audio) {
            const dolbys = Array.isArray(dash.dolby.audio) ? dash.dolby.audio : [dash.dolby.audio];
            dolbys.forEach((d: VideoMediaItem) => cleanMediaItem(d, 'audio', formatMap, cleanedTracks));
        }

        if (dash.flac?.audio) {
            cleanMediaItem(dash.flac.audio, 'audio', formatMap, cleanedTracks);
        }
    }

    if (Array.isArray(body.durl)) {
        body.durl.forEach((seg: any) => {
            const allUrls = seg.url ? [seg.url, ...(seg.backup_url ?? [])] : (seg.backup_url ?? []);
            if (allUrls.length === 0) return;
            const { primary, backups } = filterCandidateUrls(allUrls);
            seg.url = primary;
            seg.backup_url = backups;
        });
    }

    if (cleanedTracks.length > 0) {
        logger.debug(`处理音视频轨 (${cleanedTracks.length})`, cleanedTracks);
    }
}
