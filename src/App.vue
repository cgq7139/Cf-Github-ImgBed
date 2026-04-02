<template>
  <div
    class="container"
    :style="{ padding: isLoggedIn ? '1rem' : '0' }"
  >
    <div v-if="!isLoggedIn">
      <Login @login-success="handleLoginSuccess" />
    </div>
    <div v-else>
      <header class="header">
        <h1>图床服务站</h1>
        <button
          class="btn"
          @click="logout"
        >
          退出登录
        </button>
      </header>
      <ImageUpload
        @upload-complete="refreshImages"
        :api-base="apiBase"
      />
      <ImageList
        ref="imageListRef"
        :api-base="apiBase"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { showConfirmDialog, showToast } from 'vant';
  import Login from './components/Login.vue';
  import ImageUpload from './components/ImageUpload.vue';
  import ImageList from './components/ImageList.vue';

  const isLoggedIn = ref(false);
  const apiBase = ref('/api');
  const imageListRef = ref();

  const handleLoginSuccess = () => {
    isLoggedIn.value = true;
    showToast({
      message: '登录成功',
      type: 'success',
      duration: 1500,
    });
  };

  const logout = async () => {
    try {
      await showConfirmDialog({
        title: '确认退出',
        message: '确定要退出登录吗？',
        confirmButtonText: '退出',
      });
      localStorage.removeItem('adPwd');
      isLoggedIn.value = false;
      showToast({
        message: '已退出登录',
        type: 'success',
        duration: 1500,
      });
    } catch (error) {
      // 用户取消退出
    }
  };

  const refreshImages = () => {
    if (imageListRef.value) {
      imageListRef.value.fetchImages();
    }
  };
</script>

<style scoped>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e4e7ed;
  }

  .header h1 {
    font-size: 1.8rem;
    font-weight: 500;
  }
</style>
