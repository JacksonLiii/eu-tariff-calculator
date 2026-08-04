const { calculateLandedCost } = require('./calculator.js');

console.log(calculateLandedCost({ declaredValue: 50, categoryCount: 1, countryCode: 'DE' }));
console.log(calculateLandedCost({ declaredValue: 100, categoryCount: 3, countryCode: 'FR' }));
console.log(calculateLandedCost({ declaredValue: 20, categoryCount: 1, countryCode: 'IT' }));
