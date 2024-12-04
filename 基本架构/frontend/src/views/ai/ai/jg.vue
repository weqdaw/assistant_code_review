<template>
  <div>
    <iframe :src="embeddedPageUrl" width="100%" height="600px" frameborder="0"></iframe>
  </div>
</template>

<script>
export default {
  data() {
    return {
      embeddedPageUrl: 'http://localhost:9090/' // 知识图谱7800端口
    };
  }
};
</script>
