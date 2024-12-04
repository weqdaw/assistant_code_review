<template>
    <div>
      <iframe :src="embeddedPageUrl" width="100%" height="600px" frameborder="0"></iframe>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        embeddedPageUrl: 'http://localhost:1234/' // 协作开发端口
      };
    }
  };
  </script>
  