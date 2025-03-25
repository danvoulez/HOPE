const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configurações de segurança
app.use(helmet());

// Configuração de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Middleware para parsing de JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Importar rotas de autenticação
const authRoutes = require('./routes/auth');
// Importar rotas de webhooks
const webhookRoutes = require('./routes/webhooks');

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'HOPE API está funcionando!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota de exemplo para demonstrar funcionalidade
app.get('/api/features', (req, res) => {
  res.json({
    features: [
      { id: 1, name: 'Integração de Sistemas', description: 'Conecte diferentes sistemas e aplicações' },
      { id: 2, name: 'Automação de Processos', description: 'Automatize tarefas repetitivas com IA' },
      { id: 3, name: 'Dashboards Personalizáveis', description: 'Visualize dados importantes em tempo real' },
      { id: 4, name: 'Rastreamento em Tempo Real', description: 'Acompanhe recursos e entregas em tempo real' }
    ]
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Rota para qualquer outra requisição que não seja para a API
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Conectar ao banco de dados e iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB se estiver configurado
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.log('Aviso: MONGODB_URI não configurado. Executando sem banco de dados.');
    }
    
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor HOPE iniciado na porta ${PORT} em modo ${NODE_ENV}`);
    });
  } catch (error) {
    console.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});
