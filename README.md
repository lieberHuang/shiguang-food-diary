# 食光 · 饮食记录

参考薄荷健康的清爽布局，构建的中文移动端 App 页面原型。使用 React、TypeScript、Vinext；构建产物为 HTML、CSS、JS 和本地图片。

## 启动

```sh
npm ci
npm run dev
```

打开终端提示的本地网址。

```sh
npm run build
```

静态页面在 `dist/client/`。需要通过 HTTP 静态服务访问（不支持双击 HTML 的 file:// 模式），不要将源项目或 node_modules 当作静态站点发布。

发布到 GitHub Pages 时运行 `npm run build:github-pages`，它会生成带仓库路径前缀的静态资源。

## 功能

- 顶部仅展示当天实际摄入的蛋白质、碳水、脂肪和热量。
- 热量区显示脂肪供能占比：脂肪克数 × 9 ÷ 三大营养素的总供能 × 100%，保留一位小数；没有摄入时显示「—」。
- 周日期切换、日期选择、早餐/午餐/晚餐/加餐归类。
- 拍照、选择照片、拖放图片；压缩本地缩略图。
- 通过照片解析（或明确标注的示例解析）进入确认表单；调整份量时同比换算。
- 识别结果核对、编辑、删除和撤销删除；记录保存在当前浏览器 localStorage，保留旧版已有饮食记录。
- 不提供手动新增或营养目标设置；识别失败时可以重试或更换照片。
- 首次访问提供当天的三条示例记录，均可修改或删除。
- 仅提供移动端单列布局，固定底部拍照记录入口；电脑打开时保持手机宽度，不提供桌面版布局。

## 接入真实后台

当前不包含 AI 模型、服务器、账户或云端数据库。示例模式不会上传照片，营养值不由照片推断。初始食物数据为演示值。

编辑 `public/config.json`（构建后对应 `dist/client/config.json`）：

```json
{ "analysisEndpoint": "https://your-backend.example/api/analyze-food" }
```

前端发送 `POST multipart/form-data`，文件字段为 `image`。不配置接口时使用固定示例；配置后显示真实解析文案，并在服务异常时提示错误，不降级冒充真实识别。请求超时为 30 秒。

后台返回单份餐盘的合计营养信息：

```json
{ "name": "鸡胸肉蔬菜沙拉", "grams": 350, "p": 38.6, "c": 42.5, "f": 16.2 }
```

`p/c/f` 分别是整份食物的蛋白质/碳水/脂肪，单位克，**不是每 100 克含量**。热量按 `4 × 蛋白质 + 4 × 碳水 + 9 × 脂肪` 估算。后台需校验图片并配置适当 CORS；鉴权和 AI 服务密钥仅放在后台，不要放进 config.json 或浏览器代码。

## 图片来源

本地图片来自 Unsplash，按 Unsplash License 使用：

- Frames For Your Heart：https://unsplash.com/photos/vegetable-salad-on-blue-ceramic-bowl-J5eOPeFqcuY
- Ben Kolde：https://unsplash.com/photos/toasted-wheat-bread-with-fried-egg-rQsYZnCRU00
- Shayna Douglas：https://unsplash.com/fr/photos/un-bol-de-cereales-avec-des-bleuets-et-du-granola-z71M3cfW40c
- 许可：https://unsplash.com/license

## 验证范围

完成 TypeScript 检查和生产构建，以及非浏览器 HTTP 响应检查。未进行浏览器交互测试或真机相机测试；真实后台尚未提供，接口联调留待接入后进行。

页面在支持 `document.modelContext` 的环境中提供 `get_daily_nutrition` 和 `start_photo_record`；无兼容验证上下文，未验证 WebMCP 运行时。普通浏览器不受影响。
