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
                        <td>{{ getArch(build.key) }}-bit</td>
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
        created() {
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
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(xml, "text/xml");
                let content = xmlDoc.getElementsByTagName("Contents");
                let data = [];

                for (let i = content.length - 1; i >= 0; i--) {
                    data.push({
                        'key': content[i].childNodes[0].childNodes[0].nodeValue,
                        'lastModified': content[i].childNodes[1].childNodes[0].nodeValue,
                        'size': content[i].childNodes[3].childNodes[0].nodeValue,
                    });
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
                let i = Math.floor(Math.log(bytes) / Math.log(1024));
                let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

                return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
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
                if (['.tar.gz', '.zip'].includes(this.getExtension(key))) {
                    return 'Archive';
                }

                return '-';
            },
            getExtension(key) {
                return new RegExp(/(\.[a-z]+)+/, 'g').exec(key)[0];
            },
            getArch(key) {
                return new RegExp(/-x(\d*_?\d*)/, 'g').exec(key)[1];
            },
            getShortVersion(key) {
                const ver = this.getVersion(key);
                return ver.substring(0, ver.indexOf('-') + 9);
            },
        },
    }
</script>
