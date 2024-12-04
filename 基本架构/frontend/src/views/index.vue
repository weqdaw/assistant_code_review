<template>
  <div class="app-container">
    <div class="splash-screen" :class="{ 'fade-out': !isLoading }">
      <div class="logo-container">
        <div class="logo">T</div>
      </div>
    </div>
    
    <main class="main-content" :class="{ 'fade-in': !isLoading }">
      <h1 class="title">TechMind</h1>
      <p class="subtitle">智能工程助手</p>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isLoading: true
    }
  },
  mounted() {
    setTimeout(() => {
      this.isLoading = false
    }, 2000)
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f5f5f7;
  color: #1d1d1f;
}

.app-container {
  min-height: 100vh;
  position: relative;
}

.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #f5f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  transition: opacity 0.5s ease-out;
}

.splash-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.logo-container {
  width: 80px;
  height: 80px;
  background: #fff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  font-size: 40px;
  font-weight: bold;
  color: #1d1d1f;
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.5s ease-in;
  padding: 20px;
}

.main-content.fade-in {
  opacity: 1;
}

.title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(45deg, #06c, #53a6ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 24px;
  color: #515154;
  font-weight: 300;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
