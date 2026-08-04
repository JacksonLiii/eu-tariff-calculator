document.getElementById('calcBtn').addEventListener('click', function () {
  const declaredValueInput = document.getElementById('declaredValue');
  const categoryCountInput = document.getElementById('categoryCount');
  const countryCode = document.getElementById('countryCode').value;

  const declaredValue = parseFloat(declaredValueInput.value);
  const categoryCount = parseInt(categoryCountInput.value, 10) || 1;

  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');

  if (!declaredValue || declaredValue <= 0) {
    errorEl.textContent = '请输入大于0的申报价值';
    errorEl.style.display = 'block';
    resultEl.style.display = 'none';
    return;
  }

  errorEl.style.display = 'none';

  const result = calculateLandedCost({ declaredValue, categoryCount, countryCode });

  document.getElementById('rDuty').textContent = '€' + result.duty.toFixed(2);
  document.getElementById('rVat').textContent = '€' + result.vat.toFixed(2);
  document.getElementById('rTotal').textContent = '€' + result.totalLandedCost.toFixed(2);
  document.getElementById('rPct').textContent = (result.additionalCostPercentage * 100).toFixed(0) + '%';

  resultEl.style.display = 'block';
});
