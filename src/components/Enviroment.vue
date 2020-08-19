<template>
    <b-form>
        <b-form-group label-size="sm" label="Networks:">
            <b-form-select size="sm" v-model="network" :options="networks"></b-form-select>
        </b-form-group>
        <b-form-group label-size="sm" label="Wallet:">
            <b-form-select size="sm" v-model="selectWallet" :options="wallets"></b-form-select>
        </b-form-group>
        <b-form-group label-size="sm" label="Account:">
            <b-form-select size="sm" v-model="selected" :options="accounts"></b-form-select>
        </b-form-group>
    </b-form>
</template>

<script>
export default {
    name: "Envroment",
    data(){return {
          networks: [
                {
                    value: {
                        url: "",
                        chainID: "",
                        chainType: "",
                        shardID: "",
                    },
                    text: "mainnet",
                },
                {
                    value: {
                        url: "",
                        chainID: "",
                        chainType: "",
                        shardID: "",
                    },
                    text: "testnet",
                },
                {
                    value: null,
                    text: "...",
                },
            ],
            network: null,
    }}
}
</script>