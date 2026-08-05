# Checklist de Hardening e Auditoria de VPS com Docker

## 1. Auditoria inicial
- Confirmar usuário atual, diretório raiz e versão do sistema.
- Levantar portas expostas com `ss -tulpn`.
- Conferir firewall (`ufw status verbose`) e regras efetivas.
- Validar estado do SSH e opções perigosas em `sshd_config`.
- Verificar pacotes pendentes de atualização e `unattended-upgrades`.

## 2. SSH e acesso
- Confirmar se existe usuário administrativo válido com chave SSH.
- Não desabilitar `root` ou senha antes de validar acesso alternativo.
- Reduzir `MaxAuthTries`, `LoginGraceTime`, `MaxSessions` e `MaxStartups`.
- Desabilitar `X11Forwarding`, `AllowTcpForwarding`, `AllowAgentForwarding` e `PermitTunnel` quando não usados.
- Habilitar `fail2ban` e trocar `ALLOW` por `LIMIT` no SSH do UFW.

## 3. Kernel e rede
- Aplicar `sysctl` para:
- desabilitar `send_redirects`, `accept_redirects` e `accept_source_route`
- habilitar `log_martians` e `tcp_syncookies`
- restringir `dmesg` e `kptr`
- desabilitar `suid_dumpable`

## 4. Persistência e comprometimento
- Auditar `cron`, `systemd`, `rc.local`, `sudoers`, `authorized_keys` e `ld.so.preload`.
- Revisar usuários com shell e logins recentes (`last`, `lastlog`).
- Procurar arquivos recentes em `/etc`, `/root`, `/usr/local`, `/var/www`, `/opt`.
- Validar processos e conexões estabelecidas.
- Investigar erros recorrentes e IOC em `journalctl`.

## 5. Docker
- Inventariar `docker ps -a`, redes, volumes e `docker compose ls`.
- Conferir `docker inspect` dos containers ativos.
- Correlacionar `docker events` e `journalctl -u docker`.
- Procurar IOC como `supportxmr`, `xmrig`, `miner`, `stratum`, `monero`.
- Validar se há somente containers esperados em `/var/lib/docker/containers`.

## 6. Hardening do compose
- Remover `env_file` genérico quando ele injeta segredos em serviços que não precisam.
- Declarar variáveis por serviço com o menor escopo possível.
- Habilitar `no-new-privileges:true`.
- Aplicar `cap_drop: [ALL]` e só adicionar capacidades estritamente necessárias.
- Ativar rotação de logs com `json-file` (`max-size`, `max-file`).
- Rodar backend em modo produção, não com `nodemon`.
- Adicionar `healthcheck` para serviços críticos.

## 7. Hardening das imagens
- Preferir `npm ci` em vez de `npm install`.
- Rodar `npm prune --omit=dev` após build quando aplicável.
- Definir `NODE_ENV=production`.
- Executar aplicação com usuário não-root quando possível.
- Criar `.dockerignore` para excluir `.git`, `.env`, backups, dumps e logs.

## 8. Nginx / frontend
- Ocultar `server_tokens`.
- Sanitizar `access_log` para não registrar query strings ou tokens.
- Bloquear acesso a dotfiles, `/.git`, `/.env` e extensões executáveis não usadas.
- Adicionar headers de segurança básicos.
- Confirmar que fallback SPA não mascara arquivos sensíveis.

## 9. Segredos
- Não deixar segredos em mais containers do que o necessário.
- Rotacionar imediatamente:
- senha do banco
- `JWT_SECRET`
- segredos OAuth / Microsoft
- qualquer credencial exposta em logs ou `docker inspect`
- Garantir permissão `600` no arquivo de ambiente.

## 10. Validação final
- Rodar `sshd -t`, `docker compose config` e validações de sintaxe.
- Reiniciar apenas os serviços impactados.
- Confirmar que portas, logs e processos continuam coerentes.
- Registrar IOC encontrado, ações feitas e pendências restantes.

## Achados e correções aplicados nesta VPS
- SSH endurecido, UFW ajustado e `fail2ban` ativado.
- `sysctl` de rede e kernel aplicado.
- Docker auditado sem evidência atual de container persistente malicioso.
- IOC em log do Docker para `pool.supportxmr.com` identificado e tratado como suspeita transitória.
- Compose endurecido para reduzir privilégios e espalhamento de segredos.
- Backend alterado para rodar em produção com usuário não-root.
- Nginx endurecido para bloquear paths sensíveis e sanitizar logs.
- `.dockerignore` ampliado para evitar vazamento de contexto de build.

## Pendências que exigem ação manual ou janela controlada
- Criar usuário admin com chave SSH e então desabilitar senha/root no SSH.
- Rotacionar todos os segredos atuais do stack.
- Rebuild e redeploy controlado dos containers para aplicar 100% das mudanças.
- Atualizar pacotes pendentes do host com janela de manutenção.
- Considerar rebuild limpo da VPS se o IOC do Docker não tiver explicação operacional confiável.
