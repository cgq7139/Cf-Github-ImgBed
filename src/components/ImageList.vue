<template>
  <div class="card image-list">
    <div class="list-header">
      <h3>图片列表</h3>
      <div class="header-actions">
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            title="网格视图"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"
              />
            </svg>
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="列表视图"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"
              />
            </svg>
          </button>
        </div>
        <button
          class="btn"
          @click="fetchImages"
          :disabled="loading"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            style="margin-right: 4px"
          >
            <path
              fill="currentColor"
              d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          刷新
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div
      v-else-if="images.length === 0"
      class="empty"
    >
      <svg
        viewBox="0 0 24 24"
        width="48"
        height="48"
        fill="#c0c4cc"
      >
        <path
          d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17 7h-5v2h5V7zm0 4h-5v2h5v-2zm0 4h-5v2h5v-2zM9 7H7v2h2V7zm0 4H7v2h2v-2zm0 4H7v2h2v-2z"
        />
      </svg>
      <p>暂无图片，开始上传吧</p>
    </div>

    <template v-if="!loading">
      <!-- 网格视图 -->
      <div
        v-if="viewMode === 'grid'"
        class="image-grid"
      >
        <div
          v-for="image in images"
          :key="image.path"
          class="image-card"
        >
          <div
            class="image-preview"
            @click="previewImg(image)"
          >
            <img
              :src="image.cdnUrl"
              :alt="image.name"
              loading="lazy"
            />
            <div class="image-overlay">
              <span class="preview-icon">🔍</span>
            </div>
          </div>
          <div class="image-info">
            <div
              class="image-name"
              :title="image.name"
            >
              {{ image.name }}
            </div>
            <div class="image-date">{{ formatDate(image.uploadTime) }}</div>
            <div class="image-actions">
              <button
                class="action-btn"
                @click="copyUrl(image.rawUrl, '原始地址')"
                title="复制原始地址"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    fill="currentColor"
                    d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                  />
                </svg>
              </button>
              <button
                class="action-btn"
                @click="copyUrl(image.cdnUrl, 'CDN地址')"
                title="复制CDN地址"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    fill="currentColor"
                    d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.71-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                  />
                </svg>
              </button>
              <button
                class="action-btn"
                @click="copyUrl(image.acceleratedUrl, '加速地址')"
                title="复制加速地址"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    fill="currentColor"
                    d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.71-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                  />
                </svg>
              </button>
              <button
                class="action-btn delete-btn"
                @click="deleteImage(image)"
                title="删除"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    fill="currentColor"
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div
        v-if="viewMode === 'list'"
        class="image-list-view"
      >
        <div
          v-for="image in images"
          :key="image.path"
          class="list-item"
        >
          <div
            class="list-item-preview"
            @click="previewImg(image)"
          >
            <img
              :src="image.cdnUrl"
              :alt="image.name"
              loading="lazy"
            />
          </div>
          <div class="list-item-info">
            <div
              class="list-item-name"
              :title="image.name"
            >
              {{ image.name }}
            </div>
            <div class="list-item-date">{{ formatDate(image.uploadTime) }}</div>
            <div class="list-item-urls">
              <span
                class="url-badge"
                @click="copyUrl(image.rawUrl, '原始地址')"
                >Raw</span
              >
              <span
                class="url-badge"
                @click="copyUrl(image.cdnUrl, 'CDN地址')"
                >CDN</span
              >
              <span
                class="url-badge"
                @click="copyUrl(image.acceleratedUrl, '加速地址')"
                >加速</span
              >
            </div>
          </div>
          <div class="list-item-actions">
            <button
              class="action-btn"
              @click="copyUrl(image.rawUrl, '原始地址')"
              title="复制原始地址"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path
                  fill="currentColor"
                  d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                />
              </svg>
            </button>
            <button
              class="action-btn delete-btn"
              @click="deleteImage(image)"
              title="删除"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path
                  fill="currentColor"
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 自定义图片预览模态框（支持滚轮缩放） -->
    <div
      v-if="showCustomPreview"
      class="custom-preview-modal"
      @click="closePreview"
    >
      <div
        class="preview-container"
        @click.stop
      >
        <div class="preview-toolbar">
          <span class="zoom-info">{{ Math.round(zoomLevel * 100) }}%</span>
          <button
            class="toolbar-btn"
            @click="resetZoom"
            title="重置"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
              />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            @click="zoomOut"
            title="缩小"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M19 13H5v-2h14v2z"
              />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            @click="zoomIn"
            title="放大"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            @click="prevImage"
            title="上一张"
            v-if="images.length > 1"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
              />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            @click="nextImage"
            title="下一张"
            v-if="images.length > 1"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
              />
            </svg>
          </button>
          <button
            class="toolbar-btn close-btn"
            @click="closePreview"
            title="关闭"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div
          class="preview-image-wrapper"
          ref="previewWrapper"
        >
          <img
            ref="previewImage"
            :src="currentPreviewUrl"
            :alt="currentPreviewName"
            :style="{
              transform: `scale(${zoomLevel})`,
              cursor: zoomLevel > 1 ? 'grab' : 'default',
            }"
            @wheel.prevent="handleWheel"
            @mousedown="startDrag"
            @mousemove="drag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            :class="{ dragging: isDragging }"
          />
        </div>
        <div
          class="preview-counter"
          v-if="images.length > 1"
        >
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { showConfirmDialog } from 'vant';

  const props = defineProps({
    apiBase: {
      type: String,
      default: '/api',
    },
  });

  const images = ref([]);
  const loading = ref(false);
  const viewMode = ref('grid');

  // 自定义预览相关
  const showCustomPreview = ref(false);
  const currentPreviewUrl = ref('');
  const currentPreviewName = ref('');
  const currentIndex = ref(0);
  const zoomLevel = ref(1);
  const previewWrapper = ref(null);
  const previewImage = ref(null);

  // 拖拽相关
  let isDragging = ref(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let translateX = 0;
  let translateY = 0;

  // 格式化日期
  const formatDate = (timestamp) => {
    if (!timestamp) return '未知时间';
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取图片列表
  const fetchImages = async () => {
    loading.value = true;
    try {
      const token = localStorage.getItem('adPwd');
      const response = await fetch(`${__API_URL__}${props.apiBase}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取图片列表失败');
      }

      const data = await response.json();
      images.value = data.images;
    } catch (error) {
      cocoMessage.error(`✗ ${error.message}`);
    } finally {
      loading.value = false;
    }
  };

  // 删除图片
  const deleteImage = async (image) => {
    try {
      await showConfirmDialog({
        title: '确认删除',
        message: `确定要删除 "${image.name}" 吗？`,
        confirmButtonText: '删除',
        confirmButtonColor: '#f56c6c',
      });

      const token = localStorage.getItem('adPwd');
      const response = await fetch(`${__API_URL__}${props.apiBase}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path: image.path }),
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      cocoMessage.success('✓ 删除成功');

      await fetchImages();
    } catch (error) {
      if (error !== 'cancel') {
        cocoMessage.error(`✗ ${error.message || '删除失败'}`);
      }
    }
  };

  // 复制链接
  const copyUrl = async (url, type) => {
    try {
      await navigator.clipboard.writeText(url);
      cocoMessage.success(`✓ ${type}已复制`);
    } catch (err) {
      cocoMessage.error('✗ 复制失败，请手动复制');
    }
  };

  // 预览图片（使用自定义预览）
  const previewImg = (image) => {
    currentIndex.value = images.value.findIndex((img) => img.path === image.path);
    currentPreviewUrl.value = image.acceleratedUrl;
    currentPreviewName.value = image.name;
    zoomLevel.value = 1;
    translateX = 0;
    translateY = 0;
    showCustomPreview.value = true;
  };

  // 上一张
  const prevImage = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      currentPreviewUrl.value = images.value[currentIndex.value].acceleratedUrl;
      currentPreviewName.value = images.value[currentIndex.value].name;
      resetZoom();
    } else {
      cocoMessage.info('已是第一张');
    }
  };

  // 下一张
  const nextImage = () => {
    if (currentIndex.value < images.value.length - 1) {
      currentIndex.value++;
      currentPreviewUrl.value = images.value[currentIndex.value].acceleratedUrl;
      currentPreviewName.value = images.value[currentIndex.value].name;
      resetZoom();
    } else {
      cocoMessage.info('已是最后一张');
    }
  };

  // 放大
  const zoomIn = () => {
    if (zoomLevel.value < 3) {
      zoomLevel.value += 0.25;
    } else {
      cocoMessage.info('已达到最大放大倍数');
    }
  };

  // 缩小
  const zoomOut = () => {
    if (zoomLevel.value > 0.25) {
      zoomLevel.value -= 0.25;
      if (zoomLevel.value === 1) {
        translateX = 0;
        translateY = 0;
      }
    } else {
      cocoMessage.info('已达到最小缩小倍数');
    }
  };

  // 重置缩放
  const resetZoom = () => {
    zoomLevel.value = 1;
    translateX = 0;
    translateY = 0;
    if (previewImage.value) {
      previewImage.value.style.transform = `translate(0px, 0px) scale(1)`;
    }
  };

  // 鼠标滚轮缩放
  const handleWheel = (e) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = zoomLevel.value + delta;
    if (newZoom >= 0.25 && newZoom <= 3) {
      zoomLevel.value = newZoom;
    }
  };

  // 开始拖拽
  const startDrag = (e) => {
    if (zoomLevel.value <= 1) return;
    isDragging.value = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    if (previewImage.value) {
      previewImage.value.style.cursor = 'grabbing';
    }
  };

  // 拖拽中
  const drag = (e) => {
    if (!isDragging.value || zoomLevel.value <= 1) return;
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;

    // 限制拖拽范围
    const maxTranslate = 100;
    translateX = Math.min(Math.max(translateX, -maxTranslate), maxTranslate);
    translateY = Math.min(Math.max(translateY, -maxTranslate), maxTranslate);

    if (previewImage.value) {
      previewImage.value.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel.value})`;
    }
  };

  // 结束拖拽
  const endDrag = () => {
    isDragging.value = false;
    if (previewImage.value) {
      previewImage.value.style.cursor = 'grab';
    }
  };

  // 关闭预览
  const closePreview = () => {
    showCustomPreview.value = false;
    resetZoom();
  };

  // 键盘事件处理
  const handleKeydown = (e) => {
    if (!showCustomPreview.value) return;

    switch (e.key) {
      case 'ArrowLeft':
        prevImage();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case 'Escape':
        closePreview();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        resetZoom();
        break;
    }
  };

  onMounted(() => {
    fetchImages();
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  defineExpose({
    fetchImages,
  });
</script>

<style scoped>
  .image-list h3 {
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background: #f5f7fa;
    border-radius: 6px;
    padding: 0.25rem;
  }

  .view-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #909399;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-btn:hover {
    background: #e4e7ed;
  }

  .view-btn.active {
    background: white;
    color: #409eff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* 网格视图样式 */
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.25rem;
  }

  .image-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
  }

  .image-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .image-preview {
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    background: #f5f7fa;
    cursor: pointer;
  }

  .image-preview img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .image-card:hover .image-preview img {
    transform: scale(1.05);
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .image-preview:hover .image-overlay {
    opacity: 1;
  }

  .preview-icon {
    color: white;
    font-size: 2rem;
    background: rgba(0, 0, 0, 0.6);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-info {
    padding: 1rem;
  }

  .image-name {
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #2c3e50;
  }

  .image-date {
    font-size: 0.7rem;
    color: #909399;
    margin-bottom: 0.75rem;
  }

  .image-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: space-around;
  }

  .action-btn {
    padding: 0.5rem;
    background: #f5f7fa;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #606266;
    flex: 1;
  }

  .action-btn:hover {
    background: #e4e7ed;
    transform: translateY(-1px);
  }

  .delete-btn:hover {
    background: #fef0f0;
    color: #f56c6c;
  }

  /* 列表视图样式 */
  .image-list-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fafafa;
    border-radius: 10px;
    transition: all 0.2s;
    border: 1px solid #f0f0f0;
  }

  .list-item:hover {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateX(4px);
  }

  .list-item-preview {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: #e4e7ed;
    flex-shrink: 0;
    cursor: pointer;
  }

  .list-item-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .list-item-info {
    flex: 1;
    min-width: 0;
  }

  .list-item-name {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-item-date {
    font-size: 0.7rem;
    color: #909399;
    margin-bottom: 0.5rem;
  }

  .list-item-urls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .url-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    color: #606266;
  }

  .url-badge:hover {
    background: #409eff;
    border-color: #409eff;
    color: white;
  }

  .list-item-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .list-item-actions .action-btn {
    padding: 0.5rem;
    min-width: 36px;
  }

  /* 自定义预览模态框 */
  .custom-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .preview-toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 40px;
    padding: 8px 16px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
    z-index: 2001;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .zoom-info {
    color: white;
    font-size: 12px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    margin-right: auto;
  }

  .toolbar-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .close-btn:hover {
    background: #f56c6c;
  }

  .preview-image-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  .preview-image-wrapper img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    transition: transform 0.1s ease;
    user-select: none;
    -webkit-user-drag: none;
  }

  .preview-image-wrapper img.dragging {
    cursor: grabbing;
  }

  .preview-counter {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    padding: 6px 12px;
    border-radius: 20px;
    color: white;
    font-size: 12px;
    z-index: 2001;
  }

  /* 加载状态 */
  .loading {
    text-align: center;
    padding: 3rem;
  }

  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .empty {
    text-align: center;
    padding: 3rem;
    color: #909399;
  }

  .empty svg {
    margin-bottom: 1rem;
  }

  .empty p {
    font-size: 0.9rem;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    .image-info {
      padding: 0.75rem;
    }

    .action-btn {
      padding: 0.4rem;
    }

    .list-item {
      flex-wrap: wrap;
    }

    .list-item-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .list-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: space-between;
    }

    .preview-toolbar {
      top: 10px;
      right: 10px;
      left: 10px;
      padding: 6px 12px;
    }

    .toolbar-btn {
      width: 32px;
      height: 32px;
    }
  }
</style>
