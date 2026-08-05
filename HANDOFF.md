# 交接说明 / 当前状态

**最后更新：2026-08-05**

> ⚠️ 本仓库是**公开**的。本文档不包含任何密钥、License Key、API key 或凭据；
> 需要这类信息时去 Creem 后台 / Cloudflare 控制台查。往本文档里补内容时请守住这条。

---

## 一句话状态

Chrome 插件功能完整、文案齐备、上传包和商店截图都能一键生成，**但还不能上架**——付款链接仍指向 Creem 的 test 模式，真实用户付不了钱。这一项要等 Creem 商户审核通过后才能换。

---

## 线上资产

自定义域由 `CNAME` 指定，DNS 与邮件都在 Cloudflare。三个页面都由 GitHub Pages 从本仓库根目录经 Jekyll 渲染。

| 用途 | URL |
|---|---|
| 产品首页（Creem 的 Product Website URL） | https://eutariffcalculator.com/ |
| 隐私政策（Chrome 商店表单要填） | https://eutariffcalculator.com/PRIVACY_POLICY.html |
| 服务条款 | https://eutariffcalculator.com/TERMS_OF_SERVICE.html |

- 旧的 `jacksonliii.github.io/eu-tariff-calculator/*` 会 301 跳到自定义域。**填表时直接用自定义域**，别依赖跳转。
- `PRIVACY_POLICY.html` / `TERMS_OF_SERVICE.html` **不是真实文件**，是 Jekyll 从同名 `.md` 渲染出来的（靠 GitHub Pages 默认启用的 `jekyll-optional-front-matter`）。
  **所以绝对不要加 `.nojekyll`** —— 一加这两个 URL 立刻 404，而隐私政策地址是要提交给 Chrome 商店的。
- 联系邮箱 `support@eutariffcalculator.com` 走 Cloudflare Email Routing 转发到个人 Gmail。MX 和 SPF 已就位。注意 Email Routing 是**只收不发**，回信会显示 Gmail 地址，需要在 Gmail 里配「以 support@ 身份发送」才一致。

---

## 仓库结构：什么会打包，什么不会

打包用**白名单**，不是黑名单。只有下面 9 个文件会进上传 ZIP：

```
manifest.json  popup.html  popup.js  calculator.js
icons/icon16.png  icons/icon48.png  icons/icon128.png
_locales/en/messages.json  _locales/zh_CN/messages.json
```

新增任何文件默认**不会**进包，不需要回来维护排除规则。名单在 `build.ps1` 的 `$include` 里。

其余文件的角色：

| 文件 | 说明 |
|---|---|
| `SPEC.md` | 项目简报，含商业策略与变现方案。**不进包**（但注意它在公开仓库里可见） |
| `store-listing.md` | 商店提交的**唯一信息源**：标题、描述、类别、单一用途说明、权限说明、数据披露、截图清单 |
| `PRIVACY_POLICY.md` / `TERMS_OF_SERVICE.md` | 公开法律文档，经 Jekyll 渲染 |
| `index.html` | 落地页，纯静态、无外部依赖 |
| `build.ps1` | 打包脚本 |
| `make-store-screenshots.js` | 商店截图生成器 |
| `test-*.js` / `scratch-*.js` | 开发期 Puppeteer 脚本，暴露内部 endpoint 和 Creem 产品 ID，**不进包** |
| `screenshots/` `dist/` `node_modules/` | 已 gitignore |

---

## 常用命令

```bash
npm install                            # 装 Puppeteer（会下载 Chromium）
npm run build                          # 出上传 ZIP -> dist/，预检问题只告警
npm run build:strict                   # 提交上架用这个：有任何告警就拒绝出包
node make-store-screenshots.js         # 重截全部 5 张商店截图 -> screenshots/
node make-store-screenshots.js 4       # 只重截第 4 张
```

`build.ps1` 除打包外还做这些校验，硬性项失败即拒绝出包：白名单文件缺失、`manifest.json` 非法或缺字段、`default_locale` 对应语言包没进包、语言包 JSON 非法、出包后 ZIP 内容与白名单不一致、ZIP 条目名含反斜杠。

