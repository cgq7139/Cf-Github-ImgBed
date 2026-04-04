<template>
  <div class="card upload-area">
    <h3>上传图片</h3>

    <!-- 拖拽区域 -->
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging }"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="drop-zone-content">
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="#909399"
        >
          <path
            d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
          />
        </svg>
        <p>拖拽图片到这里，或点击选择</p>
        <p class="hint">支持 JPG、PNG、GIF、WebP、BMP、SVG 格式，单文件最大 20MB</p>
      </div>
    </div>

    <!-- 粘贴提示 -->
    <div class="paste-hint">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="#909399"
      >
        <path
          d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3h-2v-3H8v-2h4V9h2v4h4v2z"
        />
      </svg>
      <p>提示：也可以使用 <kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴图片或图片链接</p>
    </div>

    <!-- 上传队列 - 只显示正在上传和失败的任务 -->
    <div
      v-if="activeUploads.length > 0"
      class="upload-queue"
    >
      <div class="queue-header">
        <h4>上传队列 ({{ activeUploads.length }})</h4>
        <button
          class="clear-btn"
          @click="clearFailed"
          v-if="hasFailed"
        >
          清除失败
        </button>
      </div>
      <div
        v-for="(item, index) in activeUploads"
        :key="item.id"
        class="upload-item"
      >
        <div class="upload-info">
          <div class="file-info">
            <span class="filename">{{ item.file.name }}</span>
            <span class="size">{{ formatSize(item.file.size) }}</span>
          </div>
          <button
            v-if="item.status !== 'uploading'"
            class="remove-btn"
            @click="removeFromQueue(item.id)"
            title="移除"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="{
              'progress-error': item.status === 'error',
            }"
            :style="{ width: item.progress + '%' }"
          ></div>
        </div>
        <div class="upload-status">
          <span
            v-if="item.status === 'uploading' && item.progress !== 100"
            class="status-uploading"
          >
            <span class="spinner"></span>
            上传中 {{ Math.floor(item.progress) }}%
          </span>
          <span
            v-if="item.status === 'uploading' && item.progress === 100"
            class="status-uploading"
          >
            <span class="spinner"></span>
            处理中...
          </span>
          <span
            v-if="item.status === 'error'"
            class="status-error"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
            {{ item.error }}
          </span>
        </div>
      </div>
    </div>

    <!-- 上传成功记录（临时显示） -->
    <div
      v-if="successRecords.length > 0"
      class="success-records"
    >
      <div class="success-header">
        <h4>上传成功 ({{ successRecords.length }})</h4>
        <button
          class="clear-btn"
          @click="clearSuccess"
        >
          清除全部
        </button>
      </div>
      <div
        v-for="(record, index) in successRecords"
        :key="record.id"
        class="success-record"
      >
        <div class="record-header">
          <span class="record-name">{{ record.file.name }}</span>
          <button
            class="remove-btn"
            @click="removeSuccessRecord(record.id)"
            title="移除"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div class="record-urls">
          <div class="url-item">
            <span class="url-label">原始地址:</span>
            <code>{{ record.urls.raw }}</code>
            <button
              class="copy-btn"
              @click="copyToClipboard(record.urls.raw)"
            >
              复制
            </button>
          </div>
          <div class="url-item">
            <span class="url-label">CDN地址:</span>
            <code>{{ record.urls.cdn }}</code>
            <button
              class="copy-btn"
              @click="copyToClipboard(record.urls.jsdelivr)"
            >
              复制
            </button>
          </div>
          <div class="url-item">
            <span class="url-label">加速地址:</span>
            <code>{{ record.urls.accelerated }}</code>
            <button
              class="copy-btn"
              @click="copyToClipboard(record.urls.accelerated)"
            >
              复制
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

  const props = defineProps({
    apiBase: {
      type: String,
      default: '/api',
    },
  });

  const emit = defineEmits(['upload-complete']);

  const fileInput = ref(null);
  const isDragging = ref(false);
  const uploadQueue = ref([]); // 存储所有上传任务
  const successRecords = ref([]); // 存储成功记录，用于显示链接

  // 计算属性：获取正在上传和失败的任务
  const activeUploads = computed(() => {
    return uploadQueue.value.filter((item) => item.status === 'uploading' || item.status === 'error');
  });

  // 计算是否有失败的任务
  const hasFailed = computed(() => {
    return uploadQueue.value.some((item) => item.status === 'error');
  });

  // 生成唯一ID
  const generateId = () => {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // 上传单个文件
  const uploadFile = async (file, queueItem, retryCount = 0) => {
    const MAX_RETRIES = 3; // 最大重试次数
    const RETRY_DELAY = 1000; // 重试延迟（毫秒）

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // 真实上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          queueItem.progress = percent;
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);

            if (data.success) {
              // 上传成功，从队列中移除
              const index = uploadQueue.value.findIndex((item) => item.id === queueItem.id);
              if (index !== -1) {
                uploadQueue.value.splice(index, 1);
              }

              successRecords.value.unshift({
                id: queueItem.id,
                file: file,
                urls: data.urls,
                timestamp: Date.now(),
                retryCount: retryCount, // 记录重试次数
              });

              emit('upload-complete');
              cocoMessage.success(`${file.name} 上传成功`);
              resolve(data);
            } else {
              // 服务器返回失败
              const error = new Error(data.error || 'Upload failed');
              handleRetry(error, file, queueItem, retryCount, resolve, reject);
            }
          } catch (error) {
            // JSON 解析失败
            handleRetry(error, file, queueItem, retryCount, resolve, reject);
          }
        } else {
          // HTTP 状态码错误
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          handleRetry(error, file, queueItem, retryCount, resolve, reject);
        }
      });

      xhr.addEventListener('error', () => {
        const error = new Error('网络错误');
        handleRetry(error, file, queueItem, retryCount, resolve, reject);
      });

      xhr.addEventListener('timeout', () => {
        const error = new Error('上传超时');
        handleRetry(error, file, queueItem, retryCount, resolve, reject);
      });

      // 设置超时时间（60秒，给重试留更多时间）
      xhr.timeout = 60000;

      const token = localStorage.getItem('adPwd');
      xhr.open('POST', `${__API_URL__}${props.apiBase}/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });

    // 重试处理函数
    function handleRetry(error, file, queueItem, currentRetry, resolve, reject) {
      if (currentRetry < MAX_RETRIES) {
        const nextRetry = currentRetry + 1;
        const delay = RETRY_DELAY * Math.pow(2, currentRetry); // 指数退避：1s, 2s, 4s

        queueItem.status = 'retrying';
        queueItem.error = `${error.message}，正在重试 (${nextRetry}/${MAX_RETRIES})...`;
        queueItem.progress = 0;

        cocoMessage.warning(`${file.name} ${queueItem.error}`);

        console.log(`重试上传: ${file.name}，第 ${nextRetry} 次重试，等待 ${delay}ms`);

        setTimeout(() => {
          uploadFile(file, queueItem, nextRetry).then(resolve).catch(reject);
        }, delay);
      } else {
        // 超过最大重试次数
        queueItem.status = 'error';
        queueItem.error = `${error.message}（已重试${MAX_RETRIES}次）`;
        cocoMessage.error(`${file.name} 上传失败: ${queueItem.error}`);
        reject(error);
      }
    }
  };

  // 添加上传任务
  const addToQueue = (files) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showWarningToast(`${file.name} 不是图片文件，已跳过`);
        continue;
      }

      const queueItem = reactive({
        id: generateId(),
        file,
        progress: 0,
        status: 'uploading',
        error: '',
      });

      uploadQueue.value.push(queueItem);

      // 执行上传
      uploadFile(file, queueItem).catch((error) => {
        queueItem.status = 'error';
        queueItem.error = error.message;
        cocoMessage.error(`${file.name} 上传失败: ${error.message}`);
      });
    }
  };

  // 从队列中移除（用于失败的任务）
  const removeFromQueue = (id) => {
    const index = uploadQueue.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      uploadQueue.value.splice(index, 1);
    }
  };

  // 清除所有失败的任务
  const clearFailed = () => {
    uploadQueue.value = uploadQueue.value.filter((item) => item.status === 'uploading');
    cocoMessage.success('✓ 已清除失败的任务');
  };

  // 清除所有成功记录
  const clearSuccess = () => {
    successRecords.value = [];
    cocoMessage.success('✓ 已清除成功记录');
  };

  // 移除单条成功记录
  const removeSuccessRecord = (id) => {
    const index = successRecords.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      successRecords.value.splice(index, 1);
    }
  };

  // 拖拽事件处理
  const handleDragEnter = (e) => {
    e.preventDefault();
    isDragging.value = true;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    isDragging.value = false;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    isDragging.value = false;
    const files = Array.from(e.dataTransfer.files);
    addToQueue(files);
  };

  // 文件选择处理
  const triggerFileInput = () => {
    fileInput.value.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addToQueue(files);
    e.target.value = '';
  };

  // 粘贴处理
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const files = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString(async (text) => {
          const urlPattern = /^https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
          if (urlPattern.test(text)) {
            try {
              cocoMessage.info('⏳ 正在获取图片...');
              const response = await fetch(text);
              const blob = await response.blob();
              const filename = text.split('/').pop().split('?')[0] || 'image.jpg';
              const file = new File([blob], filename, { type: blob.type });
              addToQueue([file]);
            } catch (err) {
              cocoMessage.error('✗ 获取图片失败');
            }
          }
        });
      }
    }

    if (files.length > 0) {
      addToQueue(files);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      cocoMessage.success('✓ 链接已复制');
    } catch (err) {
      cocoMessage.error('✗ 复制失败，请手动复制');
    }
  };

  // 成功提示
  const showSuccessToast = (filename) => {
    cocoMessage.success(`✓ ${filename} 上传成功`);
  };

  // 失败提示
  const showErrorToast = (filename, errorMsg) => {
    cocoMessage.error(`✗ ${filename} 上传失败: ${errorMsg}`);
  };

  // 其他提示
  const showWarningToast = (message) => {
    cocoMessage.warning(message);
  };

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  onMounted(() => {
    document.addEventListener('paste', handlePaste);
  });

  onUnmounted(() => {
    document.removeEventListener('paste', handlePaste);
  });
</script>

<style scoped>
  .upload-area h3 {
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .drop-zone {
    border: 2px dashed #dcdfe6;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafafa;
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    border-color: #409eff;
    background: #ecf5ff;
  }

  .drop-zone-content svg {
    margin-bottom: 1rem;
  }

  .drop-zone-content p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.8rem;
    color: #909399;
  }

  .paste-hint {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f5f7fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    font-size: 0.85rem;
    color: #606266;
  }

  .paste-hint kbd {
    display: inline-block;
    padding: 0.2rem 0.4rem;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.75rem;
  }

  .upload-queue {
    margin-top: 1.5rem;
  }

  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .queue-header h4 {
    font-weight: 500;
  }

  .clear-btn {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    background: #f5f7fa;
    border-color: #c0c4cc;
  }

  .upload-item {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.2s;
  }

  .upload-item:hover {
    background: #f0f2f5;
  }

  .upload-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    align-items: center;
  }

  .file-info {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    flex-wrap: wrap;
  }

  .filename {
    font-weight: 500;
    word-break: break-all;
    font-size: 0.9rem;
  }

  .size {
    color: #909399;
    font-size: 0.75rem;
  }

  .remove-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #909399;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
  }

  .remove-btn:hover {
    background: #e4e7ed;
    color: #f56c6c;
  }

  .progress-bar {
    height: 6px;
    background: #e4e7ed;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: #409eff;
    transition: width 0.3s;
  }

  .progress-fill.progress-error {
    background: #f56c6c;
  }

  .upload-status {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-uploading {
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #e4e7ed;
    border-top-color: #409eff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status-error {
    color: #f56c6c;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  /* 成功记录样式 */
  .success-records {
    margin-top: 1.5rem;
    border-top: 1px solid #e4e7ed;
    padding-top: 1rem;
  }

  .success-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .success-header h4 {
    font-weight: 500;
    color: #67c23a;
  }

  .success-record {
    background: #f0f9eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    border-left: 3px solid #67c23a;
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .record-name {
    font-weight: 500;
    color: #2c3e50;
  }

  .record-urls {
    font-size: 0.75rem;
  }

  .url-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .url-label {
    color: #606266;
    min-width: 70px;
    font-size: 0.7rem;
  }

  .url-item code {
    background: #fff;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.7rem;
    word-break: break-all;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: #67c23a;
    color: white;
    border-color: #67c23a;
  }
</style>
