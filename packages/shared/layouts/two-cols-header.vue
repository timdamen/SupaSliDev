<template>
  <div class="slidev-layout two-cols-header">
    <div class="header">
      <slot name="header" />
    </div>
    <div class="columns">
      <div class="col-left">
        <slot name="left" />
      </div>
      <div class="col-right">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.two-cols-header {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  gap: 1.5rem;
}

.header {
  flex-shrink: 0;
}

.header :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

.col-left,
.col-right {
  overflow: auto;
}
</style>
