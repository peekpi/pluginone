<template>
    <div class="lineItem">
        <b-input-group>
            <b-input-group-prepend>
                <b-button
                    @click="methodTriger"
                    :variant="color"
                    class="button"
                >{{ item.name?item.name:'DEPLOY' }}</b-button>
            </b-input-group-prepend>

            <template v-slot:append v-if="item.inputs.length">
                <b-button @click="visible=!visible">
                    <b-icon :icon="visible?'chevron-down':'chevron-right'" />
                </b-button>
            </template>
            <b-form-input
                v-if="item.inputs.length"
                lazy
                v-model="singleValue"
                :placeholder="singlePlaceholder"
            />
        </b-input-group>
        <b-collapse v-if="item.inputs.length" v-model="visible">
            <b-input-group
                v-for="(input,index) in item.inputs"
                :key="index"
                :prepend="input.name?input.name:String(index)"
            >
                <b-form-input v-model="argv[index]" :placeholder="input.type" />
            </b-input-group>
        </b-collapse>
        <div v-if="result">
            <ul start="0">
                <li v-for="(r,i) in result" :key="i">
                    <b v-if="r.name">{{r.name}}:</b>
                    <span>{{r.value}}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
export default {
    name: "ItemCard",
    data() {
        return {
            visible: false,
            argv: [],
            result: undefined,
        };
    },
    props: ["item", "hmy", "triger"],
    methods: {
        async methodTriger() {
            this.result = undefined;
            const argv = JSON.parse(`[${this.getMultiValsString}]`);
            this.result = await this.triger(this.item, argv);
        },
        makeMultiVal(val) {
            const argv = this.argv;
            let inputString = val;
            if (inputString) {
                inputString = inputString.replace(
                    /(^|,\s+|,)(\d+)(\s+,|,|$)/g,
                    '$1"$2"$3'
                ); // replace non quoted number by quoted number
                inputString = inputString.replace(
                    /(^|,\s+|,)(0[xX][0-9a-fA-F]+|one[0-9a-z]+)(\s+,|,|$)/g,
                    '$1"$2"$3'
                ); // replace non quoted hex string by quoted hex string
                const inputJSON = JSON.parse("[" + inputString + "]");
                for (let i = 0; i < this.item.inputs.length; i++) {
                    if (inputJSON[i]) {
                        this.$set(argv, i, JSON.stringify(inputJSON[i]));
                    }
                }
            }
            return argv;
        },
    },
    computed: {
        color() {
            return this.item.constant
                ? "info"
                : this.item.stateMutability == "payable" // this.item.payable
                ? "danger"
                : "warning";
        },
        singlePlaceholder() {
            let text = "";
            const item = this.item;
            for (let i = 0; i < item.inputs.length; i++) {
                const input = item.inputs[i];
                if (i > 0) text += ", ";
                text += `${input.type} ${input.name}`;
            }
            return text;
        },
        getMultiValsString() {
            const valArray = this.argv;
            let ret = "";
            const valArrayTest = [];
            for (let j = 0; j < valArray.length; j++) {
                if (ret !== "") ret += ",";
                let elVal = valArray[j];
                valArrayTest.push(elVal);
                elVal = elVal.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3'); // replace non quoted number by quoted number
                elVal = elVal.replace(
                    /(^|,\s+|,)(0[xX][0-9a-fA-F]+|one[0-9a-z]+)(\s+,|,|$)/g,
                    '$1"$2"$3'
                ); // replace non quoted hex string by quoted hex string
                try {
                    JSON.parse(elVal);
                } catch (e) {
                    elVal = '"' + elVal + '"';
                }
                ret += elVal;
            }
            const valStringTest = valArrayTest.join("");
            if (valStringTest) {
                return ret;
            } else {
                return "";
            }
        },
        singleValue: {
            set(value) {
                this.makeMultiVal(value);
            },
            get() {
                return this.getMultiValsString;
            },
        },
    },
};
</script>

<style scoped>
.lineItem {
    margin-top: 0.5em;
}
.button {
    min-width: 100px;
    width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px !important;
}
</style>