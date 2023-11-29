import * as sst from 'sst/constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
// import * as custom from 'aws-cdk-lib/custom-resources';
import { S3Origin, HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { RemovalPolicy, Fn, Duration } from 'aws-cdk-lib/core';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

type AppStage = 'dev' | 'test' | 'prod' | (string & {});

function setLogRetention(stage: AppStage) {
  return stage === 'prod' ? RetentionDays.ONE_MONTH : RetentionDays.ONE_WEEK;
}

export function SsrStack({ stack }: { stack: sst.Stack }) {
  const todosTable = new sst.Table(stack, 'todosTable', {
    fields: { pk: 'string', sk: 'string' },
    primaryIndex: { partitionKey: 'pk', sortKey: 'sk' },
  });

  const name = 'todoMvc';
  const todoApp = new sst.Function(stack, name, {
    handler: 'src/app.handler',
    url: true,
  });

  todoApp.bind([todosTable]);

  new LogGroup(stack, `${name}Logs`, {
    logGroupName: `/aws/lambda/${todoApp.functionName}`,
    retention: setLogRetention(stack.stage),
  });

  const assetsBucket = new s3.Bucket(stack, 'assetsBucket', {
    publicReadAccess: false,
    autoDeleteObjects: true,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  new BucketDeployment(stack, 'deployAssets', {
    sources: [Source.asset('./public')],
    destinationBucket: assetsBucket,
    destinationKeyPrefix: 'static',
  });

  const s3Origin = new cloudfront.OriginAccessIdentity(stack, 's3Origin', {
    comment: 'origin access for static assets only accessible via Cloudfront',
  });

  assetsBucket.grantRead(s3Origin);

  const splitFunctionUrl = Fn.select(2, Fn.split('/', todoApp.url!));
  const staticDistribution = new cloudfront.Distribution(stack, 'cdn', {
    comment: 'Serve the Lambda app and static assets',
    httpVersion: cloudfront.HttpVersion.HTTP2,
    defaultBehavior: {
      origin: new HttpOrigin(splitFunctionUrl, {
        originId: 'httpServer',
      }),
      compress: true,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: new cloudfront.OriginRequestPolicy(
        stack,
        'passHeaders',
        {
          queryStringBehavior:
            cloudfront.OriginRequestQueryStringBehavior.all(),
        },
      ),
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
    additionalBehaviors: {
      '/static/*': {
        origin: new S3Origin(assetsBucket, {
          originAccessIdentity: s3Origin,
          originId: 'staticAssets',
        }),
        cachePolicy: new cloudfront.CachePolicy(stack, 'cacheStaticAssets', {
          minTtl: Duration.days(30),
          maxTtl: Duration.days(60),
          defaultTtl: Duration.days(30),
        }),
        compress: true,
      },
    },
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
  });

  // const invalidateCloudfrontCache = new custom.AwsCustomResource(
  //   stack,
  //   'invalidateCloudfrontCache',
  //   {
  //     resourceType: 'Custom::InvalidateCFCache',
  //     onUpdate: {
  //       physicalResourceId: custom.PhysicalResourceId.of(
  //         `invalidate-${staticDistribution.distributionId}`,
  //       ),
  //       service: 'CloudFront',
  //       action: 'createInvalidation',
  //       parameters: {
  //         DistributionId: staticDistribution.distributionId,
  //         InvalidationBatch: {
  //           CallerReference: Date.now().toString(),
  //           Paths: {
  //             Quantity: 1,
  //             Items: ['/*'],
  //           },
  //         },
  //       },
  //     },
  //     policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
  //       resources: [
  //         `arn:aws:cloudfront::${stack.account}:distribution/${staticDistribution.distributionId}`,
  //       ],
  //     }),
  //   },
  // );

  // invalidateCloudfrontCache.node.addDependency(staticDistribution);

  stack.addOutputs({
    url: staticDistribution.domainName,
  });
}
