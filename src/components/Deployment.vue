<template>
    <b-list-group>
        <b-list-group-item>
            <b-form>
                <Networks :disabled="busy" @networkChange="networkChange" />
                <b-form-group :disabled="busy" label-size="sm" label="Wallet:">
                    <b-form-select v-model="selectWallet" :options="wallets"></b-form-select>
                </b-form-group>
                <b-form-group :disabled="busy" label-size="sm">
                    <template v-slot:label>
                        <span stype="padding-right:'0.2em'">Account:</span>
                        <b-icon icon="plus-circle-fill" @click="addAccount"></b-icon>
                    </template>
                    <b-form-select v-model="selected" :options="accounts" />
                </b-form-group>
                <b-form-group label-size="sm" label="GasLimit:">
                    <b-form-input v-model="gasLimit" />
                </b-form-group>
                <b-form-group label-size="sm" label="GasPrice:">
                    <b-input-group append="wei">
                        <b-form-input v-model="gasPrice" />
                    </b-input-group>
                </b-form-group>
                <b-form-group label-size="sm" label="Value:">
                    <b-input-group>
                        <b-form-input v-model="callValue" @change="valueChange" />
                        <b-input-group-append>
                            <b-form-select v-model="uint" :options="uints" @change="valueChange" />
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>
            </b-form>
        </b-list-group-item>
        <b-list-group-item>
            <b-form>
                <b-form-group
                    label-size="sm"
                    :disabled="!compiledData"
                    label="Contract:"
                    :description="compiledData?'':'NO COMPILED CONTRACT'"
                >
                    <b-form-select v-model="contract" :options="contracts"></b-form-select>
                    <ItemCard v-if="abiConstractor" :item="abiConstractor" :triger="deploy" />
                </b-form-group>
                <b-form-group label-size="sm" :disabled="!compiledData" label="Or">
                    <b-input-group>
                        <b-input-group-prepend>
                            <b-button @click="contractAt" variant="info">AT</b-button>
                        </b-input-group-prepend>
                        <b-form-input
                            v-model="contractAddress"
                            placeholder="Load contract from Address"
                        ></b-form-input>
                    </b-input-group>
                </b-form-group>
            </b-form>
        </b-list-group-item>
        <b-list-group-item>
            <b-form>
                <b-form-group :disabled="busy || accounts.length == 0" label-size="sm" label="Deployed Contracts:">
                    <ContractInstance
                        v-for="(instance,index) in contractInstances"
                        :key="instance.contract.address"
                        :abi="instance.abi"
                        :hmy="hmy"
                        :contract="instance.contract"
                        @close="removeInstance(instance,index)"
                    />
                </b-form-group>
            </b-form>
        </b-list-group-item>
    </b-list-group>
</template>

<script>
import ContractInstance from "./ContractInstance.vue";
import ItemCard from "./ItemCard.vue";
import Networks from "./Networks.vue";
import { onSolidity, log, error } from "../js/remixClient";
import { short } from "../js/filter";
import { MathWallet, OneWallet, walletActived, switchWallet } from "../js/hmy";

