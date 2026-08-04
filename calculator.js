const VAT_RATES = {
  DE: 0.19,
  FR: 0.20,
  IT: 0.22,
  ES: 0.21,
  NL: 0.21,
};

function calculateLandedCost(input) {
  const { declaredValue, categoryCount = 1, countryCode } = input;

  const vatRate = VAT_RATES[countryCode];
  if (vatRate === undefined) {
    throw new Error(`Unsupported countryCode: ${countryCode}`);
  }

  const duty = 3 * categoryCount;
  const vatBase = declaredValue + duty;
  const vat = vatBase * vatRate;
  const totalLandedCost = declaredValue + duty + vat;
  const additionalCostPercentage = (duty + vat) / declaredValue;

  return {
    duty: Number(duty.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    totalLandedCost: Number(totalLandedCost.toFixed(2)),
    additionalCostPercentage: Number(additionalCostPercentage.toFixed(2)),
  };
}

if (typeof module !== 'undefined') { module.exports = { calculateLandedCost }; }
