import packageJson from './package.json';
import { Tags } from 'aws-cdk-lib/core';
import { type SSTConfig } from 'sst';
import { SsrStack } from './src/SsrStack';

export default {
  config(_input) {
    return { name: 'todomvcHtmx', region: 'eu-west-1' };
  },
  stacks(app) {
    app.stack(SsrStack);
    app.setDefaultRemovalPolicy('destroy');

    app.setDefaultFunctionProps({
      runtime: 'nodejs18.x',
    });

    Tags.of(app).add('version', packageJson.version);
    Tags.of(app).add('environment', process.env.STACK_ENV || 'dev');
  },
} satisfies SSTConfig;
