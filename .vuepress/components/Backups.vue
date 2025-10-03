<template>
    <div>
        <!-- Latest backups quick links -->
        <div v-if="latestBackups.length">
            <div v-for="b in latestBackups" :key="b.key" style="margin: 6px 0;">
                <a :href="`${baseUrl}/${b.key}`">
                    <Badge :text="`Get latest ${getKind(b.key)} snapshot for ${getNetwork(b.key)}`" vertical="middle" />
                </a>
                - {{ new Date(b.lastModified).toLocaleDateString() }} - {{ readableBytes(b.size) }}
            </div>
        </div>
        <tabs :options="{ useUrlFragment: false }" @changed="tabChanged()">
        <tab name="Mainnet">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Kind</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="backup in this.limitedBackups('main')" :key="backup.key">
                        <td>
                            <a :href="`${baseUrl}/${backup.key}`">
                                {{ new Date(backup.lastModified).toLocaleDateString() }}
                            </a>
                        </td>
                        <td>{{ getKind(backup.key) }}</td>
                        <td>{{ readableBytes(backup.size) }}</td>
                    </tr>
                </tbody>
            </table>
            <div>
                <a href="#" @click.prevent="cnt += backupsCnt" v-if="showLoadMore('main')">Show older backups</a>
            </div>
        </tab>
        <tab name="Testnet">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Kind</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="backup in this.limitedBackups('uat')" :key="backup.key">
                        <td>
                            <a :href="`${baseUrl}/${backup.key}`">
                                {{ new Date(backup.lastModified).toLocaleDateString() }}
                            </a>
                        </td>
                        <td>{{ getKind(backup.key) }}</td>
                        <td>{{ readableBytes(backup.size) }}</td>
                    </tr>
                </tbody>
            </table>
            <div>
                <a href="#" @click.prevent="cnt += backupsCnt" v-if="showLoadMore('uat')">Show older backups</a>
            </div>
        </tab>
    </tabs>
    </div>
</template>

<script>
    import {Tabs, Tab} from 'vue-tabs-component';

    export default {
        props: {
            baseUrl: {type: String, default: 'https://aeternity-database-backups.s3.eu-central-1.amazonaws.com'},
            backupsCnt: {type: Number , default: 10},
        },
        components: {
            Tabs,
            Tab
        },
        data() {
            return {
                backups: [],
                cnt: this.backupsCnt,
            }
        },
        mounted() {
            // Client-only: avoid SSR fetch during static build
            this.fetchData();
        },
        methods: {
            async fetchData() {
                const xml = await fetch(this.baseUrl)
                    .then(response => response.text())
                    .catch(() => {})
                ;

                const data = this.parseXml(xml);
                this.backups = await this.parseChecksums(data).catch(() => {});
            },
            async fetchChecksum(file) {
                return await fetch(`${this.baseUrl}/${file.key}.md5`)
                    .then(response => response.text())
                    .then((result) => result)
                    .catch(() => {})
                ;
            },
            async parseChecksums(snapshots) {
                let withChecksums = [];
                for (let i = snapshots.length - 1; i >= 0; i--) {
                    let snapshot = snapshots[i];

                    if (snapshot.key.includes('.md5')) {
                        continue;
                    }

                    if (snapshots.find(backup => backup.key === `${snapshot.key}.md5`)) {
                        let checksum = await this.fetchChecksum(snapshot).catch(() => {});
                        withChecksums.push({
                            ...snapshot,
                            checksum
                        });

                        continue;
                    }

                    withChecksums.push(snapshot);
                }

                return withChecksums;
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
            getNetwork(key) {
                const k = (key || '').toLowerCase();
                if (k.includes('uat')) return 'testnet';
                if (k.includes('main')) return 'mainnet';
                return '-';
            },
            limitedBackups(type) {
                return this.filteredBackups(type).sort((a, b) => a.lastModified < b.lastModified ? 1 : -1).slice(0, this.cnt);
            },
            filteredBackups(type) {
                return this.backups.filter(release => {
                    const k = release.key || '';
                    if (!k.includes(type)) return false;
                    if (k.includes('.md5')) return false;
                    const isMDW = /^mdw[_-]/i.test(k);
                    if (!isMDW && k.includes('latest')) return false; // exclude non-MDW latest
                    return true;
                });
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
            showLoadMore(type) {
                return this.cnt <= this.filteredBackups(type).length;
            },
            tabChanged() {
                this.cnt = this.backupsCnt;
            },
            getKind(key) {
                if (/mdw[_-]/i.test(key) || key.startsWith('mdw_')) {
                    return 'MDW'
                }

                if (key.includes('_light_')) {
                    return 'Light'
                }

                if (key.includes('_full_')) {
                    return 'Full'
                }

                return 'full';
            },
        },
        computed: {
            latestBackups() {
                // Show entries: (main_v*latest, uat_v*latest, mdw_main_latest*, mdw_uat_latest*) excluding checksum files
                return (this.backups || []).filter(b => {
                    const k = (b.key || '').toLowerCase();
                    if (!k || k.endsWith('.md5')) return false;
                    const hasPrefix = k.startsWith('main_v') || k.startsWith('uat_v') || k.startsWith('mdw_main_latest') || k.startsWith('mdw_uat_latest');
                    const isLatest = k.includes('latest');
                    return hasPrefix && isLatest;
                });
            }
        }
    }
</script>
