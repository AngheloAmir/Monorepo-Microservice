const path = require("path");
const { spawn } = require("child_process");

/* ======================================================
   CONFIG — YOU EDIT ONLY THIS
====================================================== */

const aws = {
  provider: "localstack",        // "localstack" | "aws"
  region: "us-east-1",
  accessKey: "test",
  secretKey: "test",
  endpoint: "http://localhost:4566"
};

const services = [
  {
    name: "foodmaker",
    type: "frontend",
    dir: "../../frontend/foodmaker"
  },
  {
    name: "nodeserver",
    type: "backend",
    dir: "../../backend/nodeserver",
    runtime: "nodejs18.x",
    handler: "lambda.handler",
    apiPath: "/api/{proxy+}"
  },
  {
    name: "users",
    type: "backend",
    dir: "../../backend/users-python",
    runtime: "python3.11",
    handler: "app.handler",
    apiPath: "/users/{proxy+}"
  },
  {
    name: "billing",
    type: "backend",
    image: "billing-api:latest",
    runtime: "docker",
    apiPath: "/billing/{proxy+}"
  }
];

const dynamoTables = [
  { name: "Users", hashKey: "id" },
  { name: "Orders", hashKey: "orderId" }
];

/* ======================================================
   INTERNAL SETUP
====================================================== */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  orange: "\x1b[38;5;208m",
  red: "\x1b[31m"
};

const ENDPOINT =
  aws.provider === "localstack" ? `--endpoint-url=${aws.endpoint}` : "";

process.env.AWS_ACCESS_KEY_ID = aws.accessKey;
process.env.AWS_SECRET_ACCESS_KEY = aws.secretKey;
process.env.AWS_DEFAULT_REGION = aws.region;

/* ======================================================
   EXPORT
====================================================== */

module.exports = {
  runDeploy: async (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked"
    });

    const log = (msg, c = colors.reset) =>
      res.write(`${c}${msg}${colors.reset}\n`);

    const run = (cmd, args, cwd) =>
      new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { cwd, shell: true });
        let out = "";
        p.stdout.on("data", d => { out += d; res.write(d); });
        p.stderr.on("data", d => res.write(colors.yellow + d + colors.reset));
        p.on("close", c => c === 0 ? resolve(out) : reject(new Error(cmd + " failed")));
      });

    try {
      log("\n🚀 Deploying Polyglot Cloud", colors.orange);

      /* IAM */
      await run("aws", [ENDPOINT, "iam", "create-role", "--role-name", "lambda-role",
        "--assume-role-policy-document",
        `'{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'`
      ]).catch(()=>{});

      /* DynamoDB */
      for (const t of dynamoTables) {
        await run("aws", [ENDPOINT, "dynamodb", "create-table",
          "--table-name", t.name,
          "--attribute-definitions", `AttributeName=${t.hashKey},AttributeType=S`,
          "--key-schema", `AttributeName=${t.hashKey},KeyType=HASH`,
          "--billing-mode", "PAY_PER_REQUEST"
        ]).catch(()=>{});
      }

      /* Services */
      for (const svc of services) {

        /* Frontend */
        if (svc.type === "frontend") {
          const bucket = `${svc.name}-frontend`;
          await run("aws", [ENDPOINT, "s3", "mb", `s3://${bucket}`]).catch(()=>{});
          await run("aws", [ENDPOINT, "s3", "sync", path.resolve(__dirname, svc.dir), `s3://${bucket}`, "--acl", "public-read"]);
          svc.url = `http://localhost:4566/${bucket}/index.html`;
        }

        /* Backend (ZIP) */
        if (svc.type === "backend" && svc.runtime !== "docker") {
          const zip = `/tmp/${svc.name}.zip`;
          const bucket = `${svc.name}-code`;

          await run("zip", ["-r", zip, ".", "-x", "*/.git/*"], path.resolve(__dirname, svc.dir));
          await run("aws", [ENDPOINT, "s3", "mb", `s3://${bucket}`]).catch(()=>{});
          await run("aws", [ENDPOINT, "s3", "cp", zip, `s3://${bucket}/code.zip`]);

          await run("aws", [ENDPOINT, "lambda", "delete-function", "--function-name", svc.name]).catch(()=>{});
          await run("aws", [ENDPOINT, "lambda", "create-function",
            "--function-name", svc.name,
            "--runtime", svc.runtime,
            "--handler", svc.handler,
            "--code", `S3Bucket=${bucket},S3Key=code.zip`,
            "--role", "arn:aws:iam::000000000000:role/lambda-role"
          ]);
        }

        /* Backend (Docker) */
        if (svc.type === "backend" && svc.runtime === "docker") {
          await run("aws", [ENDPOINT, "lambda", "delete-function", "--function-name", svc.name]).catch(()=>{});
          await run("aws", [ENDPOINT, "lambda", "create-function",
            "--function-name", svc.name,
            "--package-type", "Image",
            "--code", `ImageUri=${svc.image}`,
            "--role", "arn:aws:iam::000000000000:role/lambda-role"
          ]);
        }

        /* API Gateway */
        if (svc.type === "backend") {
          const api = await run("aws", [ENDPOINT, "apigatewayv2", "create-api", "--name", svc.name, "--protocol-type", "HTTP"]);
          const apiId = JSON.parse(api).ApiId;

          const integ = await run("aws", [ENDPOINT, "apigatewayv2", "create-integration",
            "--api-id", apiId,
            "--integration-type", "AWS_PROXY",
            "--integration-uri", `arn:aws:lambda:us-east-1:000000000000:function:${svc.name}`,
            "--payload-format-version", "2.0"
          ]);

          const integId = JSON.parse(integ).IntegrationId;

          await run("aws", [ENDPOINT, "apigatewayv2", "create-route",
            "--api-id", apiId,
            "--route-key", `ANY ${svc.apiPath}`,
            "--target", `integrations/${integId}`
          ]);

          await run("aws", [ENDPOINT, "apigatewayv2", "create-stage",
            "--api-id", apiId,
            "--stage-name", "prod",
            "--auto-deploy"
          ]);

          svc.url = `http://localhost:4566/restapis/${apiId}/prod/_user_request_`;
        }
      }

      log("\n🌍 URLs", colors.orange);
      services.forEach(s => log(`• ${s.name}: ${s.url}`, colors.cyan));
      log("\n✅ Cloud Ready", colors.green);
    } catch (e) {
      log("\n❌ " + e.message, colors.red);
    }

    res.end();
  }
};

