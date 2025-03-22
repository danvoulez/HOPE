#!/usr/bin/env node

/**
 * Script de verificação pré-deploy para Vercel
 * 
 * Este script verifica se a configuração do projeto está correta para deploy no Vercel,
 * identificando problemas comuns antes de tentar fazer o deploy.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Diretórios e arquivos importantes
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const VERCEL_CONFIG = path.join(ROOT_DIR, 'vercel.json');
const FRONTEND_VERCEL_CONFIG = path.join(FRONTEND_DIR, 'vercel.json');
const PACKAGE_JSON = path.join(FRONTEND_DIR, 'package.json');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'scripts', 'build.js');
const ENV_FILE = path.join(FRONTEND_DIR, '.env');
const ENV_EXAMPLE_FILE = path.join(FRONTEND_DIR, '.env.example');

// Contadores para o relatório
let passCount = 0;
let warnCount = 0;
let errorCount = 0;

console.log(chalk.blue.bold('🚀 Iniciando verificação pré-deploy para Vercel\n'));

// Função para verificar se um arquivo existe
function checkFileExists(filePath, required = true, suggestion = '') {
  const relativePath = path.relative(ROOT_DIR, filePath);
  
  if (fs.existsSync(filePath)) {
    console.log(chalk.green(`✓ ${relativePath} encontrado`));
    passCount++;
    return true;
  } else {
    if (required) {
      console.log(chalk.red(`✗ ${relativePath} não encontrado (OBRIGATÓRIO)`));
      if (suggestion) console.log(chalk.yellow(`  Sugestão: ${suggestion}`));
      errorCount++;
    } else {
      console.log(chalk.yellow(`⚠ ${relativePath} não encontrado (opcional)`));
      if (suggestion) console.log(chalk.yellow(`  Sugestão: ${suggestion}`));
      warnCount++;
    }
    return false;
  }
}

// Verificar arquivos de configuração do Vercel
console.log(chalk.blue.bold('\n📁 Verificando arquivos de configuração:'));

const hasVercelConfig = checkFileExists(
  VERCEL_CONFIG, 
  true, 
  'Crie um arquivo vercel.json na raiz do projeto'
);

checkFileExists(
  FRONTEND_VERCEL_CONFIG, 
  false, 
  'Considere ter um vercel.json específico para o frontend'
);

// Verificar package.json e scripts
console.log(chalk.blue.bold('\n📦 Verificando package.json e scripts:'));

const hasPackageJson = checkFileExists(
  PACKAGE_JSON, 
  true, 
  'Crie um package.json no diretório frontend'
);

// Verificar conteúdo do package.json
if (hasPackageJson) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    
    // Verificar scripts necessários
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(chalk.green('✓ Script de build encontrado em package.json'));
      passCount++;
    } else {
      console.log(chalk.red('✗ Script de build não encontrado em package.json'));
      console.log(chalk.yellow('  Sugestão: Adicione "build": "react-scripts build" aos scripts'));
      errorCount++;
    }
    
    // Verificar dependências
    const requiredDeps = ['react', 'react-dom'];
    const missingDeps = requiredDeps.filter(
      dep => !(packageJson.dependencies && packageJson.dependencies[dep])
    );
    
    if (missingDeps.length === 0) {
      console.log(chalk.green('✓ Todas as dependências essenciais encontradas'));
      passCount++;
    } else {
      console.log(chalk.red(`✗ Dependências essenciais faltando: ${missingDeps.join(', ')}`));
      console.log(chalk.yellow('  Sugestão: Instale as dependências com npm install'));
      errorCount++;
    }
  } catch (error) {
    console.log(chalk.red(`✗ Erro ao analisar package.json: ${error.message}`));
    errorCount++;
  }
}

// Verificar configuração do Vercel
console.log(chalk.blue.bold('\n⚙️ Verificando configuração do Vercel:'));

if (hasVercelConfig) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(VERCEL_CONFIG, 'utf8'));
    
    // Verificar configuração de build
    if (vercelConfig.buildCommand) {
      console.log(chalk.green(`✓ Comando de build configurado: ${vercelConfig.buildCommand}`));
      passCount++;
    } else {
      console.log(chalk.yellow('⚠ Comando de build não configurado em vercel.json'));
      console.log(chalk.yellow('  Sugestão: Adicione "buildCommand": "cd frontend && npm run build"'));
      warnCount++;
    }
    
    // Verificar diretório de saída
    if (vercelConfig.outputDirectory) {
      console.log(chalk.green(`✓ Diretório de saída configurado: ${vercelConfig.outputDirectory}`));
      passCount++;
    } else {
      console.log(chalk.yellow('⚠ Diretório de saída não configurado em vercel.json'));
      console.log(chalk.yellow('  Sugestão: Adicione "outputDirectory": "frontend/build"'));
      warnCount++;
    }
    
    // Verificar configuração de rotas
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      console.log(chalk.green('✓ Configuração de rotas (rewrites) encontrada'));
      
      // Verificar se há rota para a API
      const hasApiRoute = vercelConfig.rewrites.some(
        route => route.source && route.source.includes('/api/')
      );
      
      if (hasApiRoute) {
        console.log(chalk.green('✓ Rota para API configurada'));
        passCount++;
      } else {
        console.log(chalk.yellow('⚠ Nenhuma rota para API configurada'));
        console.log(chalk.yellow('  Sugestão: Adicione uma rota para redirecionar chamadas de API'));
        warnCount++;
      }
    } else {
      console.log(chalk.yellow('⚠ Configuração de rotas (rewrites) não encontrada'));
      console.log(chalk.yellow('  Sugestão: Configure rewrites para SPA e API'));
      warnCount++;
    }
  } catch (error) {
    console.log(chalk.red(`✗ Erro ao analisar vercel.json: ${error.message}`));
    errorCount++;
  }
}

// Verificar variáveis de ambiente
console.log(chalk.blue.bold('\n🔐 Verificando variáveis de ambiente:'));

const hasEnvFile = checkFileExists(
  ENV_FILE, 
  false, 
  'Crie um arquivo .env com as variáveis necessárias'
);

checkFileExists(
  ENV_EXAMPLE_FILE, 
  false, 
  'Crie um arquivo .env.example com exemplos das variáveis necessárias'
);

if (hasEnvFile) {
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Verificar variáveis essenciais
    if (envContent.includes('REACT_APP_API_URL')) {
      console.log(chalk.green('✓ Variável REACT_APP_API_URL encontrada'));
      passCount++;
    } else {
      console.log(chalk.yellow('⚠ Variável REACT_APP_API_URL não encontrada'));
      console.log(chalk.yellow('  Sugestão: Adicione REACT_APP_API_URL ao arquivo .env'));
      warnCount++;
    }
  } catch (error) {
    console.log(chalk.red(`✗ Erro ao ler arquivo .env: ${error.message}`));
    errorCount++;
  }
}

// Verificar se o build funciona localmente
console.log(chalk.blue.bold('\n🛠️ Testando build local:'));

try {
  console.log('Executando build de teste (pode demorar um pouco)...');
  execSync('cd ' + FRONTEND_DIR + ' && npm run build --if-present', { stdio: 'pipe' });
  console.log(chalk.green('✓ Build local executado com sucesso'));
  
  // Verificar se o diretório build foi criado
  const buildDir = path.join(FRONTEND_DIR, 'build');
  if (fs.existsSync(buildDir)) {
    console.log(chalk.green('✓ Diretório build criado com sucesso'));
    passCount++;
  } else {
    console.log(chalk.red('✗ Diretório build não foi criado'));
    errorCount++;
  }
} catch (error) {
  console.log(chalk.red(`✗ Erro ao executar build local: ${error.message}`));
  console.log(chalk.yellow('  Verifique os erros acima e corrija os problemas no código'));
  errorCount++;
}

// Resumo final
console.log(chalk.blue.bold('\n📊 Resumo da verificação:'));
console.log(chalk.green(`✓ ${passCount} verificações passaram`));
console.log(chalk.yellow(`⚠ ${warnCount} avisos (podem não impedir o deploy)`));
console.log(chalk.red(`✗ ${errorCount} erros (podem impedir o deploy)`));

if (errorCount > 0) {
  console.log(chalk.red.bold('\n❌ Seu projeto tem problemas que podem impedir o deploy no Vercel.'));
  console.log(chalk.red('   Corrija os erros acima antes de tentar fazer o deploy.'));
  process.exit(1);
} else if (warnCount > 0) {
  console.log(chalk.yellow.bold('\n⚠️ Seu projeto tem alguns avisos, mas provavelmente pode ser implantado.'));
  console.log(chalk.yellow('   Considere corrigir os avisos para uma experiência melhor.'));
  process.exit(0);
} else {
  console.log(chalk.green.bold('\n✅ Seu projeto está pronto para ser implantado no Vercel!'));
  console.log(chalk.green('   Execute "vercel" ou faça push para o GitHub para iniciar o deploy.'));
  process.exit(0);
}
