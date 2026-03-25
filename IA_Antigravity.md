# Projeto FX TAO - Documentação para Agentes (Antigravity)

**Cliente:** Engetec
**Status:** Em Produção (VPS)
**URL:** [https://fx4appstao.engetec.com](https://fx4appstao.engetec.com)

---

## 1. Visão Geral
O **FX TAO** é um sistema de **Termo de Abertura de Obra** desenvolvido para a Engetec. Ele gerencia o ciclo de vida inicial de obras, desde a criação do contrato até a aprovação final, incluindo geolocalização, gestão financeira e aprovações.

### Stack Tecnológica
- **Frontend:** React (Vite) + TailwindCSS + Shadcn/UI
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL (via Prisma ORM)
- **Auth:** Híbrida (Local + Microsoft Entra ID/SSO)
- **Infra:** Docker Compose (Nginx Reverse Proxy na VPS)

---

## 2. Estrutura de Documentação (Raiz do Projeto)

Arquivos essenciais criados para guiar o desenvolvimento e manutenção:

*   📄 **`maintenance_guide.md`**:
    *   **Uso:** Guia OBRIGATÓRIO para realizar deploys e updates na VPS.
    *   **Contém:** Fluxos seguros para Frontend, Backend e Migrations de Banco.

*   📄 **`vps_agent_handover.md`**:
    *   **Uso:** Prompt inicial para conectar novos Agentes de IA diretamente na VPS.
    *   **Contém:** Comandos cheaseat, caminhos de diretórios (`/opt/fxtao`) e regras de operação.

*   📄 **`task.md`** / **`walkthrough.md`** (Artefatos):
    *   **Uso:** Histórico de implementações recentes (Paginação, SSO, Deep Links, Geolocalização).

---

## 3. Estado Atual (Ponto de Partida)

*   **Deploy:** O sistema está rodando estável na VPS.
*   **Banco de Dados:** Produção inicializada. Usuário Admin padrão: `admin@fxtao.com`.
*   **Funcionalidades Recentes:**
    *   SSO Microsoft 365 configurado.
    *   Mapa de Calor (Heatmap) com auto-zoom em todas as obras.
    *   Paginação na listagem de TAO (10 itens/página).
    *   Integração ViaCEP e Nominatim (Lat/Lng).

---

## 4. Prompt de Continuidade (Para o Próximo Agente)

Se você é um novo agente assumindo este projeto, use o seguinte contexto inicial:

> "Você está assumindo o projeto **FX TAO (Engetec)**. O sistema está em produção.
>
> 1.  **Antes de codar:** Leia `IA_Antigravity.md` e `maintenance_guide.md`.
> 2.  **Verifique o ambiente:** Se estiver local, use `docker compose up`. Se estiver na VPS, USE OS COMANDOS de `vps_agent_handover.md`.
> 3.  **Banco de Dados:** NUNCA use `prisma db push` em produção. Use Migrations.
> 4.  **Objetivo Atual:** Manter a estabilidade e evoluir funcionalidades conforme demanda do cliente (ex: ajustes em telas de fases da TAO).
>
> O código está atualizado com as últimas features de Deep Link e Geolocalização. Prossiga com cuidado e documente tudo."
