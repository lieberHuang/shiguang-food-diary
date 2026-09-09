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
- 每个已记录餐次在餐头显示该餐的脂肪供能占比。
- 周日期切换、日期选择、早餐/午餐/晚餐/加餐归类。
- “拍一张”和“从相册选择”均直接进入固定示例识别流程。
- 示例结果核对、调整份量时同比换算。
- 识别结果核对、编辑、删除和撤销删除；记录保存在当前浏览器 localStorage，保留旧版已有饮食记录。
- 不提供手动新增或营养目标设置。
- 首次访问提供当天的三条示例记录，均可修改或删除。
- 仅提供移动端单列布局，固定底部拍照记录入口；电脑打开时保持手机宽度，不提供桌面版布局。

## 示例识别

当前不包含 AI 模型、服务器、账户或云端数据库。点击任一示例入口后，页面会展示固定的食物与营养结果，不会调用相机、相册或上传照片。

## 图片来源

本地图片来自 Unsplash，按 Unsplash License 使用：

- Frames For Your Heart：https://unsplash.com/photos/vegetable-salad-on-blue-ceramic-bowl-J5eOPeFqcuY
- Ben Kolde：https://unsplash.com/photos/toasted-wheat-bread-with-fried-egg-rQsYZnCRU00
- Shayna Douglas：https://unsplash.com/fr/photos/un-bol-de-cereales-avec-des-bleuets-et-du-granola-z71M3cfW40c
- 许可：https://unsplash.com/license

## 验证范围

完成 TypeScript 检查和生产构建，以及非浏览器 HTTP 响应检查。未进行浏览器交互测试或真机相机测试；真实后台尚未提供，接口联调留待接入后进行。

页面在支持 `document.modelContext` 的环境中提供 `get_daily_nutrition` 和 `start_photo_record`；无兼容验证上下文，未验证 WebMCP 运行时。普通浏览器不受影响。
