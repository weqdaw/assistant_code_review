<template>
  <div>
    <iframe :src="embeddedPageUrl" width="100%" height="600px" frameborder="0"></iframe>
  </div>
</template>

<script>
export default {
  data() {
    return {
      embeddedPageUrl: 'http://localhost:8002/' // 这里填写你的AI服务地址:8002
    };
  }
};
</script>