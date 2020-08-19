<template>
    <b-card>
        <b-button @click="click" :variant="color">{{ item.name?item.name:'DEPLOY' }}</b-button>
        <b-collapse v-if="item.inputs.length" v-model="visible" class="mt-2">
            <b-input-group
                v-for="(input,index) in item.inputs"
                :key="index"
                :prepend="input.name?input.name:String(index)"
            >
                <b-form-input v-model="argv[index]" :placeholder="input.type" />
            </b-input-group>
            <b-button @click="methodTriger" :variant="color">{{ item.name?item.name:'DEPLOY' }}</b-button>
        </b-collapse>
        <div v-if="result">
            <ul start="0">
                <li v-for="(r,i) in result" :key="i">
                    <b v-if="r.name">{{r.name}}:</b>
                    <span>{{r.value}}</span>
                </li>
            </ul>
        </div>
    </b-card>
</template>

<script>
export default {
    name: "ItemCard",
    data() {
        console.log("card:", this.item);
        return {
            visible: false,
            argv: [],
            result: undefined,
        };
    },
    props: ["item", "hmy", "triger"],
    methods: {
        click() {
            if (this.item.inputs.length > 0) this.visible = !this.visible;
            else this.methodTriger();
        },
        async methodTriger() {
            this.result = undefined;
            const argv = [];
            for (let i = 0; i < this.item.inputs.length; i++) {
                const input = this.item.inputs[i];
                let arg = this.argv[i];
                if (input.type.slice(-2) == "[]") arg = JSON.parse(arg);
                argv.push(arg);
            }
            this.result = await this.triger(this.item, argv);
        },
    },
    computed: {
        color() {
            return this.item.constant
                ? "info"
                : this.item.payable
                ? "danger"
                : "warning";
        },
    },
};
</script>