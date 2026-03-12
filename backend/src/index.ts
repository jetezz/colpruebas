import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const APP_NAME = process.env.APP_NAME || 'colpruebas';
const ENVIRONMENT = process.env.ENVIRONMENT || 'production';


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  const message = ENVIRONMENT === 'test'
    ? 'API de test funcionando'
    : 'API de prod funcionando';

  res.json({
    app: APP_NAME,
    message: message,
    environment: ENVIRONMENT,

    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    app: APP_NAME,
    environment: ENVIRONMENT,

    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[${APP_NAME}] ${ENVIRONMENT} API server running on port ${PORT}`);

});
