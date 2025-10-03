<template>
    <div>
        <div v-if="showLatest">
            <Content slot-key="latest-release"/>
            <div v-for="os in ['Ubuntu', 'MacOS', 'Windows']" :key="os">
                <a :href="hrefFor(latestRelease(os))" v-if="latestRelease(os)">
                    <Badge :text="'Get ' + latest.tag_name + ' for ' + os" vertical="middle" />
                </a>
            </div>
        </div>
        <Content slot-key="specific-version"/>
        <Content slot-key="stable-releases"/>
        <tabs :options="{ useUrlFragment: false }" @changed="tabChanged()">
            <tab v-for="os in ['Ubuntu', 'MacOS', 'Windows']" :key="os" :name="os">
                <table>
                    <thead>
                        <tr>
                            <th>Version</th>
                            <th>Kind</th>
                            <th>Arch</th>
                            <th>Size</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="release in limitedReleases(os)" :key="release.key">
                            <td><a :href="hrefFor(release)">&aelig;ternity node {{ extractVersion(release.key) }}</a></td>
                            <td>{{ getKind(release.key) }}</td>
                            <td>{{ formatArch(release.key) }}</td>
                            <td>{{ readableBytes(release.size) }}</td>
                            <td>{{ new Date(release.lastModified).toLocaleDateString() }}</td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <a href="#" @click.prevent="cnt += releasesCnt" v-if="showLoadMore(os)">Show older releases</a>
                </div>
            </tab>
        </tabs>
    </div>
</template>

