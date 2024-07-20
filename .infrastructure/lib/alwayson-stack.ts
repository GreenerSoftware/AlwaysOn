/* eslint-disable @typescript-eslint/ban-types */
import { Construct } from 'constructs';
import {
  BuildsBucket, WebRoutes, ZipFunction, githubActions,
} from '@scloud/cdk-patterns';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { InstanceClass, InstanceSize, InstanceType, InterfaceVpcEndpointAwsService, IPeer, MachineImage, Peer, Port, SecurityGroup, SubnetSelection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, ParameterGroup, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

// Credentials
// PERSONAL_ACCESS_TOKEN - create a Github personal access token (classic) with 'repo' scope and set this in .infrastructure/secrets/github.sh using export PERSONAL_ACCESS_TOKEN=ghp_...
// AWS_PROFILE           - if you've set up a profile to access this account, set this in .infrastructure/secrets/aws.sh using export AWS_PROFILE=...

// Route 53
const DOMAIN_NAME = 'alwayson.greenersoftware.net';
const ZONE_ID = 'Z02969861Z406S70ML8A3';

// Github - set in secrets/github.sh
// const OWNER = 'greenersoftware';
// const REPO = 'alwayson';

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`No environment variable value for ${key}`);
  return value;
}

export default class AlwaysonStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // This only needs to be created once per account. If you already have one, you can delete this.
    githubActions(this).ghaOidcProvider();

    // You'll need a zone to create DNS records in. This will need to be referenced by a real domain name so that SSL certificate creation can be authorised.
    // NB the DOMAIN_NAME environment variable is defined in .infrastructure/secrets/domain.sh
    const zone = this.zone(DOMAIN_NAME, ZONE_ID);

    // A bucket to hold zip files for Lambda functions
    // This is useful because updating a Lambda function in the infrastructure might set the Lambda code to a default placeholder.
    // Having a bucket to store the code in means we can update the Lambda function to use the code, either here in the infrastructure build, or from the Github Actions build.
    const builds = new BuildsBucket(this)

    // Cloudfront function association:
    const defaultBehavior: Partial<cloudfront.BehaviorOptions> = {
      functionAssociations: [{
        function: new cloudfront.Function(this, 'staticURLs', {
          code: cloudfront.FunctionCode.fromFile({ filePath: './lib/cfFunction.js' }),
          comment: 'Rewrite static URLs to .html so they get forwarded to s3',
        }),
        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
      }],
    };

    // Create the frontend and API using Cloudfront
    // The following calls will create variables in Github Actions that can be used to deploy the frontend and API:
    // * API_LAMBDA - the name of the Lambda function to update when deploying the API
    // * CLOUDFRONT_BUCKET - for uploading the frontend
    // * CLOUDFRONT_DISTRIBUTIONID - for invalidating the Cloudfront cache
    const api = this.api(builds);
    WebRoutes.routes(this, 'cloudfront', { '/api/*': api }, {
      zone,
      domainName: DOMAIN_NAME,
      defaultIndex: true,
      redirectWww: true,
      distributionProps: {
        defaultBehavior: defaultBehavior as cloudfront.BehaviorOptions,
      },
    });

    // Build the VPC without NAT gateways to keep costs down.
    // Based on https://stackoverflow.com/a/65660724/723506
    const vpc = new Vpc(this, 'MyVPC', {
      natGateways: 0,
      // subnetConfiguration: [
      //   {
      //     cidrMask: 24,
      //     name: 'public',
      //     subnetType: SubnetType.PUBLIC,
      //   },
      //   {
      //     cidrMask: 28,
      //     name: 'rds',
      //     subnetType: SubnetType.PRIVATE_ISOLATED,
      //   }
      // ]
    });

    // This allows access to secrets manager from the VPC. I believe it's cheaper thatn NAT gateways.
    // Some info here: https://repost.aws/questions/QUmfyiKedjTd225PQS7MlHQQ/vpc-nat-gateway-vs-vpc-endpoint-pricing
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // Possible CI/CD deployment model:
    // https://aws.amazon.com/blogs/devops/integrating-with-github-actions-ci-cd-pipeline-to-deploy-a-web-app-to-amazon-ec2/
    this.ec2(vpc);

    // Might use this for time-bound:
    // RDS
    // const dbCluster = new rds.ServerlessCluster(this, 'MyAuroraCluster', {
    //   engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
    //   defaultDatabaseName: 'DbName',
    //   vpcSubnets: {
    //     subnetType: SubnetType.PRIVATE_ISOLATED,
    //   },
    //   vpc,
    // });

    // Set up OIDC access from Github Actions - this enables builds to deploy updates to the infrastructure
    githubActions(this).ghaOidcRole({ owner: env('OWNER'), repo: env('REPO') });
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

  /**
   * Based on: https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/application-load-balancer/index.ts
   */
  ec2(vpc: Vpc) {
    const asg = new AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2({
        // cpuType: AmazonLinuxCpuType.ARM_64
      }),
    });

    const lb = new ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('Target', {
      port: 80,
      targets: [asg]
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

    asg.scaleOnRequestCount('AModestLoad', {
      targetRequestsPerMinute: 60,
    });
  }

  /**
   * Based on: https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/rds/mysql/mysql.ts
   */
  rds(vpc: Vpc, ingressSources: IPeer[] = []): { databaseName: string, mysqlUsername: string, endPoint: string; } {

    // default database username
    const mysqlUsername = "admin";
    const databaseName = "db";
    const engineVersion = MysqlEngineVersion.VER_8_0_37;

    // Subnets
    const vpcSubnets: SubnetSelection = {
      subnets: vpc.privateSubnets,
    };

    const allAll = Port.allTraffic();
    const tcp3306 = Port.tcpRange(3306, 3306);

    const dbsg = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Database',
      securityGroupName: 'Database',
    });

    dbsg.addIngressRule(dbsg, allAll, 'all from self');
    dbsg.addEgressRule(Peer.ipv4('0.0.0.0/0'), allAll, 'all out');

    const mysqlConnectionPorts = [
      { port: tcp3306, description: 'tcp3306 Mysql' },
    ];

    for (const ingressSource of ingressSources) {
      for (const c of mysqlConnectionPorts) {
        dbsg.addIngressRule(ingressSource, c.port, c.description);
      }
    }

    const dbSubnetGroup = new SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: vpc,
      description: 'Database subnet group',
      vpcSubnets: vpcSubnets,
      subnetGroupName: 'Database subnet group',
    });

    const mysqlSecret = new Secret(this, 'MysqlCredentials', {
      secretName: 'MysqlCredentials',
      description: 'Mysql Database Crendetials',
      generateSecretString: {
        excludeCharacters: "\"@/\\ '",
        generateStringKey: 'password',
        passwordLength: 30,
        secretStringTemplate: JSON.stringify({ username: mysqlUsername }),
      },
    });

    const mysqlCredentials = Credentials.fromSecret(
      mysqlSecret,
      mysqlUsername,
    );

    const dbParameterGroup = new ParameterGroup(this, 'ParameterGroup', {
      engine: DatabaseInstanceEngine.mysql({
        version: engineVersion,
      }),
    });



    const mysqlInstance = new DatabaseInstance(this, 'MysqlDatabase', {
      databaseName,
      instanceIdentifier: 'database',
      credentials: mysqlCredentials,
      engine: DatabaseInstanceEngine.mysql({
        version: engineVersion,
      }),
      backupRetention: Duration.days(7),
      allocatedStorage: 20,
      securityGroups: [dbsg],
      allowMajorVersionUpgrade: true,
      autoMinorVersionUpgrade: true,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      vpcSubnets: vpcSubnets,
      vpc: vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      storageEncrypted: true,
      monitoringInterval: Duration.seconds(60),
      enablePerformanceInsights: true,
      parameterGroup: dbParameterGroup,
      subnetGroup: dbSubnetGroup,
      // preferredBackupWindow: props.backupWindow,
      // preferredMaintenanceWindow: props.preferredMaintenanceWindow,
      publiclyAccessible: false,
    });

    mysqlInstance.addRotationSingleUser();

    // new CfnOutput(this, 'MysqlEndpoint', {
    //   exportName: 'MysqlEndPoint',
    //   value: mysqlInstance.dbInstanceEndpointAddress,
    // });

    // new CfnOutput(this, 'MysqlUserName', {
    //   exportName: 'MysqlUserName',
    //   value: mysqlUsername,
    // });

    // new CfnOutput(this, 'MysqlDbName', {
    //   exportName: 'MysqlDbName',
    //   value: props.dbName!,
    // });

    return { databaseName, mysqlUsername, endPoint: mysqlInstance.dbInstanceEndpointAddress };
  }

  api(
    builds: Bucket,
  ): Function {
    // Lambda for the Node API
    const api = ZipFunction.node(this, 'api', {
      environment: {
      },
      functionProps: {
        memorySize: 3008,
        // code: Code.fromBucket(builds, 'api.zip'), // This can be uncommented once you've run a build of the API code
      },
    });
    console.log('API Lambda:', builds.bucketName); // TEMP: pass lint

    return api;
  }
}
