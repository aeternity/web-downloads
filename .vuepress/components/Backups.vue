<template>
    <tabs :options="{ useUrlFragment: false }" @changed="tabChanged()">
        <tab name="Main net">
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
        <tab name="Test net">
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
            limitedBackups(type) {
                return this.filteredBackups(type).sort((a, b) => a.lastModified < b.lastModified ? 1 : -1).slice(0, this.cnt);
            },
            filteredBackups(type) {
                return this.backups.filter(
                    release => release.key.includes(type)
                        && !release.key.includes('.md5')
                        && !release.key.includes('latest')
                );
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
                if (key.includes('_light_')) {
                    return 'light'
                }

                if (key.includes('_full_')) {
                    return 'full'
                }

                if (key.includes('_mdw_')) {
                    return 'MDW'
                }

                return 'full';
            },
        },
    }
</script>