<script>
    import {Tabs, Tab} from 'vue-tabs-component';

    export default {
        props: {
            baseUrl: {type: String, default: 'https://releases.aeternity.io'},
            releasesCnt: {type: Number , default: 10},
        },
        components: {
            Tabs,
            Tab,
        },
        data() {
            return {
                cnt: this.releasesCnt,
                releases: [],
                latest: [],
                test: false,
            }
        },
        mounted() {
            // Client-only to avoid SSR fetch
            this.fetchData();
            this.fetchLatestRelease();
        },
        methods: {
            async fetchData() {
                // Try S3-style XML first; if it fails or yields no entries, fallback to GitHub Releases API
                try {
                    const res = await fetch(this.baseUrl).catch(() => null);
                    if (res && res.ok) {
                        const xml = await res.text();
                        const parsed = this.parseXml(xml);
                        if (parsed && parsed.length) {
                            this.releases = parsed;
                            return;
                        }
                    }
                } catch (e) {}

                // Fallback to GitHub releases list
                await this.fetchGithubReleasesList().catch(() => {});
            },
            async fetchLatestRelease() {
                await fetch("https://api.github.com/repos/aeternity/aeternity/releases/latest")
                    .then(response => response.json())
                    .then(data => this.latest = data)
                    .catch(() => {})
                ;
            },
            async fetchGithubReleasesList() {
                const url = 'https://api.github.com/repos/aeternity/aeternity/releases?per_page=100';
                const json = await fetch(url)
                    .then(r => r.json())
                    .catch(() => []);

                if (!Array.isArray(json)) return;

                // Flatten assets from non-prerelease entries to match our table expectations
                const flat = [];
                for (const rel of json) {
                    if (rel && rel.prerelease) continue; // keep stable only
                    const when = rel.published_at || rel.created_at || rel.updated_at;
                    if (Array.isArray(rel.assets)) {
                        for (const a of rel.assets) {
                            flat.push({
                                key: a.name || a.label || String(a.id),
                                url: a.browser_download_url,
                                lastModified: a.updated_at || when || new Date().toISOString(),
                                size: a.size || 0,
                            });
                        }
                    }
                }

                this.releases = flat;
            },
            parseXml(xml) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, 'application/xml');
                const contents = xmlDoc.getElementsByTagName('Contents');
                const data = [];

                for (let i = 0; i < contents.length; i++) {
                    const node = contents[i];
                    const getText = (tag) => {
                        const el = node.getElementsByTagName(tag)[0];
                        return el && el.textContent ? el.textContent : '';
                    };
                    const key = getText('Key');
                    const lastModified = getText('LastModified');
                    const sizeStr = getText('Size');
                    const size = sizeStr ? parseInt(sizeStr, 10) : 0;
                    if (key) {
                        data.push({ key, lastModified, size });
                    }
                }

                return data;
            },
            latestRelease(os) {
                // Prefer GitHub latest assets if available
                if (this.latest && Array.isArray(this.latest.assets)) {
                    const osKey = os.toLowerCase();
                    const asset = this.latest.assets.find(a => (a.name || '').toLowerCase().includes(osKey));
                    if (asset) {
                        return {
                            key: asset.name,
                            url: asset.browser_download_url,
                            lastModified: asset.updated_at || this.latest.published_at,
                            size: asset.size || 0,
                        };
                    }
                }
                // Fallback to S3 "latest" naming convention
                return this.releases.find(
                    release => release.key.includes(os.toLowerCase()) && release.key.includes('latest')
                );
            },
            limitedReleases(os) {
                return this.filteredReleases(os).sort((a, b) => a.lastModified < b.lastModified ? 1 : -1).slice(0, this.cnt);
            },
            filteredReleases(os) {
                return this.releases.filter(
                    release => release.key.includes(os.toLowerCase()) && !release.key.includes('-rc.') && !release.key.includes('latest')
                );
            },
            extractVersion(key) {
                const k = key || '';
                // Return semantic version only, with optional -rcN suffix; never include OS tokens
                const sem = k.match(/v?\d+\.\d+\.\d+(?:-rc\d+)?/i);
                if (sem) return sem[0];
                // Fallback: capture between name and "-<word>-x" and strip trailing OS token if present
                const legacy = /-(.*?)(-[\w]+-x)/i.exec(k);
                if (legacy && legacy[1]) {
                    return legacy[1].replace(/-(ubuntu|macos|windows)$/i, '');
                }
                return k;
            },
            readableBytes(bytes) {
                const n = Number(bytes);
                const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                if (!isFinite(n) || n < 0) return '-';
                if (n === 0) return '0 B';
                const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), sizes.length - 1);
                const value = n / Math.pow(1024, i);
                return value.toFixed(2) + ' ' + sizes[i];
            },
            tabChanged() {
                this.cnt = this.releasesCnt;
            },
            showLoadMore(os) {
                return this.cnt <= this.filteredReleases(os).length;
            },
            getKind(key) {
                const k = (key || '').toLowerCase();
                if (k.includes('-bundle-')) {
                    return 'Bundle';
                }
                if (k.includes('-standalone')) {
                    return 'Standalone';
                }
                const ext = this.extractExtension(key);
                if (['.tar.gz', '.zip'].includes(ext)) {
                    return 'Archive';
                }

                return ext ? ext : '-';
            },
            extractExtension(key) {
                return new RegExp(/(\.[a-z]+)+|$/, 'g').exec(key)[0];
            },
            extractArchToken(key) {
                const k = (key || '').toLowerCase();
                if (/\b(arm64|aarch64)\b/.test(k)) return 'arm64';
                if (/\b(x86_64|amd64|x64)\b/.test(k)) return 'x86_64';
                if (/\b(i386|x86)\b/.test(k) && !/\bx86_64\b/.test(k)) return 'x86';
                return null;
            },
            extractLegacyBits(key) {
                const k = (key || '').toLowerCase();
                const legacy = /-x(86_?64|64|32)\b/.exec(k);
                if (!legacy) return null;
                const g = legacy[1];
                if (g.includes('64')) return '64-bit';
                if (g.includes('32')) return '32-bit';
                return null;
            },
            formatArch(key) {
                const token = this.extractArchToken(key);
                if (token) return token; // arm64, x86_64, x86
                const bits = this.extractLegacyBits(key);
                if (bits) return bits;
                return '-';
            },
            hrefFor(item) {
                if (!item) return '#';
                return item.url ? item.url : `${this.baseUrl}/${item.key}`;
            },
        },
        computed: {
            showLatest() {
                return Object.keys(this.latest).length > 0;
            }
        }
    }
</script>
