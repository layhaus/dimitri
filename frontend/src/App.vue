<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import PublicLayout from './layouts/PublicLayout.vue'

const route = useRoute()
const layout = computed(() => route.meta.layout === 'public' ? PublicLayout : DefaultLayout)
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
