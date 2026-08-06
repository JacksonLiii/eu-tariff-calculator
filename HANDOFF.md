# 交接说明 / 当前状态

**最后更新：2026-08-05（换电脑前的交接节点）**

> ⚠️ 本仓库是**公开**的。本文档不包含任何密钥、License Key、API key 或凭据；
> 需要这类信息时去 Creem 后台 / Cloudflare 控制台查。往本文档里补内容时请守住这条。

---

## 一句话状态

Chrome 插件功能完整、文案齐备、上传包和商店截图都能一键生成。**Creem 商户审核已通过，付费链路已全线切到 live**：`popup.js` 与落地页购买按钮指向 live checkout，Cloudflare Worker 也已改用 `api.creem.io` 验 license，两侧一致。**P0 阻塞项已清空**，泄露的 test key 已吊销、live 价格已核实为 $14.99。结账后的感谢页 `thank-you.html` 已上线，Creem 的 Return URL 也已指向它，`support@` 收件也实测通过。上架前只剩一笔真实支付的端到端验证（见下面「需要在仓库外完成」第 7 条）。

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
| 开发者账号 $5 注册费、邮箱验证 | ✅ 已注册并付费，详见下节 |

**数据披露那一项容易踩坑**：隐私政策 1.3 节写明 License Key 会通过 HTTPS 上传到验证服务，所以披露表里**不能**勾「不收集任何数据」，最接近的类别是 Authentication information。披露内容与隐私政策不一致是常见拒审原因。

---

## Chrome Web Store 开发者账号

> 姓名、邮箱、地址、Google Payments 资料 ID 等身份信息**不写在这里**——本仓库是公开的。
> 完整值见本地的 `ACCOUNT-PRIVATE.md`（已 gitignore，**不随 git 同步，换电脑要手动带**）。

| 项目 | 状态 |
|---|---|
| 开发者账号注册 | ✅ 已完成 |
| $5 一次性注册费 | ✅ 已支付 |
| Google Payments 支付资料 | ✅ 已新建正确资料（中国境内）并生效 |
| 「交易者账号」身份声明 | ⚠️ 已选「交易者」，**但未确认是否保存成功** |
| 身份验证（证件 + 地址证明） | ⬜ **未完成**，弹窗中途取消 |

**两件待办，都别拖到提交当天：**

1. **回后台确认「交易者」身份声明确实保存了。** 当时选了但没看到保存确认。这个字段影响商店页面的卖家信息展示，填错或没存上可能拖慢审核。
2. **完成身份验证**（上传身份证件 + 地址证明）。计划在正式提交插件审核前统一处理。**注意这一项更可能卡住的是收款而不是上架**——别等到有真实收入了才发现打不出来。

**一个已经踩过的坑**：Google Payments 里原先存在一份**国别和姓名都完全错误**的支付资料（英国 / 一个陌生英文名），已新建正确资料替换掉。若后台仍能看到那份旧资料，确认它已停用，避免打款走错通道。

---

## 收款链路与费率

从用户付款到人民币落袋，中间有四道损耗和两处延迟，定价和收入预期都要按这个算：

| 环节 | 费率 / 规则 |
|---|---|
| Creem 平台手续费 | **3.9% + $0.40** 每笔 |
| Creem 提现手续费 | **$7 或 1%，取较高者** |
| 打款周期 | 每月 **1 日和 15 日** |
| 到账账户 | Wise **USD** 账户 |
| 换汇 | Wise 到账后**需自行换成人民币**，汇率与换汇费另计 |

按 $14.99 的定价粗算：平台费约 $0.98（3.9% + $0.40），单笔净收约 **$14.01**；提现时再扣 $7 或 1% 取高——**所以单笔提现极不划算，攒到一定金额再提**（提 $700 以下都是按 $7 固定收，提 $700 以上才转为 1%）。

时间上要有预期：付款到打款最长等半个月，加上 Wise 到账与换汇，**用户付钱到人民币可用，两三周是正常的**。

---

## 未完成 / 阻塞项

### P0 — 阻断上架

