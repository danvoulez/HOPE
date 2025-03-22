const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HOPE API está funcionando!' });
});

// Rota para qualquer outra requisição que não seja para a API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor HOPE iniciado na porta ${PORT}`);
});
