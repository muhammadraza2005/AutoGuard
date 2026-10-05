module.exports = ({ config }) => {
  const reviewNumber = process.env.AUTOGUARDIAN_REVIEW_NUMBER;
  const plugins = [...config.plugins, './plugins/withClientReview'];
  if (!reviewNumber) return { ...config, plugins };
  if (!/^[1-9]\d*$/.test(reviewNumber)) {
    throw new Error('AUTOGUARDIAN_REVIEW_NUMBER must be a positive integer.');
  }
  if (process.env.EXPO_PUBLIC_APP_MODE !== 'demo') {
    throw new Error('Client review builds must use demo mode.');
  }

  return {
    ...config,
    name: `Auto Guardian APK${reviewNumber}`,
    scheme: 'autoguardian-review',
    android: {
      ...config.android,
      package: `${config.android.package}.review`,
      versionCode: Number(reviewNumber),
    },
    plugins,
  };
};
