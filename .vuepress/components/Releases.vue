<template>
    <div>
        <div v-if="showLatest">
            <Content slot-key="latest-release"/>
            <div v-for="os in ['Ubuntu', 'MacOS', 'Windows']" :key="os">
                <a :href="`${baseUrl}/${latestRelease(os).key}`" v-if="latestRelease(os)">
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
                            <td><a :href="`${baseUrl}/${release.key}`">{{ extractVersion(release.key) }}</a></td>
                            <td>{{ getKind(release.key) }}</td>
                            <td>{{ extractArch(release.key) }}-bit</td>
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
        created() {
            this.fetchData();
            this.fetchLatestRelease();
        },
        methods: {
            async fetchData() {
                await fetch(this.baseUrl)
                    .then(response => response.text())
                    .then(data => this.releases = this.parseXml(data))
                    .catch(() => [])
                ;
            },
            async fetchLatestRelease() {
                await fetch("https://api.github.com/repos/aeternity/aeternity/releases/latest")
                    .then(response => response.json())
                    .then(data => this.latest = data)
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
            latestRelease(os) {
                return this.releases.find(
                    release => release.key.includes(os.toLowerCase()) && release.key.includes('latest')
                );
            },
            limitedReleases(os) {
                return this.filteredReleases(os).sort((a, b) => a.lastModified < b.lastModified).slice(0, this.cnt);
            },
            filteredReleases(os) {
                return this.releases.filter(
                    release => release.key.includes(os.toLowerCase()) && !release.key.includes('-rc.') && !release.key.includes('latest')
                );
            },
            extractVersion(key) {
                return 'aeternity node ' + new RegExp(/[\d\.]+/, 'g').exec(key)[0];
            },
            readableBytes(bytes) {
                let i = Math.floor(Math.log(bytes) / Math.log(1024));
                let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

                return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
            },
            tabChanged() {
                this.cnt = this.releasesCnt;
            },
            showLoadMore(os) {
                return this.cnt <= this.filteredReleases(os).length;
            },
            getKind(key) {
                if (['.tar.gz', '.zip'].includes(this.extractExtension(key))) {
                    return 'Archive';
                }

                return '-';
            },
            extractExtension(key) {
                return new RegExp(/(\.[a-z]+)+/, 'g').exec(key)[0];
            },
            extractArch(key) {
                return new RegExp(/-x(\d*_?\d*)/, 'g').exec(key)[1];
            },
        },
        computed: {
            showLatest() {
                return Object.keys(this.latest).length > 0;
            }
        }
    }
</script>
