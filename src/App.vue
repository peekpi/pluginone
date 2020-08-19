<template>
  <div id="app">
    <Deployment/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Deployment from './components/Deployment.vue';

export default Vue.extend({
  name: 'App',
  components: {
    Deployment
  }
});
</script>
