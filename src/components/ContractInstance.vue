<template>
    <div>
        <b-button
            @click="visible=!visible"
            :disabled="disbaled"
        >{{ toOneAddress(contract.address) }} - {{ contract.status }}</b-button>
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
        return { visible: false, disbaled:this.contract.status=='rejected'};
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
    },
    methods: {
        toOneAddress(hexAddress) {
            if (hexAddress.startsWith("one")) return hexAddress;
            return this.hmy.crypto.toBech32(hexAddress);
        },
        contractCall(item, argv) {
            const toString = (t, d) =>
                t == "address" ? this.toOneAddress(d) : d.toString();
            return this.contract.methods[item.name](...argv)
                .call()
                .then((r) => {
                    if (item.outputs.length == 1) {
                        const output = item.outputs[0];
                        log({
                            type:'method call',
                            method: item.funcName,
                            outputs: [toString(output.type, r)],
                        })
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
                        type:'method call',
                        method: item.funcName,
                        outputs: result.map(e=>e.value),
                    })
                    return result;
                });
        },
        contractSend(item, argv) {
            return this.contract.methods[item.name](...argv)
                .send(this.$store.txConfig())
                .then((r) => {
                    log({
                        type: "method send",
                        method: item.funcName,
                        status: r.transaction.txStatus,
                    });

                    const result = [
                        { name: "txStatus", value: r.transaction.txStatus },
                    ];
                    if (r.transaction.txStatus != "CONFIRMED") {
                        return this.contractReCall(
                            r.transaction.txPayload,
                            r.transaction.receipt.blockHash
                        ).then((reasonRaw) => {
                            if (reasonRaw.error) {
                                result.push({
                                    name: "error",
                                    value: reasonRaw.error,
                                });
                                error("error:", reasonRaw.error);
                            } else if (
                                reasonRaw.result.startsWith("0x08c379a0")
                            ) {
                                const errmsg = this.contract.abiCoder.decodeParameters(
                                    ["string"],
                                    "0x" + reasonRaw.result.slice(10)
                                )[0];
                                result.push({
                                    name: "errorMsg:",
                                    value: errmsg,
                                });
                                error(`errorMsg: ${errmsg}`);
                            } else {
                                result.push({
                                    name: "errorMsg:",
                                    value: reasonRaw.result,
                                });
                            }
                            return result;
                        });
                    }
                    return result;
                });
        },
        contractReCall(txPayload, blockHash) {
            blockHash;
            const doCall = this.hmy.blockchain.Contract.call;
            return doCall(txPayload, "latest");
        },
    },
};
</script>
