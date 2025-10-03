<template>
    <tabs :options="{ useUrlFragment: false }" @changed="tabChanged()">
        <tab v-for="os in ['Ubuntu', 'MacOS', 'Windows']" :key="os" :name="os">
            <table v-if="filteredBuilds(os).length > 0">
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
                    <tr v-for="build in limitedBuilds(os)" :key="build.key">
                        <td><a :href="`${baseUrl}/${build.key}`">{{ getShortVersion(build.key) }}</a></td>
                        <td>{{ getKind(build.key) }}</td>
                        <td>{{ formatArch(build.key) }}</td>
                        <td>{{ readableBytes(build.size) }}</td>
                        <td>{{ new Date(build.lastModified).toLocaleDateString() }}</td>
                    </tr>
                </tbody>
            </table>
            <div>
                <a href="#" @click.prevent="cnt += buildsCnt" v-if="showLoadMore(os)">Show older builds</a>
            </div>
        </tab>
    </tabs>
</template>

<script>
    import {Tabs, Tab} from 'vue-tabs-component';

    export default {
        props: {
            baseUrl: {type: String, default: 'https://builds.aeternity.io'},
            buildsCnt: {type: Number , default: 10},
        },
        components: {
            Tabs,
            Tab
        },
        data() {
            return {
                builds: [],
                cnt: this.buildsCnt,
            }
        },
        mounted() {
            // Client-only: avoid SSR fetch during static build
            this.fetchData();
        },
        methods: {
            async fetchData() {
                await fetch(this.baseUrl)
                    .then(response => response.text())
                    .then(data => this.builds = this.parseXml(data))
                    .catch(() => {})
                ;
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
            limitedBuilds(os) {
                return this.filteredBuilds(os).sort((a, b) => a.lastModified < b.lastModified ? 1 : -1).slice(0, this.cnt);
            },
            filteredBuilds(os) {
                return this.builds.filter(build => build.key.includes(os.toLowerCase()));
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
            showLoadMore(os) {
                return this.cnt <= this.filteredBuilds(os).length;
            },
            tabChanged() {
                this.cnt = this.buildsCnt;
            },
            getVersion(key) {
                return new RegExp(/aeternity-(.+)(-\w+-x)/, 'g').exec(key)[1];
            },
            getKind(key) {
                const k = (key || '').toLowerCase();
                if (k.includes('-standalone')) {
                    return 'Standalone';
                }
                if (k.includes('-bundle-')) {
                    return 'Bundle';
                }
                if (['.tar.gz', '.zip'].includes(this.getExtension(key))) {
                    return 'Archive';
                }

                return '-';
            },
            getExtension(key) {
                return new RegExp(/(\.[a-z]+)+/, 'g').exec(key)[0];
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
                if (token) return token;
                const bits = this.extractLegacyBits(key);
                if (bits) return bits;
                return '-';
            },
            getShortVersion(key) {
                const ver = this.getVersion(key);
                return ver.substring(0, ver.indexOf('-') + 9);
            },
        },
    }
</script>
