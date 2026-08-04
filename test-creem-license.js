const API_KEY = process.env.CREEM_API_KEY;
const CHECKOUT_ID = process.argv[2];

if (!API_KEY) {
  console.error('缺少环境变量 CREEM_API_KEY');
  process.exit(1);
}
if (!CHECKOUT_ID) {
  console.error('缺少参数: checkout_id');
  process.exit(1);
}

async function getCheckout() {
  // 先按用户给出的路径形式尝试
  let res = await fetch(`https://test-api.creem.io/v1/checkouts/${CHECKOUT_ID}`, {
    headers: { 'x-api-key': API_KEY },
  });
  console.log('路径参数形式 GET /v1/checkouts/{id} 状态:', res.status);

  if (res.status === 404) {
    // 回退到查询参数形式（Creem 官方文档写的是这种）
    res = await fetch(`https://test-api.creem.io/v1/checkouts?checkout_id=${CHECKOUT_ID}`, {
      headers: { 'x-api-key': API_KEY },
    });
    console.log('查询参数形式 GET /v1/checkouts?checkout_id= 状态:', res.status);
  }

  const text = await res.text();
  console.log('原始响应:', text);

  if (!res.ok) {
    throw new Error(`查询checkout失败: ${res.status}`);
  }

  return JSON.parse(text);
}

async function callWorker(licenseKey) {
  const res = await fetch('https://creem-license-proxy.lidingyao44.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey }),
  });
  const text = await res.text();
  console.log('Worker HTTP status:', res.status);
  console.log('Worker 原始响应:', text);
  return text;
}

(async () => {
  const data = await getCheckout();

  console.log('\n完整 checkout 数据字段:', Object.keys(data));

  let licenseKey = null;
  if (data.license_key && data.license_key.key) {
    licenseKey = data.license_key.key;
  } else if (Array.isArray(data.license_keys) && data.license_keys.length > 0) {
    licenseKey = data.license_keys[0].key;
  }

  console.log('\n提取到的 License Key:', licenseKey);

  if (!licenseKey) {
    console.error('未能从响应中提取到 license key，完整响应如上，请检查字段结构');
    process.exit(1);
  }

  console.log('\n=== 调用 Cloudflare Worker 验证 ===');
  await callWorker(licenseKey);
})().catch((err) => {
  console.error('出错:', err.message);
  process.exit(1);
});
