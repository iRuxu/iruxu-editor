<template>
    <div class="c-article-tinymce c-article-box">
        <!-- <div id="c-article-origin" class="c-article-origin" ref="origin"><slot></slot></div> -->
        <div id="c-article" class="c-article" ref="article" v-if="pageable">
            <div
                class="c-article-chunk"
                v-for="(text, i) in data"
                :key="i"
                v-html="text"
                :class="{ on: i == page - 1 || all == true }"
                :id="'c-article-part' + ~~(i + 1)"
            ></div>
        </div>
        <div id="c-article" class="c-article" ref="article" v-else-if="data && data.length" v-html="data[0]"></div>
        <el-button class="c-article-all" type="primary" v-if="!all && hasPages" @click="showAll">加载全部</el-button>
        <el-pagination
            class="c-article-pages"
            v-if="!all"
            background
            center
            :page-size="1"
            :hide-on-single-page="true"
            @current-change="changePage"
            :current-page="page"
            layout="total, prev, pager, next, jumper"
            :total="total"
        ></el-pagination>

        <!-- 相册 -->
        <!-- <el-image-viewer
            v-if="showImageViewer"
            :url-list="images"
            @close="onImageViewerClose"
            :initialIndex="imageIndex"
            hide-on-click-modal
        ></el-image-viewer> -->
    </div>
</template>

<script>
import { ElPagination, ElButton } from "element-plus";
import "element-plus/dist/index.css";

// XSS
import execFilterXSS from "../assets/js/xss";
// const execFilterXSS = require("xss");
// const xss_options = {
//     allowCommentTag: true,
// };

// 基本文本
import execLazyload from "../assets/js/img";
import execFilterIframe from "../assets/js/iframe";
import execFilterLink from "../assets/js/a";
import execSplitPages from "../assets/js/nextpage";

// 扩展文本
import renderFoldBlock from "../assets/js/fold";
import renderDirectory from "../assets/js/directory";
import renderKatex from "../assets/js/katex";
import renderCode from "../assets/js/code";
import renderImgPreview from "../assets/js/renderImgPreview";

export default {
    name: "ArticleRender",
    props: {
        // 内容
        content: String,

        // 拼接相对路径地址的图片，需要自带协议
        cdnDomain: {
            type: String,
            default: "",
        },
        // 链接白名单检查，不在白名单，使用新窗跳转
        linkWhitelist: {
            type: Array,
            default: function () {
                return [];
            },
        },
        // 链接白名单强制模式，开启后不在白名单的链接一律置空，不允许跳转
        linkStrict: {
            type: Boolean,
            default: false,
        },
        // iframe白名单检查，不在白名单，移除iframe
        iframeWhitelist: {
            type: Array,
            default: function () {
                return [];
            },
        },
        // 目录容器选择器
        directorybox: String,
        // 是否开启分页
        pageable: {
            type: Boolean,
            default: true,
        },
    },
    data: function () {
        return {
            // 作品
            all: false,
            page: 1,
            data: [],
            mode: "",
        };
    },
    computed: {
        total: function () {
            return this.chunks.length;
        },
        hasPages: function () {
            return this.chunks.length > 1;
        },
        origin: function () {
            return this.content;
        },
        chunks: function () {
            return this.pageable ? execSplitPages(this.origin) : [this.origin];
        },
    },
    methods: {
        doReg: function (data) {
            if (data) {
                // 过滤内容
                data = execLazyload(data, this.cdnDomain);
                data = execFilterIframe(data, this.iframeWhitelist);
                data = execFilterXSS(data);
                data = execFilterLink(data, this.linkWhitelist, this.linkStrict);
                return data;
            } else {
                return "";
            }
        },
        doDOM: function ($root) {
            // 折叠块
            renderFoldBlock($root);
            // 代码
            renderCode(`code[class=^'language-']`);
            // Tatex
            renderKatex();

            // 画廊
            renderImgPreview();
        },
        doDir: function () {
            // 显示局部
            let target = "";
            if (this.hasPages && !this.all) {
                target = "#c-article-part" + this.page;
                // 全部
            } else {
                target = "#c-article";
            }
            let dir = renderDirectory(target, this.directorybox);
            this.$emit("directoryRendered", dir);
        },
        changePage: function (i) {
            this.page = i;
            window.scrollTo(0, 0);
            this.$nextTick(() => {
                this.doDir();
            });
        },
        showAll: function () {
            this.all = true;
            this.$nextTick(() => {
                this.doDir();
            });
        },
        render: function () {
            let result = [];
            for (let chunk of this.chunks) {
                let _chunk = this.doReg(chunk);
                result.push(_chunk);
            }
            this.data = result;
        },
        run: function () {
            this.render();

            // 等待html加载完毕后
            this.$nextTick(() => {
                this.$emit("contentLoaded");

                // 统一DOM处理
                const $root = this.$refs.article;
                this.doDOM($root);
                this.$emit("contentRendered");

                // 目录处理
                this.doDir();
            });
        },
    },
    watch: {
        content: function () {
            this.run();
        },
    },
    mounted: function () {
        const params = new URLSearchParams(location.search);
        this.mode = params.get("mode") || "";
        this.run();
    },
    components: {
        "el-pagination": ElPagination,
        "el-button": ElButton,
    },
};
</script>

<style lang="less">
@import "../assets/css/article.less";
</style>