~~`popup.js:7` 的 `UPGRADE_URL` 仍指向 Creem test 模式 checkout。~~ **2026-08-05 已解决：** Creem 商户审核通过，live 产品 `prod_3lfYFVrPwHP7SXDvueO2gZ` 已创建，`popup.js:7` 与落地页 Pricing 区块的购买按钮都已指向 live checkout `https://www.creem.io/payment/prod_3lfYFVrPwHP7SXDvueO2gZ`。`npm run build:strict` 的 test-URL 预检现在能过。

~~新的 P0：`popup.js` 已走 live，但 Worker 还在 test。~~ **2026-08-05 已解决：** Worker 第 33 行已改为 `https://api.creem.io/v1/licenses/activate`，版本状态 Active、确认已部署生效。checkout 与 license 验证两侧现已都在 live，「同批切换」完成。

**目前 P0 已清空，「需要在仓库外完成」的第 1-6 条全部完成。** 上架前只剩第 7 条：走一笔真实小额支付，把「付款 → 跳转感谢页 → 收邮件 → 激活」整条链路跑通。这一条尤其重要——Worker 刚换 live key，而它把上游认证错误和「key 无效」折叠成同一个 `valid:false`，**从外部打接口分辨不出来，只有真实付一笔才能验证**。

### 需要在仓库外完成

1. ~~吊销那个泄露的 test 模式 License Key。~~ **2026-08-05 已在 Creem 后台吊销。** 留下这条教训：它曾以像素形式出现在一张已提交的截图里；历史虽已用 `git filter-branch` 重写并 force push，本地和任何新 clone 都拿不到了，**但 GitHub 服务端仍在按 SHA 提供旧对象**（实测确认过）——**force push 不删除远端对象，所以凭据一旦进过公开仓库，重写历史不算数，吊销才是唯一彻底的解法。**
2. ~~确认 live 产品价格是 $14.99。~~ **2026-08-05 已在 Creem 后台核实：确为 $14.99**，与落地页、服务条款第 3 节、第 4 张商店截图三处印着的价格一致，无需重出截图。今后若改价，这三处都要跟着改，其中截图要改 `make-store-screenshots.js` 顶部的 `PRO_PRICE` 常量再 `node make-store-screenshots.js 4`——**价格是印死在截图像素里的，光改文案不够。**
3. ~~`worker.js` 第 33 行需手动去 Cloudflare 后台把 `test-api.creem.io` 改成 `api.creem.io`。~~ **2026-08-05 已完成并部署（版本 Active）。** 记一笔以备后来者：Worker 源码不在 git 里，只存在于 Cloudflare 在线编辑器，**任何涉及它的改动都无法随 `git push` 同步，必须手动改并点 Deploy**。今后再切环境（如回滚到 test）同样要手动来。
4. ~~确认 Cloudflare Worker 用的是 live API key。~~ **2026-08-05 已完成。** 演进过程：交接时核实为 test（当时是预期状态），要求与 `popup.js` 的 `UPGRADE_URL` 同批切换；同日 `UPGRADE_URL` 切 live 后 Worker 短暂滞后，随后 Worker 也已切到 `api.creem.io` 并部署，两侧恢复一致。**这条的教训值得留着：只改一侧会导致 popup.js 指向 live checkout 但 Worker 仍拿 test key 验 license，症状是所有真实付费用户静默激活失败，且由于 Worker 把上游认证错误和「key 无效」折叠成同一个 `valid:false`，从外部完全看不出区别。**
5. ~~给 `support@` 发一封测试邮件。~~ **2026-08-05 已验证通过。** 从 QQ 邮箱发往 `support@eutariffcalculator.com`，**几乎实时**收到，落在 Gmail 的正常收件箱、**没有进垃圾邮件**。这说明 Cloudflare Email Routing 的转发目标地址确实已验证通过（未验证的目标会静默丢弃邮件），且转发链路没有触发 Gmail 的垃圾判定。**注意 Email Routing 只收不发**：回信会显示个人 Gmail 地址，要在 Gmail 里配置「以 support@ 身份发送」才对外一致——这一项尚未做，第一次回复用户工单前补上。
6. ~~把 Creem 产品的 Return URL 改成 `https://eutariffcalculator.com/thank-you.html`。~~ **2026-08-05 已改（据操作者确认，未经自动化验证）。** 位置记下来备查：Creem 后台 Products → live 产品 `prod_3lfYFVrPwHP7SXDvueO2gZ` → Edit → Return URL（有的版本叫 Success URL / Redirect URL）。原值是站点首页——落回首页的用户拿不到激活引导，多半会直接来邮件问「key 在哪」。**这一项的实际生效与否，会在第 7 条的真实支付验证里自然暴露出来。**
7. **走一笔真实小额支付做端到端验证**：付款 → 跳转感谢页 → 收到 License Key 邮件 → 在插件里激活成功。Worker 刚换 live key，**这是唯一能验证它真的可用的方式**——它把上游认证错误和「key 无效」折叠成同一个 `valid:false`，从外部打接口分辨不出区别（详见第 4 条与技术债）。

