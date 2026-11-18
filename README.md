# 我的软件分享站

纯静态网站，**不需要构建、不需要数据库**。内容全部写在 `data/software.json` 里，改完刷新即可。

```
site/
├── index.html            页面结构
├── data/software.json    所有内容（软件清单、分类、赞助方式）
├── assets/style.css      样式（自动适配深色模式）
├── assets/app.js         渲染逻辑（分类筛选 / 搜索 / 赞助区）
└── assets/sponsor/       放二维码图片：wechat.png、alipay.png
```

## 本地预览

```bash
cd site
python3 -m http.server 8000
# 浏览器打开 http://127.0.0.1:8000
```

> 注意：直接双击 `index.html`（file://）会加载不出数据，必须用上面的本地服务器。

## 怎么改内容

打开 `data/software.json`：

- `site`：标题、副标题、页脚
- `categories`：分类（`id` 会被软件引用，`all` 是"全部"）
- `software[]`：每个软件一条
  ```json
  { "name": "软件名", "category": "tool", "desc": "一句话说明",
    "url": "https://下载或官网地址", "tags": ["Windows", "免费"] }
  ```
- `sponsor.methods[]`：赞助方式，`image` 指向 `assets/sponsor/` 下的二维码图片

放二维码：把图片命名为 `wechat.png` / `alipay.png` 丢进 `assets/sponsor/` 即可；
没有图片时页面会显示"二维码待上传"。

## 上线：GitHub Pages（免费）

1. 注册/登录 GitHub，点 **New repository**，仓库名填 `你的用户名.github.io`（这样地址最短）。
2. 把 `site/` 里的**所有文件**上传到仓库根目录（网页端 "Add file → Upload files" 拖进去即可）。
3. 仓库 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main`，目录 `/ (root)`，Save。
4. 等 1–2 分钟，访问 `https://你的用户名.github.io`。

## 上线：Cloudflare Pages（免费，国内访问通常更快）

1. 登录 Cloudflare → **Workers & Pages → Create → Pages → Upload assets**。
2. 把整个 `site/` 目录拖进去，项目名随意，Deploy。
3. 得到 `https://项目名.pages.dev` 的地址；可在 Custom domain 里绑自己的域名。

## 小贴士

- 想加"更新日志"页：复制 `index.html` 改名 `changelog.html`，内容手写即可，导航里加个链接。
- 想统计访问量：可接 Cloudflare Web Analytics（免费、无需 Cookie）。
- 想改成暗色为主：在 `assets/style.css` 顶部把 `--bg` 等变量调成深色即可。