三项内容预检默认告警、`-Strict` 时升级为失败：Creem test 模式 URL、硬编码 License Key 样式、`_locales` 之外的硬编码中文。后两项是回归防护，目前都干净。

---

## Chrome Web Store 提交清单

| 项目 | 状态 |
|---|---|
| 标题 / 简短描述 / 详细描述 | ✅ `store-listing.md` |
| 类别（建议 Workflow & Planning） | ✅ 已记录 |
| 单一用途说明 | ✅ 已起草 |
| 权限说明（只有 `storage` 一项） | ✅ 已起草 |
| Remote code 声明（答 No） | ✅ 已记录 |
| 数据用途披露 | ✅ 已记录，**注意不能勾「不收集任何数据」**，见下 |
| 隐私政策 URL | ✅ 线上可访问 |
| 图标 128×128 | ✅ `icons/icon128.png` |
| 商店截图 5 张 1280×800 | ✅ `screenshots/`，备份在仓库外 `../screenshots-backup.zip` |
| 上传 ZIP | ✅ `npm run build` 可出，9 文件 / 约 16 KB |
| 可见性 / 地区 / 定价 | ⬜ 提交时表单现填 |
| 三项合规认证勾选 | ⬜ 提交时现填 |
| 开发者账号 $5 注册费、邮箱验证 | ⬜ 待确认 |

**数据披露那一项容易踩坑**：隐私政策 1.3 节写明 License Key 会通过 HTTPS 上传到验证服务，所以披露表里**不能**勾「不收集任何数据」，最接近的类别是 Authentication information。披露内容与隐私政策不一致是常见拒审原因。

---

## 未完成 / 阻塞项

### P0 — 阻断上架

**`popup.js:7` 的 `UPGRADE_URL` 仍指向 Creem test 模式 checkout。** 真实用户点「升级 Pro」会进测试收单页，收不到钱。

要等 Creem 商户审核通过后，从 live 后台取**新的** product id —— test 和 live 的产品是两套独立的，不能只把 URL 里的 `/test/` 删掉。`npm run build:strict` 目前会因为这一项拒绝出包，所以不会手滑传错。

### 需要在仓库外完成

1. **吊销那个泄露的 test 模式 License Key**（值见 Creem 后台，本文档不记录）。它曾以像素形式出现在一张已提交的截图里。历史已用 `git filter-branch` 重写并 force push，本地和任何新 clone 都拿不到了，**但 GitHub 服务端仍在按 SHA 提供旧对象**（实测确认过），force push 不删除远端对象。所以吊销是唯一彻底的解法。
2. **确认 live 产品价格是 $14.99。** 之前 test 产品显示的是 $9.90。这个价格已经印在落地页、服务条款第 3 节、以及第 4 张商店截图**图片里**。不一致的话截图要重出：改 `make-store-screenshots.js` 顶部的 `PRO_PRICE` 常量，然后 `node make-store-screenshots.js 4`。
3. ~~确认 Cloudflare Worker 用的是 live API key。~~ **2026-08-05 已核实：仍是 test。** 直接看了 Worker 部署代码，第 33 行请求的是 `https://test-api.creem.io/v1/licenses/activate`，不是 `api.creem.io`。目前阶段这是预期状态（还没走 live），**先不改**，等 Creem 审核通过、`popup.js` 的 `UPGRADE_URL` 换成 live checkout 时一并把这行也换成 live API，两处必须同批改——只改一处会导致 popup.js 指向 live checkout 但 Worker 还拿 test key 验 license，症状是**所有真实付费用户静默激活失败**。
4. **给 `support@` 发一封测试邮件。** DNS 层面没问题，但证明不了 Cloudflare 侧的转发目标地址已验证通过——未验证的目标会导致邮件被静默丢弃。

### 技术债

