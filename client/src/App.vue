<!-- client/src/App.vue -->
<template>
  <div id="app">
    <nav class="global-nav">
      <span class="nav-brand">极速购 AI 客服</span>
      <div class="nav-links">
        <router-link to="/">基础对话</router-link>
        <router-link to="/agent">订单查询</router-link>
        <router-link to="/rag">知识库</router-link>
        <router-link to="/graph">智能中枢</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, 'PingFang SC', sans-serif; background: #f8fafc; }

.global-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: #1e293b;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-brand {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.nav-links {
  display: flex;
  gap: 4px;
}
.nav-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all .15s;
}
.nav-links a:hover        { color: #fff; background: #334155; }
.nav-links a.router-link-active { color: #fff; background: #2563eb; }

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
#app > .router-view,
#app > div:not(.global-nav) {
  flex: 1;
  overflow: hidden;
}
</style>
