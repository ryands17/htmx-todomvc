import * as sst from 'sst/constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

type AppStage = 'dev' | 'test' | 'prod' | (string & {});

function setLogRetention(stage: AppStage) {
  return stage === 'prod' ? RetentionDays.ONE_MONTH : RetentionDays.ONE_WEEK;
}

export function SsrStack({ stack }: { stack: sst.Stack }) {
  const name = 'todoMvc';
  const todoApp = new sst.Function(stack, name, {
    handler: 'src/app.handler',
    memorySize: '512 MB',
    timeout: '20 seconds',
    url: true,
    copyFiles: [{ from: './public' }],
  });

  new LogGroup(stack, `${name}Logs`, {
    logGroupName: `/aws/lambda/${todoApp.functionName}`,
    retention: setLogRetention(stack.stage),
  });

  stack.addOutputs({
    url: todoApp.url,
  });
}
