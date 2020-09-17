import Vue from 'vue'

import BootstrapVue from 'bootstrap-vue'
//import 'bootstrap/dist/css/bootstrap.min.css'
//import 'bootstrap-vue/dist/bootstrap-vue.css'

const smallSize = { size: "sm" };

const config = {
    formControls: smallSize,
    BForm: smallSize,
    BFormText: smallSize,
    BFormGroup: smallSize,
    BFormSelect: smallSize,
    BButton: smallSize,
    BDropdown: smallSize,
    BInputGroup: smallSize,
    BInput: smallSize,
    BModal: smallSize,
    BPagination: smallSize,
    BPaginationNav: smallSize,
};
Vue.use(BootstrapVue, config)


import { IconsPlugin } from 'bootstrap-vue'
Vue.use(IconsPlugin)
