import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// 引入 Vant 样式
import 'vant/lib/index.css';

// 引入 Vant 组件
import { Toast, Dialog } from 'vant';

// 配置 Toast 默认选项
Toast.allowMultiple = true;

const app = createApp(App);
app.use(Toast);
app.use(Dialog);
app.mount('#app');
