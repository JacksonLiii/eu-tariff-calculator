const API_KEY = process.env.CREEM_API_KEY;

if (!API_KEY) {
  console.error('缺少环境变量 CREEM_API_KEY');
  process.exit(1);
}

async function createCheckout() {
  const res = await fetch('https://test-api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: 'prod_5BcHyQM5AZoMlOqSeVaR1r',
      success_url: 'https://example.com/success',
    }),
  });

  const text = await res.text();
  console.log('HTTP status:', res.status);
  console.log('原始响应:', text);

  if (!res.ok) {
    throw new Error(`创建checkout失败: ${res.status}`);
  }

  const data = JSON.parse(text);
  console.log('checkout_url:', data.checkout_url);
  console.log('checkout id:', data.id);
  return data;
}

createCheckout().catch((err) => {
  console.error('出错:', err.message);
  process.exit(1);
});
