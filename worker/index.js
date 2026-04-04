const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
const MAX_SIZE = 20 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 随机图片 API
    if (path === '/api/random' && method === 'GET') {
      return handleRandomImage(request, env, corsHeaders);
    }

    // 加速 GitHub Raw API
    if (path.includes('/api/accelerate') && method === 'GET') {
      return handleAccelerate(request, env, corsHeaders);
    }

    // 上传图片 API
    if (path === '/api/upload' && method === 'POST') {
      return handleUpload(request, env, corsHeaders);
    }

    // 获取图片列表
    if (path === '/api/images' && method === 'GET') {
      return handleListImages(request, env, corsHeaders);
    }

    // 删除图片
    if (path === '/api/delete' && method === 'DELETE') {
      return handleDeleteImage(request, env, corsHeaders);
    }

    // 验证登录
    if (path === '/api/auth' && method === 'POST') {
      return handleAuth(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

// 验证管理员
async function verifyAdmin(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === env.ADMIN_PASSWORD;
}

// 处理登录验证
async function handleAuth(request, env, corsHeaders) {
  try {
    const { password } = await request.json();
    const isValid = password === env.ADMIN_PASSWORD;
    return new Response(JSON.stringify({ success: isValid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 上传图片到 GitHub
async function handleUpload(request, env, corsHeaders) {
  // 验证管理员权限
  const isAdmin = await verifyAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'File type not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large (max 20MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${random}.${ext}`;
    const filePath = `images/${filename}`;

    // 流式读取文件并转换为 Base64
    const base64 = await streamToBase64(file.stream());

    // 上传到 GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare Github ImgBed',
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content: base64,
        }),
      },
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      throw new Error(`GitHub upload failed: ${error}`);
    }

    const githubData = await githubResponse.json();
    const rawUrl = `https://raw.githubusercontent.com/${env.GITHUB_USER}/${env.GITHUB_REPO}/main/${filePath}`;
    const cdnUrl = `https://cdn.jsdmirror.cn/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@main/${filePath}`;
    const workerUrl = `${new URL(request.url).origin}/api/accelerate/${filename}`;

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        urls: {
          raw: rawUrl,
          cdn: cdnUrl,
          accelerated: workerUrl,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 获取图片列表
async function handleListImages(request, env, corsHeaders) {
  const isAdmin = await verifyAdmin(request, env);

  // 如果是普通用户，返回空列表（可根据需要修改）
  if (!isAdmin) {
    return new Response(JSON.stringify({ images: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // 获取仓库 images 目录下的所有文件
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/images`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare Github ImgBed',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(JSON.stringify({ images: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      throw new Error('Failed to fetch images');
    }

    const files = await response.json();
    const images = files
      .filter((file) => file.type === 'file')
      .map((file) => ({
        name: file.name,
        path: file.path,
        rawUrl: `https://raw.githubusercontent.com/${env.GITHUB_USER}/${env.GITHUB_REPO}/main/${file.path}`,
        cdnUrl: `https://cdn.jsdmirror.cn/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@main/${file.path}`,
        acceleratedUrl: `${new URL(request.url).origin}/api/accelerate/${file.name}`,
        uploadTime: file.name.split('-')[0] || Date.now(),
      }))
      .sort((a, b) => b.uploadTime - a.uploadTime);

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 删除图片
async function handleDeleteImage(request, env, corsHeaders) {
  const isAdmin = await verifyAdmin(request, env);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { path: filePath } = await request.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'No file path provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 先获取文件 SHA
    const getResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare Github ImgBed',
        },
      },
    );

    if (!getResponse.ok) {
      throw new Error('File not found');
    }

    const fileData = await getResponse.json();

    // 删除文件
    const deleteResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare Github ImgBed',
        },
        body: JSON.stringify({
          message: `Delete ${filePath}`,
          sha: fileData.sha,
        }),
      },
    );

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete file');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 随机图片 API
async function handleRandomImage(request, env, corsHeaders) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('Authorization');

  // 如果需要 Token 验证
  if (env.ALLOW_RANDOM_IMAGE_WITHOUT_PWD === 'false') {
    const isValid = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === env.ADMIN_PASSWORD;
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/images`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare Github ImgBed',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch images' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const files = await response.json();
    const images = files.filter((file) => file.type === 'file');

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];
    const url = `https://cdn.jsdmirror.cn/gh/${env.GITHUB_USER}/${env.GITHUB_REPO}@main/${randomImage.path}`;

    // 重定向到图片
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// 加速 GitHub Raw 地址
async function handleAccelerate(request, env, corsHeaders) {
  const url = new URL(request.url);
  const filename = url.pathname.replace('/api/accelerate/', '');

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${env.GITHUB_USER}/${env.GITHUB_REPO}/main/images/${filename}`,
    );
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const body = await response.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response('Failed to fetch image', { status: 500, headers: corsHeaders });
  }
}

// 流式转换为 Base64
async function streamToBase64(readableStream) {
  const reader = readableStream.getReader();
  const chunks = [];
  let totalLength = 0;

  // 读取所有块
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  // 合并所有块
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // 分块转换为 Base64
  return uint8ArrayToBase64(combined);
}

// Uint8Array 转 Base64（分块处理）
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const chunkSize = 32768; // 每块 32KB

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    // 使用循环代替展开运算符
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }

  return btoa(binary);
}
