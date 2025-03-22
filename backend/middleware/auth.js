const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rotas que exigem autenticação
 */
module.exports = function(req, res, next) {
  // Obter token do cabeçalho
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acesso negado. Token não fornecido.' 
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hope_secret_key_dev');
    
    // Adicionar usuário ao objeto de requisição
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Erro de autenticação:', err.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
  }
};