- **Cloudflare Worker 源码不在版本控制里。** 它是唯一持有 Creem API key、唯一决定 license 有效性的组件，目前只存在于 Cloudflare 线上。建议 `wrangler init` 拉回本地纳入 git。
- **Worker 把上游认证错误和「key 无效」折叠成同一个 `valid:false`。** API key 一旦过期，表现就是所有付费用户激活失败，而返回值里看不出区别。建议区分「我们自己的故障」与「key 确实无效」，前端也给不同提示。
- **`footerNote` 里的 "Last verified: 2026-08-04" 是硬编码静态字符串**，出现在全部 5 张截图和插件界面里。对一个「卖点是跟得上刚变的新规」的工具，这个日期越旧越伤可信度，需要定期更新。
- **`~€2 清关处理费预计 2026 年 11 月生效**，届时要回来更新 `_locales` 两个语言包的 `footerNote`、`store-listing.md` 的详细描述、以及服务条款第 2 节。
- `store-listing.md` 的详细描述里没写价格，建议补 `$14.99` 与落地页、Creem 产品对齐。

---

## 环境坑（会踩，先看这里）

- **Puppeteer 启动 Chrome 必须加 `--no-sandbox --disable-setuid-sandbox`**，否则进程直接以 Code 3 退出、连 `--version` 都不输出。
- **Chrome 151 已不再支持 `--load-extension`**（加 `--enable-unsafe-extension-debugging` 也无效）。装扩展要用 `launch({ enableExtensions: true })` + `browser.installExtension(path)`（底层是 CDP `Extensions.loadUnpacked`）。`make-store-screenshots.js` 已按这个写法。
- **老的 `test-*.js` 脚本还在用 `--load-extension` + `pierce/extensions-item` 取扩展 ID，在 Chrome 151 上会失败**，需要按上面那条改造。
- **`npm install` 和 `npx puppeteer browsers install chrome` 不要并发跑。** 之前 Chromium 解压被并发的 install 超时打断，留下一个缺了所有 `.exe` 的残缺目录，而命令本身报的是成功。症状是启动失败，清空 `~/.cache/puppeteer` 重装即可。
- **这台机器上没装 Python**（`python` 只是 Microsoft Store 占位符），所以 `git filter-repo` 不可用，历史重写用的是内置的 `git filter-branch`。
- **`test-license-activation.js` 第 32 行在等中文字符串 `'激活'`**，界面语言不是中文时会超时。

---

## 已做的关键决策及原因

| 决策 | 原因 |
|---|---|
| 打包用白名单而非黑名单 | 新增文件默认不进包，不必回头维护排除规则；`SPEC.md`、test 脚本等构造性地被挡在外面 |
| `build.ps1` 用 `System.IO.Compression` 而非 `Compress-Archive` | 后者在 Windows 上曾输出反斜杠分隔符，部分 ZIP 解析器会把 `icons\icon16.png` 当成单个文件名 |
| 国家名走 `chrome.i18n`，VAT 税率从 `calculator.js` 的 `VAT_RATES` 读 | 原先中文写死在 `popup.html` 的 `<option>` 里，英文界面也显示中文；税率同时写在文案和计算逻辑两处，改一处忘另一处就会「显示 19% 但按别的税率算」 |
| 服务条款适用中华人民共和国法律，但保留消费者强制性保护条款 | 买家主要在欧盟，那里有一批不可通过合同放弃的消费者权利；只写中国法容易被判定为规避当地消费者保护 |
| 历史重写只删那一张泄露截图，其余 8 张保留在历史里 | 其余不含敏感信息；把改动面缩到最小 |
| 截图采用两段式合成 | popup 只有 300px 宽，直接贴到 1280×800 画布上是一条细条；先以 2 倍设备像素比单独截 popup，再放到合成页上缩放显示，文字才锐利 |
| 截图脚本永不输入真实 License Key | 之前泄露就是因为 `test-i18n.js` 输入真实 key 后立即截图并提交。现在激活面板固定用占位文本，`test-i18n.js` 也改为截图前清空该字段、且输出到已 gitignore 的 `screenshots/` |
