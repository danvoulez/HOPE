# Dossiê: Evolução do Vox com OpenAI Agents SDK

## Visão Geral Refinada

Este dossiê apresenta um plano estratégico otimizado para a evolução do Vox através da integração com o OpenAI Agents SDK, incorporando uma abordagem equilibrada entre sofisticação técnica e simplicidade prática, com atenção especial à otimização de custos.

## Arquitetura Proposta

### Estrutura do Projeto

```text
vox/
├── .env
├── Dockerfile
├── README.md
├── requirements.txt
├── run_vox.py         (script de execução local)
├── tests/
│   ├── __init__.py
│   ├── test_agents.py
│   └── test_tools.py
├── vox_app.py         (FastAPI que expõe o Vox por HTTP)
├── config/
│   ├── __init__.py
│   ├── settings.py     (Pydantic Settings + dotenv)
│   ├── logger.py       (Logger configurado)
│   └── switcher.py     (Seletor inteligente de modelos)
├── agents/
│   ├── __init__.py
│   ├── main_agent.py   (Agente central)
│   ├── vendas.py
│   └── suporte.py
├── tools/
│   ├── __init__.py
│   ├── busca.py
│   └── produto.py
├── guardrails/
│   ├── __init__.py
│   └── basico.py
└── context/
    ├── __init__.py
    └── gerenciador.py
```

### Componentes Principais

1. **VoxAgentManager (main_agent.py)**
   - Gerencia o ciclo de vida dos agentes
   - Coordena handoffs entre agentes especializados
   - Implementa políticas de fallback e recuperação

2. **Agentes Especializados (vendas.py, suporte.py)**
   - Agentes dedicados a domínios específicos
   - Cada um com suas próprias ferramentas e instruções

3. **VoxToolRegistry (tools/)**
   - Ferramentas validadas com Pydantic
   - Implementa controle de acesso baseado em permissões
   - Fornece mecanismos de extensão para novas ferramentas

4. **VoxContextService (context/gerenciador.py)**
   - Gerencia o contexto da conversa
   - Implementa estratégias de recuperação de memória
   - Otimiza o uso de tokens e recursos

5. **VoxGuardrailsEngine (guardrails/basico.py)**
   - Implementa verificações de segurança e conformidade
   - Filtra conteúdo impróprio ou perigoso

6. **Model Switcher (config/switcher.py)**
   - Seleciona automaticamente entre GPT-3.5 e GPT-4
   - Otimiza custos baseado na complexidade da consulta

### Otimização de Custos

#### Estratégia de Switch Inteligente

```python
# vox/config/switcher.py
def choose_model(query: str, context: dict) -> str:
    """
    Seleciona o modelo com base na consulta e no contexto.
    
    Critérios:
    - Se a consulta tiver mais de 20 palavras ou contiver termos que indiquem
      necessidade de uma análise detalhada, usa GPT-4.
    - Caso contrário, utiliza GPT-3.5.
    """
    termos_complexos = ['detalhado', 'explicação profunda', 'análise complexa']
    if len(query.split()) > 20 or any(termo in query.lower() for termo in termos_complexos):
        return "gpt-4"
    return "gpt-3.5-turbo"
```

#### Estimativa de Custos

| Cenário | Usuários/dia | Tokens/conversa | Custo diário (GPT-3.5) | Custo diário (GPT-4) |
|---------|--------------|-----------------|------------------------|----------------------|
| Testes internos | 10 | 2k in / 1k out | ~$0.05 | ~$0.30–0.50 |
| Beta controlado | 50 | 2k in / 1k out | ~$0.25 | ~$1.50–2.50 |
| Produção média | 200 | 2k in / 1k out | ~$1.00–2.00 | ~$6–10 |

### Exemplo Realista (Vox em produção leve)

- 100 atendimentos por dia
- 80% com GPT-3.5, 20% com GPT-4
- Ferramentas bem distribuídas
- Infraestrutura hospedada em Railway + Mongo gratuito

### Custo estimado mensal

- OpenAI: $20–30
- Infraestrutura: $0–10
- Total: ~$30–40/mês

## Plano de Implementação Atualizado

### Fase 1: Análise e Preparação (2-3 semanas)

- Análise detalhada do SDK
- Prova de conceito com switch inteligente de modelos
- Planejamento de migração

