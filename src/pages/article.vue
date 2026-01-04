<template>
    <div class="container">
        <ArticleRender class="main"
            :content="content"
            @contentRendered="test1"
            @directoryRendered="test2"

            directorybox="#directory"

            :linkWhitelist="linkWhitelist"
            :linkStrict="linkStrict"

            :cdnDomain="cdnDomain"
            :iframeWhitelist="iframeWhitelist"
        ></ArticleRender>
        <div id="directory"></div>
    </div>
</template>

<script>
import ArticleRender from "../components/Article.vue";

export default {
    name: "APage",
    props: [],
    data: function () {
        return {
            content: "",

            linkWhitelist: ["*.2kog.com","www.iruxu.com"],
            linkStrict: false,

            cdnDomain: "https://cdn.2kog.com",

            iframeWhitelist: ["player.bilibili.com"],
        };
    },
    components: {
        ArticleRender,
    },
    methods: {
        test1() {
            console.log("contentRendered");
        },
        test2() {
            console.log("directoryRendered");
        },
    },
    async mounted() {
        const res = await fetch("/demo/article_basic.html");
        this.content = await res.text();
    },
};
</script>

<style lang="less">
html {
    padding: 20px;
}
.container{
    display: flex;
    gap: 20px;
    #directory{
        width: 200px;
        flex-shrink: 0;
    }
    .main{
        flex-grow: 1;
    }

}
</style>