### 技术债

- **Cloudflare Worker 源码不在版本控制里。** 它是唯一持有 Creem API key、唯一决定 license 有效性的组件，目前只存在于 Cloudflare 线上编辑器里（2026-08-05 本次交接时通过在线编辑器确认过第 33 行代码，见上面 P0 相邻条目，但依然没有拉回本地）。建议 `wrangler init` 拉回本地纳入 git，避免这份唯一副本只活在网页后台。
- **Worker 把上游认证错误和「key 无效」折叠成同一个 `valid:false`。** API key 一旦过期，表现就是所有付费用户激活失败，而返回值里看不出区别。建议区分「我们自己的故障」与「key 确实无效」，前端也给不同提示。
- **`footerNote` 里的 "Last verified: 2026-08-04" 是硬编码静态字符串**，出现在全部 5 张截图和插件界面里。**截至 2026-08-05 交接时还没更新**，已经过期 1 天。对一个「卖点是跟得上刚变的新规」的工具，这个日期越旧越伤可信度，需要定期更新（改 `_locales` 两个语言包，改完记得 `node make-store-screenshots.js` 重截）。
- **`~€2 清关处理费预计 2026 年 11 月生效**，届时要回来更新 `_locales` 两个语言包的 `footerNote`、`store-listing.md` 的详细描述、以及服务条款第 2 节。
- `store-listing.md` 的详细描述里没写价格，建议补 `$14.99` 与落地页、Creem 产品对齐。**截至 2026-08-05 交接时仍未补。**

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

---

## 2026-08-06 代码审查 + Chrome Web Store 提交

> 本节混合了两类信息，来源不同，下面逐条标明：一类是 **Claude Code 在这次会话里亲自改代码、跑测试验证过的**；一类是 **开发者本人在 Chrome Web Store / Cloudflare 后台操作后转述给 Claude Code 的**，Claude Code 没有这些后台的访问能力，没法独立验证，只是如实记录开发者的陈述。混着看容易把"我验证过"当成"事情发生过"，所以每条都标了来源。

### 代码审查与修复（4 项必须修复，全部完成）

1. **categoryCount 负数校验缺失** — 已修复（`popup.js` + `calculator.js` 双层防御）。Claude Code 用 node 直接验证 `calculateLandedCost` 对负数/0/小数会 `throw`，又用 Puppeteer 在真实加载的插件页面里验证 UI 层会拦截并报错，不产出负数结果。
2. **declaredValue 无上限导致科学计数法显示** — 已修复（上限 1,000,000）。同样是 Claude Code 用 node + Puppeteer 双重验证。
3. **Enter 键不触发计算** — 已修复（新增 `keydown` 监听）。Claude Code 用 Puppeteer 模拟真实按键，确认两个输入框按 Enter 都能触发计算或触发相应报错。
4. **License 激活网络错误与 Key 无效共用同一句文案** — 已修复，**这一项是前后端配合完成的，验证方式也分两条完全不同的线，务必分清楚，不要混为一谈**：
   - 前端 `popup.js` 里读取 `errorType` 字段来区分文案的逻辑，是 **Claude Code 编写**的。验证用的是新写的 `test-license-error-types.js`——一个 Puppeteer 脚本，用 **mock 的 `window.fetch`** 模拟四种响应（断网异常、`errorType:"network"`、`errorType:"invalid"`、`valid:true`），跑的是真实 `popup.js` 代码但假的网络层，**不是真实网络环境**。这台机器本身也连不上 `*.workers.dev`（实测是 connect timeout），所以 Claude Code 没有、也没法在真实网络条件下验证这条链路。
   - Cloudflare Worker 端新增的 `errorType` 字段，是 **开发者本人**在 Cloudflare 在线编辑器里手动改并部署的。Claude Code 全程没有接触过 Worker 源码——这台机器没有 Cloudflare 登录凭证（`wrangler whoami` 确认未登录）。
   - 「断网显示网络错误文案」「乱码 Key 显示 Key 无效文案」「有效 Key 激活成功」这三个真实场景，是 **开发者本人**在真实 Chrome 里手动断网 / 输入验证过的，**不是** Claude Code 自动化测试的结果。
   - 结论：mock 测试（Claude Code 验证）+ 真实环境人工验证（开发者验证）**两件事都发生了**，但主体和方式完全不同，一个不能替代另一个，以后排查问题时别把"mock 测试通过"当成"真实环境也验证过"。

**提交记录**（commit 由 Claude Code 创建，push 由开发者本人执行，Claude Code 看到过 push 后的远程分支输出）：
- commit `b0c827a`：fix categoryCount/declaredValue/Enter 键/网络错误初版区分
- commit `9c1a9f9`：fix 改用 errorType 字段精确区分网络错误 vs Key 无效

均已 push 到 GitHub 远程仓库 `main` 分支。

### 提交前自检

完整报告见 `STORE-SUBMISSION-CHECK-2026-08.md`。**⚠️ 这个文件截至本次记录时还没有提交到 git，只存在于这台机器的工作区里**（`git status` 显示 untracked）——换电脑或者清理工作区之前，记得确认它是否需要单独提交，不然下一台机器上找不到。

以下结论是 Claude Code 在这台机器上读代码、跑脚本核实过的：
- manifest.json 权限审计：仅声明 `storage` 权限，代码里也确实只用到 `storage`（外加不需要声明权限的 `chrome.i18n` / `chrome.tabs.create`），没有多余也没有遗漏。
- 版本号：`manifest.json` 的 `version` 仍是 `0.1.0`，是否升级到 `1.0.0` 由开发者自己决定，Claude Code 没有擅自修改。
- 打包会用到的 4 个文件（`popup.js`/`calculator.js`/`popup.html` + 两份语言包）里零 `console.log` 残留、零测试用 License Key / test-api 端点；`test-*.js`/`scratch-*.js` 这些开发脚本里有，但按白名单不会进包。
- i18n（en/zh_CN）本次会话新增的 3 个 key（`errorInvalidCategoryCount`、`errorValueTooLarge`、`licenseActivateNetworkError`）两个语言包里都存在且已翻译，40 个 key 完全对应，无缺翻译。
- `thank-you.html` 引导文案与 `popup.js` 实际 UI 文案（激活入口 / 按钮文案 / 成功提示）逐条比对完全一致。
- Worker 是否真的在用 live `api.creem.io`——**这条 Claude Code 没法独立核实**（无 Cloudflare 访问、连不上 `*.workers.dev`），只能引用本文档更早记录的历史确认（见上面 P0 一节）。

隐私政策 URL：`https://eutariffcalculator.com/PRIVACY_POLICY.html`。**开发者本人已亲自打开确认页面正常显示、可访问**——Claude Code 所在环境没有出网权限，这条是开发者的人工确认，不是 Claude Code 验证的。

