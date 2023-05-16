import { NestedStack,Duration, CfnOutput }  from 'aws-cdk-lib';
import { LambdaIntegration, MockIntegration,RestApi,PassthroughBehavior,
   TokenAuthorizer, Cors,ResponseType,AwsIntegration,ContentHandling,EndpointType,EmptyModel} from 'aws-cdk-lib/aws-apigateway';
import * as iam from "aws-cdk-lib/aws-iam";

export function addCorsOptions(apiResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}


export class ApiGatewayStack extends NestedStack {
    /**
     *
     * @param {Construct} scope
     * @param {string} id
     * @param {StackProps=} props
     */
    endpoint = ''

    constructor(scope, id, props) {
      super(scope, id, props);
    
      // console.log('props:',props)

    const lambda_fn = props.lambda_fn;


    const api = new RestApi(this, 'MainBrainProxy', {
      cloudWatchRole:true,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS
      },
    });

    api.addGatewayResponse('cors1',{  
      type:ResponseType.ACCESS_DENIED,
      statusCode: '500',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      }
    });
    api.addGatewayResponse('cors2',{  
      type:ResponseType.DEFAULT_4XX,
      statusCode: '400',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      }
    });
    api.addGatewayResponse('cors3',{  
      type:ResponseType.DEFAULT_5XX,
      statusCode: '500',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      }
    });
    this.endpoint = api.url;
    new CfnOutput(this, `API gateway endpoint url`,{value:`${api.url}`});

    const fnIntegration = new LambdaIntegration(lambda_fn,{
      proxy:false,
      integrationResponses:[{statusCode:'200'}]
    });
    const postMethod = api.root.addMethod('POST', fnIntegration,
    {
      methodResponses:[{
        statusCode: '200',
        responseModels: {
          'application/json': new EmptyModel(),
        }
      }
      ]
    });

    }
}

