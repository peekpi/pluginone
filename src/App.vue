<template>
    <div id="app">
        <Deployment />
        <input id="ShadowCopy" style="display:none" />
    </div>
</template>

<script>
import Vue from "vue";
import Deployment from "./components/Deployment.vue";

export default Vue.extend({
    name: "App",
    components: {
        Deployment,
    },
    mounted() {
        const el = document.getElementById("ShadowCopy");
        Vue.prototype.$copyText = (text) => {
            el.style.display = "block";
            el.value = text;
            el.select();
            document.execCommand("copy");
            el.style.display = "none";
            return text;
        };
    },
});
</script>