export default {
    name: "Deployment",
    components: {
        ContractInstance,
        ItemCard,
        Networks,
    },
    data() {
        onSolidity((fileName, source, languageVersion, data) => {
            this.compiledData = data.contracts;
            this.entryFile = fileName;
        });
        return {
            busyCount: 0,
            ind: 0,
            hmy: null,
            entryFile: null,
            compiledData: null,
            wallets: [
                {
                    value: OneWallet,
                    text: "Harmony One Wallet",
                },
                {
                    value: MathWallet,
                    text: "Math Wallet",
                },
                {
                    value: 2,
                    text: "Import Private Key",
                    disabled: true,
                },
            ],
            selectWallet: walletActived,
            selected: 0,
            accounts: [],
            uints: [
                { text: "one", value: "one" },
                { text: "wei", value: "wei" },
            ],
            uint: "wei",
            gasLimit: parseInt(this.$store.data.gasLimit),
            gasPrice: parseInt(this.$store.data.gasPrice),
            callValue: parseInt(this.$store.data.callValue),
            contract: null,
            contractAddress: null,
            contractInstances: [],
        };
    },
    computed: {
        contracts() {
            if (this.compiledData == null) return [];
            const result = [];
            for (const filename in this.compiledData) {
                const file = this.compiledData[filename];
                for (const contractName in file)
                    result.push({
                        text: `${contractName} - ${filename}`,
                        value: { filename, contractName },
                    });
            }
            return result;
        },
        abi() {
            if (this.compiledData == null || this.contract == null) return [];
            return this.compiledData[this.contract.filename][
                this.contract.contractName
            ].abi;
        },
        evmCode() {
            return this.compiledData[this.contract.filename][
                this.contract.contractName
            ].evm.bytecode.object;
        },
        abiConstractor() {
            if (this.abi.length == 0) return null;
            for (const i in this.abi) {
                const item = this.abi[i];
                if (item.type == "constructor") return item;
            }
            return { type: "constructor", inputs: [] };
        },
        busy: {
            set(busy) {
                this.busyCount += busy ? 1 : -1;
            },
            get() {
                return this.busyCount > 0;
            },
        },
    },
    watch: {
        selectWallet() {
            switchWallet(this.selectWallet);
            this.addAccount();
        },
        contracts() {
            this.contract = this.contracts[0].value;
        },
        gasLimit() {
            const hmy = this.hmy;
            const orignNum = new hmy.utils.Unit(this.gasLimit);
            this.$store.data.gasLimit = orignNum.asWei().toHex();
        },
        gasPrice() {
            const hmy = this.hmy;
            const orignNum = new hmy.utils.Unit(this.gasPrice);
            this.$store.data.gasPrice = orignNum.asWei().toHex();
        },
    },
    methods: {
        async networkChange(_hmy) {
            this.hmy = _hmy;
            if (this.accounts.length > 0) await this.updateBalance(this.accounts[0].account);
            // else await this.addAccount();
        },
        async contractAt() {
            if (this.accounts.length == 0) await this.addAccount();
            const hmy = this.hmy;
            const contract = hmy.ContractAt(this.abi, this.contractAddress);
            window.c = contract;
            this.contractInstances.push({
                abi: this.abi,
                contract,
                hmy,
            });
        },
        async deploy(item, argv) {
            try {
                return await this._deploy(item, argv);
            } catch (e) {
                const invalid =
                    e.toString() == "[object Object]" || e.toString() == "";
                error(invalid ? e : e.toString());
            }
        },
        async _deploy(item, argv) {
            if (this.accounts.length == 0) await this.addAccount();
            const hmy = this.hmy;
            const deployInstance = hmy.ContractDeploy(
                this.abi,
                "0x" + this.evmCode,
                argv
            );
            const contract = deployInstance.contract;
            window.c = contract;
            const from = contract.options.from;
            await deployInstance.send({ from, ...this.$store.txConfig() });
            log({
                type: "contract deploy",
                tx: deployInstance.transaction.id,
                sender: hmy.crypto.toBech32(from),
                contract: {
                    status: contract.status,
                    ...this.contract,
                    address: hmy.crypto.toBech32(contract.address),
                },
            });
            this.contractInstances.push({
                abi: this.abi,
                contract,
                hmy,
            });
            if (contract.status != "deployed") {
                deployInstance
                    .call({ from, ...this.$store.txConfig() })
                    .then((code) => log(code))
                    .catch((err) => error(err));
            }
        },
        async updateBalance(account) {
            this.busy = true;
            try {
                const hmy = this.hmy;
                const resp = await hmy.blockchain.Account.getBalance(
                    account.address,
                    "latest"
                );
                account.balance = resp.result;
                const one = (parseInt(account.balance) / 1e18).toFixed(2);
                this.$set(this.accounts, 0, {
                    value: 0,
                    account,
                    text: `${short(account.address)}(${one} one)`,
                });
            } catch (e) {
                this.accounts = [];
            }
            this.busy = false;
        },
        async addAccount() {
            const hmy = this.hmy;
            if (hmy == null) return;
            this.busy = true;
            try {
                await hmy.logout();
                const account = await hmy.login();
                await this.updateBalance(account);
            } catch (e) {
                this.accounts = [];
            }
            this.busy = false;
        },
        valueChange() {
            const hmy = this.hmy;
            const orignNum = new hmy.utils.Unit(this.callValue);
            if (this.uint == "one")
                this.$store.data.callValue = orignNum.asOne().toHex();
            else this.$store.data.callValue = orignNum.asWei().toHex();
        },
        removeInstance(instance, index) {
            this.contractInstances.splice(index, 1);
        },
    },
};
</script>
