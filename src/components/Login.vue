<template>
  <div class="login-container">
    <div class="login-card">
      <h2>管理员登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input
            type="password"
            v-model="password"
            placeholder="请输入管理员密码"
            autocomplete="off"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div
          v-if="error"
          class="error"
        >
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const emit = defineEmits(['login-success']);

  const password = ref('');
  const loading = ref(false);
  const error = ref('');

  const handleLogin = async () => {
    if (!password.value) {
      error.value = '请输入密码';
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const response = await fetch(__API_URL__ + '/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.value }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adPwd', password.value);
        emit('login-success');
      } else {
        error.value = '密码错误';
      }
    } catch (err) {
      error.value = '登录失败，请稍后重试';
    } finally {
      loading.value = false;
    }
  };

  (async () => {
    const adPwd = localStorage.getItem('adPwd');
    if (adPwd) {
      password.value = adPwd;
      await handleLogin();
    }
  })();
</script>

<style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f7fa;
  }

  .login-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .login-card h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 1rem;
  }

  .btn-primary {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
  }

  .error {
    margin-top: 1rem;
    text-align: center;
  }
</style>
