<template>
    <div>
      <iframe :src="embeddedPageUrl" width="100%" height="600px" frameborder="0"></iframe>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        embeddedPageUrl: 'http://localhost:7000/' // 项目总结7000
      };
    }
  };
  </script>
  