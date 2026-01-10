import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const openApiSpec = YAML.load(path.join(__dirname, '../openapi.yaml'));

export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });
};
