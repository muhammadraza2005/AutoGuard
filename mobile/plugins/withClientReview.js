const { withAppBuildGradle, CodeGenerator } = require('expo/config-plugins');

// Native release libraries open the embedded bundle without a Metro server or
// Expo development launcher. ONLY this separate review application embeds a
// development JS bundle, preserving the existing __DEV__ fixture boundary.
module.exports = function withClientReview(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('The client review plugin requires a Groovy app build.gradle.');
    }
    if (!process.env.AUTOGUARDIAN_REVIEW_NUMBER) {
      mod.modResults.contents = CodeGenerator.removeGeneratedContents(
        mod.modResults.contents,
        'autoguardian-client-review',
      ) ?? mod.modResults.contents;
      return mod;
    }
    mod.modResults.contents = CodeGenerator.mergeContents({
      src: mod.modResults.contents,
      tag: 'autoguardian-client-review',
      anchor: /apply plugin: "com.facebook.react"/,
      offset: 1,
      comment: '//',
      newSrc: `
// React Native sets task defaults while registering Android variants. Apply
// this override after all projects have registered their tasks.
gradle.projectsEvaluated {
    tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
        devEnabled.set(true)
        minifyEnabled.set(false)
        doFirst {
            if (!devEnabled.get()) {
                throw new GradleException("Client review requires a development JS bundle; refusing to package inaccessible demo screens.")
            }
            println("AutoGuardian client review: embedding development JS and assets for standalone use.")
        }
    }
}
`,
    }).contents;
    return mod;
  });
};
