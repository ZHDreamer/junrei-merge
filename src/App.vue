<script setup lang="ts">
import ImageMerge from "./components/ImageMerge.vue"
</script>

<template>
    <div class="container">
        <header>
            <h1>巡礼对比图生成器</h1>
        </header>
        <ImageMerge />
    </div>
</template>

<style scoped>
header {
    text-align: center;
    margin: 20px 0;
    display: block;
}
</style>
