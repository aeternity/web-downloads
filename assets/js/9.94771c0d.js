(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{305:function(t,e,n){var r=n(5),i=n(3),o=n(91),s=n(307),u=n(8).f,a=n(65).f,c=n(167),d=n(98),l=n(172),f=n(10),h=n(1),g=n(28).set,v=n(171),p=n(2)("match"),_=i.RegExp,b=_.prototype,x=/a/g,w=/a/g,y=new _(x)!==x,m=l.UNSUPPORTED_Y;if(r&&o("RegExp",!y||m||h((function(){return w[p]=!1,_(x)!=x||_(w)==w||"/a/i"!=_(x,"i")})))){for(var B=function(t,e){var n,r=this instanceof B,i=c(t),o=void 0===e;if(!r&&i&&t.constructor===B&&o)return t;y?i&&!o&&(t=t.source):t instanceof B&&(o&&(e=d.call(t)),t=t.source),m&&(n=!!e&&e.indexOf("y")>-1)&&(e=e.replace(/y/g,""));var u=s(y?new _(t,e):_(t,e),r?this:b,B);return m&&n&&g(u,{sticky:n}),u},k=function(t){t in B||u(B,t,{configurable:!0,get:function(){return _[t]},set:function(e){_[t]=e}})},E=a(_),M=0;E.length>M;)k(E[M++]);b.constructor=B,B.prototype=b,f(i,"RegExp",B)}v("RegExp")},367:function(t,e,n){"use strict";n.r(e);n(23),n(168),n(170),n(44),n(311),n(312),n(313),n(9),n(305),n(43),n(93),n(169),n(95);var r=n(47),i=n(314),o={props:{baseUrl:{type:String,default:"https://builds.aeternity.io"},buildsCnt:{type:Number,default:10}},components:{Tabs:i.Tabs,Tab:i.Tab},data:function(){return{builds:[],cnt:this.buildsCnt}},created:function(){this.fetchData()},methods:{fetchData:function(){var t=this;return Object(r.a)(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch(t.baseUrl).then((function(t){return t.text()})).then((function(e){return t.builds=t.parseXml(e)})).catch((function(){}));case 2:case"end":return e.stop()}}),e)})))()},parseXml:function(t){for(var e=(new DOMParser).parseFromString(t,"text/xml").getElementsByTagName("Contents"),n=[],r=e.length-1;r>=0;r--)n.push({key:e[r].childNodes[0].childNodes[0].nodeValue,lastModified:e[r].childNodes[1].childNodes[0].nodeValue,size:e[r].childNodes[3].childNodes[0].nodeValue});return n},limitedBuilds:function(t){return this.filteredBuilds(t).sort((function(t,e){return t.lastModified<e.lastModified?1:-1})).slice(0,this.cnt)},filteredBuilds:function(t){return this.builds.filter((function(e){return e.key.includes(t.toLowerCase())}))},readableBytes:function(t){var e=Math.floor(Math.log(t)/Math.log(1024));return 1*(t/Math.pow(1024,e)).toFixed(2)+" "+["B","KB","MB","GB","TB","PB","EB","ZB","YB"][e]},showLoadMore:function(t){return this.cnt<=this.filteredBuilds(t).length},tabChanged:function(){this.cnt=this.buildsCnt},getVersion:function(t){return new RegExp(/aeternity-(.+)(-\w+-x)/,"g").exec(t)[1]},getKind:function(t){return[".tar.gz",".zip"].includes(this.getExtension(t))?"Archive":"-"},getExtension:function(t){return new RegExp(/(\.[a-z]+)+/,"g").exec(t)[0]},getArch:function(t){return new RegExp(/-x(\d*_?\d*)/,"g").exec(t)[1]},getShortVersion:function(t){var e=this.getVersion(t);return e.substring(0,e.indexOf("-")+9)}}},s=n(42),u=Object(s.a)(o,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("tabs",{attrs:{options:{useUrlFragment:!1}},on:{changed:function(e){return t.tabChanged()}}},t._l(["Ubuntu","MacOS","Windows"],(function(e){return n("tab",{key:e,attrs:{name:e}},[t.filteredBuilds(e).length>0?n("table",[n("thead",[n("tr",[n("th",[t._v("Version")]),t._v(" "),n("th",[t._v("Kind")]),t._v(" "),n("th",[t._v("Arch")]),t._v(" "),n("th",[t._v("Size")]),t._v(" "),n("th",[t._v("Date")])])]),t._v(" "),n("tbody",t._l(t.limitedBuilds(e),(function(e){return n("tr",{key:e.key},[n("td",[n("a",{attrs:{href:t.baseUrl+"/"+e.key}},[t._v(t._s(t.getShortVersion(e.key)))])]),t._v(" "),n("td",[t._v(t._s(t.getKind(e.key)))]),t._v(" "),n("td",[t._v(t._s(t.getArch(e.key))+"-bit")]),t._v(" "),n("td",[t._v(t._s(t.readableBytes(e.size)))]),t._v(" "),n("td",[t._v(t._s(new Date(e.lastModified).toLocaleDateString()))])])})),0)]):t._e(),t._v(" "),n("div",[t.showLoadMore(e)?n("a",{attrs:{href:"#"},on:{click:function(e){e.preventDefault(),t.cnt+=t.buildsCnt}}},[t._v("Show older builds")]):t._e()])])})),1)}),[],!1,null,null,null);e.default=u.exports}}]);