### 商店素材

- "仓库外备份 `../screenshots-backup.zip` 不可用"这条结论，**来源是 `store-listing.md` 里早就存在的记录**（尺寸不对：800×600 / 800×628 / 785×628，部分截图带 Creem test-mode 横幅或第三方结账页面，其中一张明文含真实 License Key，已从 git 历史里移除），**不是这次会话新发现的**。这次会话专门查过这台机器，确认压根没有 `screenshots-backup.zip` 这个文件（项目目录和 Desktop 下都搜过、都没有），所以谈不上"废弃删除"——它本来就不在这台机器上。
- 新的 5 张商店截图用 Claude Code 新写的 `generate-store-screenshots-dist.js` 生成。**⚠️ 这个脚本同样还没有提交到 git，是工作区文件**，跟 `STORE-SUBMISSION-CHECK-2026-08.md` 一样需要单独确认是否要提交。特点：
  - 从 `dist/eu-tariff-calculator-v0.1.0/`（`build.ps1` 打包后解压出来的真实上传内容）加载插件，不是从源码目录加载，截图反映的是真正会上传的东西。
  - 5 个场景全部走真实 UI 交互（真点 Calculate、真输入值、真连续点击触发限额），不是靠直接写 `chrome.storage` 伪造状态。
  - Claude Code 实测：5 张全部 1280×800、24-bit RGB PNG（PNG IHDR 里 color type = 2，无 alpha 通道）。
  - 内容和英文界面由 Claude Code 用截图查看工具逐张人工检查过，数值、文案、语言都对（例如 €50/Germany 场景确认显示 Duty €3.00 / VAT €10.07 / Total €63.07）。
  - 仓库里原有的 `make-store-screenshots.js`（营销文案风格，直接写 `chrome.storage` 伪造历史 / 限额状态，从源码目录加载）**依然保留，两个脚本并存**，最终提交用哪一个生成的截图，开发者还没决定。

