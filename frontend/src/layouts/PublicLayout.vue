<template>
  <div class="public-layout">
    <div class="public-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  padding: var(--space-8);
}

.public-layout__content {
  width: 100%;
  max-width: 420px;
  animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
