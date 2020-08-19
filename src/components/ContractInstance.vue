<template>
    <div class="lineInstance">
        <b-button-group>
            <b-button @click="visible=!visible" :disabled="disbaled">
                <b-icon :icon="visible?'chevron-down':'chevron-right'"></b-icon>
            </b-button>

            <b-button class="wfont" @click="$copyText(contract.address)">{{ toOneAddress(contract.address) | short }}</b-button>

            <b-link :href="ContractLink" target="_blank">
                <b-button>
                    <b-icon icon="box-arrow-up-right"></b-icon>
                </b-button>
            </b-link>
            <b-button @click="$emit('close')">
                <b-icon icon="x"></b-icon>
            </b-button>
        </b-button-group>
        <b-collapse v-model="visible">
            <div>
                <ItemCard
                    v-for="(item,index) in abiClassify.abiReadonly"
                    :key="index"
                    :item="item"
                    :triger="contractCall"
                />
            </div>
            <div>
                <ItemCard
                    v-for="(item,index) in abiClassify.abiWrite"
                    :key="index"
                    :item="item"
                    :triger="contractSend"
                />
            </div>
            <div>
                <ItemCard
                    v-for="(item,index) in abiClassify.abiPayable"
                    :key="index"
                    :item="item"
                    :triger="contractSend"
                />
            </div>
        </b-collapse>
    </div>
</template>

<script>
import { log, error } from "../js/remixClient";
import ItemCard from "./ItemCard.vue";

export default {
    name: "ContractInstance",
    components: { ItemCard },
    data() {
        return { visible: false, disbaled: this.contract.status == "rejected" };
    },
    props: ["contract", "abi", "hmy"],
    computed: {
        abiClassify() {
            console.log("abiClassify");
            const abiReadonly = [];
            const abiWrite = [];
            const abiPayable = [];
            const abiEvent = [];
            let abiConstractor = null;
            //const
            console.log("xitem: abiClassify:", this.abi);
            this.abi.forEach((item) => {
                console.log("item:", item);
                if (item.type == "constructor") abiConstractor = item;
                else if (item.type == "event") abiEvent.push(item);
                else if (item.constant) abiReadonly.push(item);
                else if (item.payable) abiPayable.push(item);
                else abiWrite.push(item);
            });
            return { abiConstractor, abiReadonly, abiWrite, abiPayable };
        },
        ContractLink(){
            return `${this.hmy.config.explorer}/#/address/${this.contract.address}`;
        }
    },
    methods: {
        toOneAddress(hexAddress) {
            if (hexAddress.startsWith("one")) return hexAddress;
            return this.hmy.crypto.toBech32(hexAddress);
        },
        contractCall(item, argv) {
            try {
                return this._contractCall(item, argv);
            } catch (e) {
                const invalid =
                    e.toString() == "[object Object]" || e.toString() == "";
                error(invalid ? e : e.toString());
            }
        },
        _contractCall(item, argv) {
            const toString = (t, d) =>
                t == "address" ? this.toOneAddress(d) : d.toString();
            return this.contract.methods[item.name](...argv)
                .call()
                .then((r) => {
                    if (item.outputs.length == 1) {
                        const output = item.outputs[0];
                        log({
                            type: "method call",
                            method: item.funcName,
                            outputs: [toString(output.type, r)],
                        });
                        return [
                            {
                                name: output.name,
                                value: toString(output.type, r),
                            },
                        ];
                    }
                    const result = [];
                    for (let i = 0; i < item.outputs.length; i++) {
                        const output = item.outputs[i];
                        result.push({
                            name: output.name,
                            value: toString(output.type, r[i]),
                        });
                    }

                    log({
                        type: "method call",
                        method: item.funcName,
                        inputs:argv,
                        outputs: result.map((e) => e.value),
                    });
                    return result;
                })
                .catch((e) => {
                    error(e);
                    return Object.keys(e).map((key) => ({
                        name: key,
                        value: e[key],
                    }));
                });
        },
        contractSend(item, argv) {
            try {
                return this._contractSend(item, argv);
            } catch (e) {
                const invalid =
                    e.toString() == "[object Object]" || e.toString() == "";
                error(invalid ? e : e.toString());
            }
        },
        _contractSend(item, argv) {
            return this.contract.methods[item.name](...argv)
                .send(this.$store.txConfig())
                .then((r) => {
                    log({
                        type: "method send",
                        method: item.funcName,
                        inputs:argv,
                        sender: this.hmy.crypto.toBech32(r.transaction.from),
                        tx: r.transaction.id,
                        status: r.transaction.txStatus,
                    });

                    const result = [
                        { name: "txStatus", value: r.transaction.txStatus },
                    ];
                    if (r.transaction.txStatus != "CONFIRMED") {
                        return this.contractCall(item, argv);
                    }
                    return result;
                })
                .catch((e) => {
                    error(e);
                    return [{ name: "error", value: e }];
                });
        },
    },
};
</script>

<style scoped>
.wfont {
    font-family: monospace, "Courier New", Courier;
}

.lineInstance {
    margin-top: 1.5em;
}
</style>