### Chrome Web Store 提交

> ⚠️ 以下内容全部来自 **开发者本人在 Chrome Web Store 后台的实际操作**，是开发者在对话里转述给 Claude Code 并确认准确性的。Claude Code 在这次会话里没有 Chrome Web Store 后台的访问能力，这一节里的每一个字段都没有被 Claude Code 亲自验证过，纯粹是转述记录。

- 交易者声明：选择"交易者账号"（因产品为 $14.99 付费产品，符合以营利为目的的定义），身份验证暂缓（不阻塞插件提交，仅影响收款相关功能，后续需要时再补）。
- 商品详情：标题 / 摘要 / 说明详见 `store-listing.md`，类别选择"工作流程与规划"（Workflow & Planning）。
- 隐私权：数据使用披露勾选"身份验证信息"（对应 License Key 传输），远程代码选择"不"（Worker 仅返回 JSON 数据，不加载执行远程脚本），3 个数据使用承诺复选框全部勾选。
- 分发：免费、公开、全部地区。
- 提交时间：2026-08-06，状态：待审核（预计几小时到几天）。

### 待办（不阻塞已提交的审核，后续可做）

- Chrome 开发者账号身份验证（收款能力，需身份证件 + 地址证明）。
- 视需求补充德语 / 法语商店列表文案（当前仅 en + zh_CN 两个插件界面语言，Chrome i18n 会整体回退显示英文，不会空白，不影响可用性；Chrome Web Store 商品详情页语言同理，只填了英语的情况下其他语言用户会看到英语版本兜底，不会空白。这条不紧急，可以上架后再补，不需要卡在这次提交，具体要不要补取决于目标用户画像——如果目标用户主要是做跨境生意的卖家，英语基本够用；如果预期有欧盟本地卖家/清关行用户，德语优先级最高）。
- 之前遗留的技术债：`creem-license-proxy` 的 Worker 源码仅存在于 Cloudflare 在线编辑器，未纳入 git 版本控制，建议找时间存一份备份进仓库。
- **本次会话产生但截至记录时尚未提交到 git 的工作区文件**，下次开始前先看一遍 `git status`：`STORE-SUBMISSION-CHECK-2026-08.md`（提交前自检报告）、`generate-store-screenshots-dist.js`（新截图生成脚本）、`build.ps1`（改动是加了 UTF-8 BOM，修复 Windows PowerShell 5.1 无法解析脚本里内嵌中文字符正则的问题，逻辑内容未变）。
