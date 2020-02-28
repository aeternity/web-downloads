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
                latest: '',
                cnt: this.backupsCnt,
            }
        },
        created() {
            this.fetchData();
        },
        methods: {
            async fetchData() {
                await fetch(this.baseUrl)
                    .then(response => response.text())
                    .then(data => this.backups = this.parseXml(data))
                    .catch(() => [])
                ;
            },
            parseXml(xml) {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(xml, "text/xml");
                let content = xmlDoc.getElementsByTagName("Contents");
                var data = [];

                for (var i = content.length - 1; i >= 0; i--) {
                    data.push({
                        'key': content[i].childNodes[0].childNodes[0].nodeValue,
                        'lastModified': content[i].childNodes[1].childNodes[0].nodeValue,
                        'size': content[i].childNodes[3].childNodes[0].nodeValue,
                    });
                }

                return data;
            },
            limitedBackups(type) {
                return this.filteredBackups(type).sort((a, b) => a.lastModified < b.lastModified).slice(0, this.cnt);
            },
            filteredBackups(type) {
                return this.backups.filter(release => release.key.includes(type) && !release.key.includes('.md5'));
            },
            readableBytes(bytes) {
                let i = Math.floor(Math.log(bytes) / Math.log(1024));
                let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

                return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
            },
            showLoadMore(type) {
                return this.cnt <= this.filteredBackups(type).length;
            },
            tabChanged() {
                this.cnt = this.backupsCnt;
            },
            getKind(key) {
                if (['.tgz', '.tar.gz', '.zip'].includes(this.extractExtension(key))) {
                    return 'Archive';
                }

                return '-';
            },
            extractExtension(key) {
                return new RegExp(/(\.[a-z]+)+/, 'g').exec(key)[0];
            },
        },
    }
</script>
