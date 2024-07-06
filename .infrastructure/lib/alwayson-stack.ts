import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  BuildsBucket, WebRoutes, ZipFunction, githubActions,
} from '@scloud/cdk-patterns';
// import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const domainName = 'alwayson.greenersoftware.net';
const zoneId = 'Z02969861Z406S70ML8A3';

function envVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

export default class AlwaysonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // This only needs to be created once per account. If you already have one, you can delete this.
    githubActions(this).ghaOidcProvider();

    // You'll need a zone to create DNS records in. This will need to be referenced by a real domain name so that SSL certificate creation can be authorised.
    // NB the DOMAIN_NAME environment variable is defined in .infrastructure/secrets/domain.sh
    const zone = this.zone(domainName, zoneId);

    // A bucket to hold zip files for Lambda functions
    // This is useful because updating a Lambda function in the infrastructure might set the Lambda code to a default placeholder.
    // Having a bucket to store the code in means we can update the Lambda function to use the code, either here in the infrastructure build, or from the Github Actions build.
    const builds = new BuildsBucket(this);

    // Create the frontend and API using Cloudfront
    // The following calls will create variables in Github Actions that can be used to deploy the frontend and API:
    // * API_LAMBDA - the name of the Lambda function to update when deploying the API
    // * CLOUDFRONT_BUCKET - for uploading the frontend
    // * CLOUDFRONT_DISTRIBUTIONID - for invalidating the Cloudfront cache

    // API
    const api = this.api(builds);

    // Cloudfront function association - this is used to rewrite static URLs to .html so they get forwarded to s3:
    const defaultBehavior: Partial<cloudfront.BehaviorOptions> = {
      functionAssociations: [{
        function: new cloudfront.Function(this, 'staticURLs', {
          code: cloudfront.FunctionCode.fromFile({ filePath: './lib/cfFunction.js' }),
          comment: 'Rewrite static URLs to .html so they get forwarded to s3',
        }),
        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
      }],
    };

    WebRoutes.routes(this, 'cloudfront', { '/api/*': api }, {
      zone,
      domainName,
      defaultIndex: true,
      redirectWww: true,
      distributionProps: {
        defaultBehavior: defaultBehavior as cloudfront.BehaviorOptions,
      },
    });

    // Set up OIDC access from Github Actions - this enables builds to deploy updates to the infrastructure
    const owner = envVar('OWNER', process.env.OWNER || process.env.USERNAME); // Either OWNER, or USERNAME environment variables can be used
    const repo = envVar('REPO');
    githubActions(this).ghaOidcRole({ owner, repo });
  }

  /**
   * NB: creating a hosted zone is not free. You will be charged $0.50 per month for each hosted zone.
   * @param zoneName The name of the hosted zone - this is assumed to be the same as the domain name and will be used by other constructs (e.g. for SSL certificates),
   * @param zoneId Optional. The ID of an existing hosted zone. If you already have a hosted zone, you can pass the zoneId to this function to get a reference to it, rather than creating a new one.
   */
  zone(zoneName: string, zoneId?: string): IHostedZone {
    if (zoneId) {
      return HostedZone.fromHostedZoneAttributes(this, 'zone', {
        hostedZoneId: zoneId,
        zoneName,
      });
    }

    // Fall back to creating a new HostedZone - costs $0.50 per month
    return new HostedZone(this, 'zone', {
      zoneName,
    });
  }

  api(
    // cognito: Cognito,
    builds: Bucket,
    // aBucket: Bucket,
    // aTable: Table,
    // slackQueue: Queue,
  ): Function {
    // Lambda for the Node API
    const api = ZipFunction.node(this, 'api', {
      environment: {
        // SIGNIN_URL: cognito.signInUrl(),
        // SLACK_QUEUE_URL: slackQueue.queueUrl,
        // BUCKET: aBucket.bucketName,
        // TABLE: aTable.tableName,
      },
      functionProps: {
        memorySize: 3008,
        // code: Code.fromBucket(builds, 'api.zip'), // This can be uncommented once you've run a build of the API code
      },
    });
    console.log(builds);

    return api;
  }
}