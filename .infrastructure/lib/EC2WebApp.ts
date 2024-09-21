import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget, LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { LoadBalancerV2Origin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  AllowedMethods, CachePolicy, Distribution,
  DistributionProps,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { githubActions, PrivateBucket, RedirectWww } from '@scloud/cdk-patterns';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';

const sandboxAccountId = '058264171014'; // Account ID for the Sandbox account
const amiName = 'GreenerSoftwareFrontend'; // Machine Image for the app, shared from the Sandbox account

/**
 * @param zone The DNS zone for this web app.
 * @param domainName Optional: by default the zone name will be used (e.g. 'example.com') a different domain here (e.g. 'subdomain.example.com').
 * @param defaultIndex Default: false. If true, maps a viewer request for '/' to an s3 request for /index.html.
 * @param redirectWww Default: true. Redirects www requests to the bare domain name, e.g. www.example.com->example.com, www.sub.example.com->sub.example.com.
 * @param distributionProps Optional: additional properties for the CloudFront distribution.
 * @param vpc Optional: a VPC for the EC2 instance. Default is to create a new vpc.
 * @param natGateways Optional: if vpc isn't supplied the number of NAT gateways to create in the new VPC. Default is 0.
 */
export interface EC2WebAppProps {
  zone: IHostedZone,
  domainName?: string,
  defaultIndex?: boolean,
  redirectWww?: boolean,
  distributionProps?: Partial<DistributionProps>,
  vpc?: Vpc,
  natGateways?: number,
}

/**
 * Builds a dynamic web application, backed by a single Lambda function, also knowm as a "Lambda-lith" (https://github.com/cdk-patterns/serverless/blob/main/the-lambda-trilogy/README.md)
 *
 * This construct sends requests that don't have a file extension to the Lambda. Static content is handled by routing requests that match *.* (eg *.js. *.css) to an S3 bucket.
 */
export class EC2WebApp extends Construct {

  bucket: Bucket;

  distribution: Distribution;

  certificate: DnsValidatedCertificate;

  alb: ApplicationLoadBalancer;

  asg: AutoScalingGroup;

  vpc: Vpc;

  constructor(
    scope: Construct,
    id: string,
    props: EC2WebAppProps,
  ) {
    super(scope, `${id}EC2WebApp`);

    const domainName = props.domainName || `${props.zone.zoneName}`;

    // Static content
    const bucket = PrivateBucket.expendable(scope, `${id}Static`);
    githubActions(scope).addGhaBucket(id, bucket);

    // Permissions to access the bucket from Cloudfront
    const originAccessIdentity = new OriginAccessIdentity(scope, `${id}OAI`, {
      comment: 'Access to static bucket',
    });
    bucket.grantRead(originAccessIdentity);

    this.certificate = new DnsValidatedCertificate(scope, `${id}Certificate`, {
      domainName,
      hostedZone: props.zone,
      region: 'us-east-1',
      subjectAlternativeNames: props.redirectWww !== false ? [`www.${domainName}`] : undefined,
    });

    // VPC for EC2 instance
    this.vpc = props.vpc || new Vpc(scope, `${id}Vpc`, {
      natGateways: props.natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateIsolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'PrivateEgress',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.asg = new AutoScalingGroup(this, `${id}ASG`, {
      vpc: this.vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.SMALL),
      machineImage: MachineImage.lookup({
        name: amiName,
        owners: [sandboxAccountId],
      }),
      allowAllOutbound: true,
      // healthCheck: HealthCheck.ec2(),
    });

    // ALB for ASG
    this.alb = new ApplicationLoadBalancer(this, `${id}Alb`, {
      vpc: this.vpc,
      internetFacing: true
    });
    new ARecord(this, 'AliasRecord', {
      zone: props.zone,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this.alb)),
      recordName: 'alb',
    });

    // Add a listener and open up the load balancer's security group
    // to the world.
    const listener = this.alb.addListener(`${id}ALBListener`, {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
    });
    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

    // Create an AutoScaling group and add it as a load balancing
    // target to the listener.
    listener.addTargets(`${id}ALBTarget`, {
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targets: [this.asg],
      healthCheck: {
        healthyHttpCodes: "200,301,302",
        port: '3000',
        path: '/deer-return/',
      }
    });

    this.asg.scaleOnRequestCount(`${id}ModestLoad`, {
      targetRequestsPerMinute: 60,
    });

    // This enables us to separate out the defaultBehavior props (if any) from the distributionProps (if provided)
    // See https://stackoverflow.com/a/34710102/723506 for an explanation of this destructuring
    const { defaultBehavior, additionalBehaviors, ...distributionProps } = props.distributionProps || ({} as Partial<DistributionProps>);
    this.distribution = new Distribution(scope, `${id}Distribution`, {
      domainNames: [domainName],
      comment: domainName,
      defaultRootObject: props.defaultIndex ? 'index.html' : undefined,
      defaultBehavior: {
        origin: new LoadBalancerV2Origin(this.alb),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_DISABLED, // Assume dynamic content
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        // fallbackOrigin: {},
        ...defaultBehavior,
      },
      // All requests for something with a file extension go to s3 (actually, any path that contains a period).
      // The aim is to route *.css, *.js, *.jpeg, etc)
      additionalBehaviors: {
        '*.*': {
          origin: new S3Origin(bucket, { originAccessIdentity }),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          compress: true,
        },
        ...additionalBehaviors,
      },
      certificate: this.certificate,
      ...distributionProps,
    });
    githubActions(scope).addGhaDistribution(id, this.distribution);

    // DNS record for the Cloudfront distribution
    new ARecord(scope, `${id}ARecord`, {
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      zone: props.zone,
    });

    if (props.redirectWww !== false) new RedirectWww(scope, id, { zone: props.zone, certificate: this.certificate, domainName });
  }

  // This allows access to secrets manager from the VPC. I believe it's cheaper thatn NAT gateways.
  // Some info here: https://repost.aws/questions/QUmfyiKedjTd225PQS7MlHQQ/vpc-nat-gateway-vs-vpc-endpoint-pricing
  // vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  //   service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  // });

  // Possible CI/CD deployment model:
  // https://aws.amazon.com/blogs/devops/integrating-with-github-actions-ci-cd-pipeline-to-deploy-a-web-app-to-amazon-ec2/
  // this.ec2(vpc);

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

}
