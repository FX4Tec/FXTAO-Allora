# Plano de Implementação: Conclusão da Migração FX TAO

Este plano detalha as etapas para finalizar a migração do FX TAO para a arquitetura standalone (Docker/Node/React/Postgres).

## Objetivo
Tornar o aplicativo FX TAO totalmente funcional no ambiente containerizado atual, conectando o Frontend (`fxtao_web`) ao Backend (`fxtao`) e persistindo dados no Banco (`fxtao_db`).

## Estado Atual
- **Infraestrutura:** Containers Docker (API, Web, DB) rodando.
- **Banco de Dados:** Schema definido e migrations aplicadas via OpenSSL.
- **Backend:** Estrutura básica pronta com Auth Middleware. Lógica de negócios (Controllers) pendente.
- **Frontend:** Build estático servido, mas contém dependências legadas do Base44 SDK.

---

## Fases de Implementação

### Fase 1: Implementação do Backend (Lógica de Negócios)
**Objetivo:** Garantir que a API responda corretamente às requisições.

1.  **Autenticação (`authController.js`):**
    -   [ ] Implementar criptografia de senha (`bcryptjs`).
    -   [ ] Implementar geração de Token JWT (`jsonwebtoken`) no login.
    -   [ ] Criar script de **Seed** para criar o usuário admin inicial (`admin@fxtao.com`).

2.  **Gerenciamento de TAOs (`taoController.js`):**
    -   [ ] Implementar `create` (POST): Receber JSON e salvar com relações aninhadas.
    -   [ ] Implementar `findAll` (GET) com paginação.
    -   [ ] Implementar `findOne` (GET) retornando dados completos.
    -   [ ] Implementar `update` (PUT).

### Fase 2: Adaptação do Frontend
**Objetivo:** Remover legado e conectar à nova API.

1.  **Configuração de API Client:**
    -   [ ] Criar instância do `axios` apontando para a API (`http://localhost:3000`).
    -   [ ] Configurar interceptor para anexar o Token JWT.

2.  **Limpeza de Código (Refactoring):**
    -   [ ] Remover imports de `@base44/sdk`.
    -   [ ] Substituir chamadas de função do SDK pelas novas chamadas de API.

3.  **Implementação de Telas Chave:**
    -   [ ] **Login:** Formulário conectando a `/auth/login`.
    -   [ ] **Dashboard/Listagem:** Buscar dados de `/taos`.
    -   [ ] **Formulário de TAO:** Enviar payload JSON para `/taos`.

### Fase 3: Verificação e Testes
1.  **Teste de Fluxo:** Login -> Criar TAO -> Listar -> Detalhes.
2.  **Validação de Dados:** Verificar persistência no Postgres.

---

## Próximos Passos Imediatos

1.  Criar script de seed para usuário inicial.
2.  Implementar `authController.js` login.
3.  Adaptar tela de Login do Frontend.
