
import { Construct } from 'constructs';
import {
  githubActions,
} from '@scloud/cdk-patterns';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { InstanceClass, InstanceSize, InstanceType, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, ParameterGroup } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { EC2WebApp } from './EC2WebApp.js';

// Credentials
// PERSONAL_ACCESS_TOKEN - create a Github personal access token (classic) with 'repo' scope and set this in .infrastructure/secrets/github.sh using export PERSONAL_ACCESS_TOKEN=ghp_...
// AWS_PROFILE           - if you've set up a profile to access this account, set this in .infrastructure/secrets/aws.sh using export AWS_PROFILE=...

// Route 53
const DOMAIN_NAME = 'alwayson.greenersoftware.net';
const ZONE_ID = 'Z02969861Z406S70ML8A3';

// Github - set in .infrastructure/secrets/github.sh along with PERSONAL_ACCESS_TOKEN
// const OWNER = 'GreenerSoftware';
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

    // This only needs to be created once per account.
    githubActions(this).ghaOidcProvider();

    // DNS zone
    const zone = this.zone(DOMAIN_NAME, ZONE_ID);

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

    // Cloudfront -> ALB -> ASG -> EC2
    const ec2Webapp = new EC2WebApp(this, 'alwaysOn', {
      zone,
      domainName: DOMAIN_NAME,
      defaultIndex: false,
      redirectWww: true,
      distributionProps: {
        defaultBehavior: defaultBehavior as cloudfront.BehaviorOptions,
      },
    });

    // RDS
    this.rds(ec2Webapp);

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
   * Based on: https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/rds/mysql/mysql.ts
   */
  rds(ec2Webapp: EC2WebApp): { databaseName: string, mysqlUsername: string, endPoint: string; } {
    const vpc = ec2Webapp.vpc;

    // Database connection details
    const mysqlUsername = "admin";
    const databaseName = "db";
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

    // Database security group
    const dbsg = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Database',
      securityGroupName: 'Database',
    });
    dbsg.addIngressRule(dbsg, Port.allTraffic(), 'all from self');
    dbsg.addIngressRule(ec2Webapp.asg.connections.securityGroups[0], Port.tcpRange(3306, 3306), 'inbound from ec2 asg');

    // Create database instance
    const databaseInstance = new DatabaseInstance(this, 'MysqlDatabase', {
      databaseName,
      instanceIdentifier: 'database',
      credentials: mysqlCredentials,
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_37,
      }),
      backupRetention: Duration.days(7),
      allocatedStorage: 20,
      securityGroups: [dbsg],
      allowMajorVersionUpgrade: true,
      autoMinorVersionUpgrade: true,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      // vpcSubnets: {
      //   subnets: vpc.privateSubnets,
      // },
      vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      storageEncrypted: true,
      monitoringInterval: Duration.seconds(60),
      parameterGroup: new ParameterGroup(this, 'ParameterGroup', {
        engine: DatabaseInstanceEngine.mysql({
          version: MysqlEngineVersion.VER_8_0_37,
        }),
      }),
      // subnetGroup: new SubnetGroup(this, 'DatabaseSubnetGroup', {
      //   vpc,
      //   description: 'Database subnet group',
      //   vpcSubnets: {
      //     subnets: vpc.privateSubnets,
      //   },
      //   subnetGroupName: 'Database subnet group',
      // }),
      publiclyAccessible: false,
    });
    databaseInstance.addRotationSingleUser();

    // new CfnOutput(this, 'MysqlEndpoint', {
    //   exportName: 'MysqlEndPoint',
    //   value: databaseInstance.dbInstanceEndpointAddress,
    // });

    // new CfnOutput(this, 'MysqlUserName', {
    //   exportName: 'MysqlUserName',
    //   value: mysqlUsername,
    // });

    // new CfnOutput(this, 'MysqlDbName', {
    //   exportName: 'MysqlDbName',
    //   value: props.dbName!,
    // });

    githubActions(this).addGhaVariable('secretName', 'rds', mysqlSecret.secretName);
    githubActions(this).addGhaVariable('secretArn', 'rds', mysqlSecret.secretArn);
    githubActions(this).addGhaVariable('hostname', 'rds', databaseInstance.instanceEndpoint.hostname);
    githubActions(this).addGhaVariable('port', 'rds', `${databaseInstance.instanceEndpoint.port}`);

    return { databaseName, mysqlUsername, endPoint: databaseInstance.dbInstanceEndpointAddress };
  }

}
