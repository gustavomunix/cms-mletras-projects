export default {
  extends: ['stylelint-config-standard', 'stylelint-config-modern'],
  referenceFiles: ['src/app/**/styles.css'],
  rules: {
    'no-unknown-custom-properties': true,
    'no-unknown-custom-media': true,
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$',
  },
}