### Fase 2: Implementação Inicial (4-6 semanas)

- Adaptação da camada de contexto
- Integração do loop de agente
- Implementação de guardrails básicos
- Configuração do switch inteligente de modelos

### Fase 3: Recursos Avançados (6-8 semanas)

- Implementação de multi-agentes
- Integração com WhatsApp e outros canais
- Personalização e extensão
- Otimização de custos e desempenho

### Fase 4: Finalização e Documentação (2-3 semanas)

- Testes abrangentes
- Documentação completa
- Treinamento e transição

## Estratégias de Otimização Adicionais

### Prompting Eficiente
   - Evitar envio de contexto desnecessário
   - Resumir histórico de conversas longas

2. **Caching de Respostas**
   - Armazenar respostas para perguntas frequentes
   - Implementar TTL (Time-To-Live) para atualização periódica

3. **Ferramentas Locais**
   - Usar ferramentas que não dependem da API da OpenAI quando possível
   - Implementar busca interna para reduzir chamadas à API

4. **Monitoramento de Uso**
   - Logs detalhados para rastrear uso de tokens
   - Dashboards para visualizar custos em tempo real

## Conclusão

A integração do OpenAI Agents SDK com estratégias inteligentes de otimização de custos representa uma evolução significativa para o Vox. Esta abordagem equilibra sofisticação técnica e praticidade, garantindo um sistema robusto e economicamente viável.

A implementação será conduzida de forma gradual, priorizando a estabilidade e compatibilidade com os sistemas existentes, enquanto introduz novas capacidades que ampliarão significativamente o valor do Vox para toda a plataforma.

## Exemplos de Implementação

### Agente Principal (main_agent.py)
```python
# vox/agents/main_agent.py
from openai.agents import Agent
from vox.agents.vendas import vendas_agent
from vox.agents.suporte import suporte_agent
from vox.tools.busca import busca_tool
from vox.tools.produto import produto_tool
from vox.guardrails.basico import guardrail_basico
from vox.context.gerenciador import contexto_memoria

main_agent = Agent(
    name="Vox",
    instructions=(
        "Você é o Vox, um agente central robusto. "
        "Detecte a intenção do usuário e delegue tarefas aos agentes especializados "
        "ou use as ferramentas adequadas para fornecer a resposta."
    ),
    tools=[busca_tool, produto_tool],
    handoffs=[vendas_agent, suporte_agent],
    guardrails=[guardrail_basico],
    context_manager=contexto_memoria
)
```

### Executor com Switch Inteligente (run_vox.py)
```python
# run_vox.py
from openai.agents import AgentExecutor
from vox.agents.main_agent import main_agent
from vox.config.logger import get_logger
from vox.config.switcher import choose_model

logger = get_logger("vox-run")

def executar_vox(query: str, user_id: str):
    # Recupera o contexto atual (poderia ser expandido para um armazenamento persistente)
    context = {}
    
    # Escolhe o modelo com base na consulta
    model_choice = choose_model(query, context)
    logger.info(f"Modelo escolhido: {model_choice} para a query: {query}")
    
    # Inicializa o executor com o modelo escolhido
    executor = AgentExecutor(agent=main_agent, model=model_choice)
    resposta = executor.run(query=query, user_id=user_id)
    
    logger.info(f"Query do usuário [{user_id}]: {query}")
    logger.info(f"Resposta gerada: {resposta}")
    return resposta
```

### API HTTP com FastAPI (vox_app.py)
```python
# vox_app.py
from fastapi import FastAPI, Body
from openai.agents import AgentExecutor
from vox.agents.main_agent import main_agent
from vox.config.logger import get_logger
from vox.config.switcher import choose_model

app = FastAPI(title="Vox API", version="1.0")
logger = get_logger("vox_api")

@app.post("/query")
def query_vox(user_id: str, query: str = Body(...)):
    logger.info(f"[HTTP] user_id={user_id}, query={query}")
    
    # Escolhe o modelo com base na consulta
    model_choice = choose_model(query, {})
    logger.info(f"Modelo escolhido: {model_choice}")
    
    # Inicializa o executor com o modelo escolhido
    executor = AgentExecutor(agent=main_agent, model=model_choice)
    resposta = executor.run(query=query, user_id=user_id)
    
    return {"resposta": resposta, "modelo_usado": model_choice}
```
