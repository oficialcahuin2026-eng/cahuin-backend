const Purchases = {
  configure: () => {},
  getOfferings: async () => ({ current: { availablePackages: [] } }),
  purchasePackage: async () => ({ customerInfo: { entitlements: { active: {} } } }),
};

export default Purchases;
