const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Modelo de usuário simulado (em produção, use um banco de dados)
const users = [
  {
    id: 1,
    username: 'admin',
    // Senha: admin123 (hash)
    password: '$2a$10$aCfXwqu8mUZEZJRlf/KhWuTW9dQr9A.UcDtXsVKTZLX0MoB8A2Bm6',
    name: 'Administrador',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    // Senha: user123 (hash)
    password: '$2a$10$aCfXwqu8mUZEZJRlf/KhWuLQNFBQNEJ/6jEpRaKIQCQFQNGhjOhDW',
    name: 'Usuário Padrão',
    role: 'user'
  }
];

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuário e gerar token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, forneça nome de usuário e senha' 
      });
    }

    // Verificar se o usuário existe
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }

    // Criar payload do token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    // Gerar token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'hope_secret_key_dev',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obter informações do usuário atual
 * @access  Private
 */
router.get('/me', (req, res) => {
  try {
    // Verificar token no cabeçalho
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido, acesso negado' 
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET || 'hope_secret_key_dev', (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token inválido' 
        });
      }

      // Encontrar usuário
      const user = users.find(u => u.id === decoded.user.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      // Retornar informações do usuário (sem a senha)
      const { password, ...userInfo } = user;
      res.json({
        success: true,
        user: userInfo
      });
    });
  } catch (err) {
    console.error('Erro ao obter usuário:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
});

module.exports = router;
