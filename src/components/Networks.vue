<template>
    <b-form-group label-size="sm" label="Networks:">
        <b-form-select v-model="network" :options="networks" @change="change" />
    </b-form-group>
</template>

<script>

import { TESTNET, MAINNET } from "../js/globalConfig.js"
import { HmySDK } from '../js/hmy.js'

export default {
    name: "Envroment",
    data() {
        return {
            networks: [
                {
                    value: 0,
                    config: MAINNET,
                    sdk: new HmySDK(MAINNET, "MAINNET"),
                    text: "MAINNET",
                },
                {
                    value: 1,
                    config:TESTNET,
                    sdk: new HmySDK(TESTNET, "TESTNET"),
                    text: "TESTNET",
                },
                {
                    value: 2,
                    config:{},
                    sdk: null,
                    text: "CUSTOM...",
                    disabled: true,
                },
            ],
            network: 1,
        };
    },
    mounted(){
        this.change();
    },
    methods:{
        change(){
            this.$emit("networkChange", this.networks[this.network].sdk);
            window.hmy = this.networks[this.network].sdk;
        }
    }
};
</script>