<template>
  <div>
    <iframe :src="embeddedPageUrl" width="100%" height="600px" frameborder="0"></iframe>
  </div>
</template>

<script>
export default {
  data() {
    return {
      embeddedPageUrl: 'http://localhost:3000/' // 替换为需要内嵌的页面的URL
    };
  }
};
</script>
