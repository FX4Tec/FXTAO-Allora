import React from 'react';
import { BarChart3, Download, FileCode2, MapPinned, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SHAREPOINT_PACKAGE_URL = '/downloads/fxtao-work-page.sppkg';
const SHAREPOINT_PACKAGE_VERSIONS = [
  { label: 'v1.1 - Flexível / Overlay Seiji', url: '/downloads/fxtao-work-page-1.1.0.sppkg' },
  { label: 'v1.0 - Clássica', url: '/downloads/fxtao-work-page-1.0.0.sppkg' },
];
const WORDPRESS_PLUGIN_URL = '/downloads/fxtao-public-map.zip';
const WORDPRESS_PROGRESS_PLUGIN_URL = '/downloads/fxtao-progress-chart.zip';

const StepList = ({ steps }) => (
  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
    {steps.map((step) => (
      <li key={step}>{step}</li>
    ))}
  </ol>
);

export default function PluginDownloadsGuide() {
  return (
    <Card className="border-indigo-100 bg-indigo-50/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-950">
          <FileCode2 className="h-5 w-5 text-indigo-700" />
          Plugins, Webparts e Manuais de Implantação
        </CardTitle>
        <CardDescription>
          Downloads oficiais para integrar o FXTAO SaaS com SharePoint e WordPress, com passo a passo de instalação e configuração.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <div className="mb-3 flex items-start gap-3">
            <FileCode2 className="mt-1 h-5 w-5 text-indigo-700" />
            <div>
              <p className="font-semibold text-slate-950">Webpart SharePoint FXTAO</p>
              <p className="text-sm text-slate-600">Pacote SPFx para páginas de obra no SharePoint.</p>
            </div>
          </div>
          <Button asChild className="w-full bg-indigo-700 hover:bg-indigo-800">
            <a href={SHAREPOINT_PACKAGE_URL} download>
              <Download className="mr-2 h-4 w-4" /> Baixar webpart atual
            </a>
          </Button>
          <div className="mt-3 space-y-2 text-xs">
            <p className="font-semibold text-slate-700">Versões compatíveis</p>
            {SHAREPOINT_PACKAGE_VERSIONS.map((version) => (
              <a key={version.url} href={version.url} download className="block rounded-lg border border-indigo-100 px-3 py-2 text-indigo-800 hover:bg-indigo-50">
                {version.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <div className="mb-3 flex items-start gap-3">
            <MapPinned className="mt-1 h-5 w-5 text-indigo-700" />
            <div>
              <p className="font-semibold text-slate-950">Plugin WordPress Mapa FXTAO</p>
              <p className="text-sm text-slate-600">Componente de mapa de obras ativas com token protegido.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-100">
            <a href={WORDPRESS_PLUGIN_URL} download>
              <Download className="mr-2 h-4 w-4" /> Baixar plugin WordPress
            </a>
          </Button>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <div className="mb-3 flex items-start gap-3">
            <BarChart3 className="mt-1 h-5 w-5 text-indigo-700" />
            <div>
              <p className="font-semibold text-slate-950">Plugin WordPress Evolução da Obra</p>
              <p className="text-sm text-slate-600">Gráfico público de avanço por tópicos, cliente e obra.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-100">
            <a href={WORDPRESS_PROGRESS_PLUGIN_URL} download>
              <Download className="mr-2 h-4 w-4" /> Baixar plugin de evolução
            </a>
          </Button>
        </div>
      </CardContent>

      <CardContent className="border-t border-indigo-100 pt-4">
        <Accordion type="single" collapsible defaultValue="sharepoint">
          <AccordionItem value="sharepoint">
            <AccordionTrigger>Manual detalhado: deploy e configuração da webpart no SharePoint</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">1. Registrar a API FX TAO API no Microsoft Entra</p>
                <StepList steps={[
                  'Acesse entra.microsoft.com com uma conta administradora do tenant Microsoft 365 do cliente.',
                  'Abra Identity > Applications > App registrations e clique em New registration.',
                  'Em Name, informe exatamente FX TAO API.',
                  'Em Supported account types, selecione Accounts in this organizational directory only.',
                  'Não informe Redirect URI neste registro; esta aplicação representa a API consumida pela webpart.',
                  'Clique em Register e copie Application (client) ID e Directory (tenant) ID.',
                  'Abra Expose an API e clique em Set no Application ID URI.',
                  'Use o valor sugerido api://<Application Client ID> ou outro URI válido do tenant e guarde exatamente esse valor.',
                  'Clique em Add a scope e crie o escopo delegado access_as_user.',
                  'No escopo, use consentimento conforme política do cliente, descrição para acesso ao FXTAO e State como Enabled.',
                  'Abra Manifest, confirme accessTokenAcceptedVersion como 2 e salve.',
                  'Não crie Client Secret para esta webpart; o SPFx usa token delegado via AadHttpClient.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">2. Configurar a integração no FXTAO SaaS</p>
                <StepList steps={[
                  'No FXTAO SaaS, entre como superadmin FX4 e abra o cliente correto em Painel SaaS FX4.',
                  'Clique em Abrir configurações do cliente e vá até Webpart SharePoint FXTAO.',
                  'Habilite Integração da webpart habilitada.',
                  'Preencha Tenant ID Microsoft da webpart com o Directory (tenant) ID copiado do Entra.',
                  'Preencha Client ID da API FX TAO com o Application (client) ID do registro FX TAO API.',
                  'Preencha Application ID URI com o mesmo valor definido em Expose an API, por exemplo api://<client-id>.',
                  'Mantenha o escopo obrigatório como access_as_user.',
                  'Em Origens SharePoint permitidas, informe somente a origem raiz, por exemplo https://empresa.sharepoint.com, sem /sites/...',
                  'Deixe Client IDs SPFx permitidos vazio, salvo se houver necessidade formal de restringir clientes SPFx.',
                  'Salve em Salvar Webpart SharePoint.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">3. Criar ou validar o catálogo de aplicativos SharePoint</p>
                <StepList steps={[
                  'Acesse o SharePoint Admin Center com uma conta administradora.',
                  'Abra More features > Apps > App Catalog ou Active sites > App catalog, conforme a tela disponível.',
                  'Se o tenant ainda não tiver catálogo, crie o App Catalog e aguarde o provisionamento.',
                  'Abra a biblioteca Apps for SharePoint.',
                  'Confirme que sua conta consegue enviar pacotes .sppkg.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">4. Instalar ou atualizar a webpart no App Catalog</p>
                <StepList steps={[
                  'Baixe o arquivo fxtao-work-page.sppkg pelo botão acima.',
                  'Faça upload do arquivo fxtao-work-page.sppkg na biblioteca Apps for SharePoint.',
                  'Quando solicitado, disponibilize o app para os sites necessários.',
                  'Se o pacote já existia antes da API FX TAO API estar correta, substitua ou reenvie o .sppkg.',
                  'O pacote deve gerar a solicitação de permissão FX TAO API / access_as_user.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">5. Aprovar a permissão da API no SharePoint</p>
                <StepList steps={[
                  'No SharePoint Admin Center, acesse Advanced > API access.',
                  'Abra Pending requests e procure API name FX TAO API, pacote fxtao-work-page-client-side-solution e permissão access_as_user.',
                  'Se houver solicitação antiga ou inválida, rejeite antes de reenviar o pacote corrigido.',
                  'Selecione a solicitação correta e clique em Approve.',
                  'Confirme que a permissão aparece em Approved requests.',
                  'Se não houver solicitação pendente, confirme o escopo access_as_user no Entra e reenvie o .sppkg no App Catalog.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">6. Usar na página da obra</p>
                <StepList steps={[
                  'Abra a página SharePoint da obra e clique em Editar.',
                  'Adicione a webpart FX TAO - Página da Obra.',
                  'Abra o painel de propriedades da webpart.',
                  'Configure URL base da API FX TAO como https://fxtao.fx4.com.br.',
                  'Informe o identificador da obra: ID interno da TAO, final curto do ID, código ERP ou código da obra.',
                  'Informe URI do recurso Entra ID exatamente igual ao Application ID URI do Entra e do FXTAO SaaS.',
                  'Publique a página e teste com um usuário Microsoft 365 autorizado no FXTAO.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">7. Setup para layout Seiji / overlay transparente</p>
                <StepList steps={[
                  'Em Modo de layout, selecione Overlay transparente / Seiji.',
                  'Desative Exibir cabeçalho interno da webpart.',
                  'Desative Exibir link para abrir o FX TAO.',
                  'Ative Remover borda, fundo e sombra externos.',
                  'Em Alinhamento dos campos, selecione Centralizado.',
                  'Use Tamanho da fonte entre 28 e 34 px; para o exemplo Seiji, use 31 px.',
                  'Use Altura da linha entre 1.25 e 1.35; para o exemplo Seiji, use 1.32.',
                  'Use Padding interno 0 a 12 px quando a página já tiver imagem/fundo próprio.',
                  'Configure Cor dos valores dos dados e Cor dos rótulos dos dados como #ffffff.',
                  'Em Cor de fundo do quadro, use #000000 e Transparência do fundo 0 quando quiser fundo totalmente transparente.',
                ]} />
                <div className="mt-3 rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  <p>Campos visíveis CSV:</p>
                  <p>erpNumber,companyCostCenters,companyName,architecture,street,areaM2,contractMonths,startDate,endDate</p>
                  <p className="mt-3">JSON de campos para o modelo Seiji:</p>
                  <p>[</p>
                  <p>{'{'}"key":"erpNumber","label":"N° ERP","enabled":true{'}'},</p>
                  <p>{'{'}"key":"companyCostCenters","label":"C.C. Associados","enabled":true{'}'},</p>
                  <p>{'{'}"key":"companyName","label":"Gerenciadora","fallback":"-","enabled":true{'}'},</p>
                  <p>{'{'}"key":"architecture","label":"Arquitetura","enabled":true{'}'},</p>
                  <p>{'{'}"key":"street","label":"Localização","enabled":true{'}'},</p>
                  <p>{'{'}"key":"areaM2","label":"Área Construída","enabled":true{'}'},</p>
                  <p>{'{'}"key":"contractMonths","label":"Prazo Contratual","type":"dateDiffMonths","from":"startDate","to":"endDate","suffix":"meses","enabled":true{'}'},</p>
                  <p>{'{'}"key":"startDate","label":"Data de Início","enabled":true{'}'},</p>
                  <p>{'{'}"key":"endDate","label":"Data de Finalização","enabled":true{'}'}</p>
                  <p>]</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">8. Campos das propriedades da webpart</p>
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <div className="rounded-lg border bg-white p-3">
                    <p><strong>Título</strong>: texto exibido no cabeçalho da webpart.</p>
                    <p><strong>Código ERP, código da obra ou ID da TAO</strong>: identificador usado para localizar a obra.</p>
                    <p><strong>URL base da API FX TAO</strong>: https://fxtao.fx4.com.br.</p>
                    <p><strong>URI do recurso Entra ID</strong>: Application ID URI do registro FX TAO API.</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <p><strong>URL do portal FX TAO</strong>: link opcional para abrir o portal ou URL direta do cliente.</p>
                    <p><strong>Exibir status da TAO</strong>: mostra/oculta o selo de status.</p>
                    <p><strong>Exibir centros de custo</strong>: mostra/oculta centros publicados.</p>
                    <p><strong>Atualização automática</strong>: intervalo em minutos; zero desativa.</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 md:col-span-2">
                    <p className="font-semibold text-slate-900">Chaves aceitas em Campos visíveis/ocultos (CSV)</p>
                    <p className="mt-1 font-mono text-xs">
                      clientName, architecture, areaM2, projectType, street, neighborhood, zipCode, cityState, complement, companyName, companyCode, clientCode, clientCostCenters, companyCostCenters, segment, contractType, startDate, endDate
                    </p>
                  </div>
                  <div className="rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100 md:col-span-2">
                    <p>Exemplo de Campos visíveis CSV: clientName,areaM2,segment,startDate,endDate</p>
                    <p>Exemplo de Campos ocultos CSV: architecture,clientCode,companyCode</p>
                    <p>Exemplo de JSON de campos:</p>
                    <p>[{'{'}"key":"clientName","label":"Cliente","enabled":true{'}'}, {'{'}"key":"areaM2","label":"Área","enabled":true{'}'}]</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Se a webpart exibir Failed to fetch, verifique certificado HTTPS, origem SharePoint autorizada no FXTAO, Application ID URI idêntico na webpart e aprovação FX TAO API / access_as_user no SharePoint Admin.
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="wordpress">
            <AccordionTrigger>Manual detalhado: deploy e configuração do plugin no WordPress</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">1. Instalação do plugin</p>
                <StepList steps={[
                  'Baixe o arquivo fxtao-public-map.zip pelo botão acima.',
                  'No WordPress, acesse Plugins > Adicionar novo > Enviar plugin.',
                  'Envie o ZIP, clique em Instalar agora e depois em Ativar.',
                  'Acesse Configurações > FXTAO Public Map.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">2. Configuração de conexão</p>
                <StepList steps={[
                  'Em URL base da API, informe https://fxtao.fx4.com.br/api/public.',
                  'Em ID/slug do cliente, informe o slug cadastrado no SaaS, por exemplo cliente.',
                  'Cole o Bearer token da integração Mapa público de obras do respectivo cliente.',
                  'Opcionalmente informe uma Obra padrão para exibir apenas uma obra na página.',
                  'Mantenha Mostrar somente obras ativas habilitado, salvo necessidade operacional diferente.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">3. Inserção do componente nas páginas</p>
                <div className="space-y-2 rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  <p>[fxtao_public_map]</p>
                  <p>[fxtao_public_map obra="NOME DA OBRA"]</p>
                  <p>[fxtao_public_map cliente="cliente" seletor="true"]</p>
                  <p>[fxtao_public_map height="640px"]</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Para uma obra aparecer, ela precisa ter latitude/longitude e estar habilitada para publicação no mapa público do FXTAO.
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="progress-chart">
            <AccordionTrigger>Manual detalhado: gráfico de evolução da obra no WordPress</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">1. Instalação do plugin</p>
                <StepList steps={[
                  'Baixe o arquivo fxtao-progress-chart.zip pelo botão acima.',
                  'No WordPress, acesse Plugins > Adicionar novo > Enviar plugin.',
                  'Envie o ZIP, clique em Instalar agora e depois em Ativar.',
                  'Acesse Configurações > FXTAO Progress Chart.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">2. Preparação no FXTAO SaaS</p>
                <StepList steps={[
                  'Entre no cliente correto pelo acesso assistido ou pela URL direta do tenant.',
                  'Em Configurações > Integrações do Ecossistema, habilite Gráfico público de evolução da obra.',
                  'Gere e copie um Bearer token exclusivo para este cliente.',
                  'Abra a TAO da obra, vá ao item 5 e marque Publicar gráfico desta obra.',
                  'Cadastre os tópicos e percentuais no quadro Evolução da Obra para WordPress.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">3. Configuração de conexão</p>
                <StepList steps={[
                  'Em URL base da API, informe https://fxtao.fx4.com.br/api/public.',
                  'Em Slug do cliente, informe o tenant SaaS, por exemplo cliente.',
                  'Em Obra padrão, informe ID, ERP, slug público ou nome da obra.',
                  'Cole o Bearer token da integração Gráfico público de evolução da obra.',
                  'Escolha o tipo de gráfico: barra horizontal, barras verticais ou resumo circular.',
                  'Defina o período de atualização em minutos e habilite Atualizar agora se desejar refresh manual.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">4. Shortcodes</p>
                <div className="space-y-2 rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  <p>[fxtao_progress_chart]</p>
                  <p>[fxtao_progress_chart obra="NOME DA OBRA"]</p>
                  <p>[fxtao_progress_chart cliente="cliente" obra="NOME DA OBRA" tipo="bar"]</p>
                  <p>[fxtao_progress_chart tipo="vertical" atualizacao_minutos="5"]</p>
                  <p>[fxtao_progress_chart tipo="donut" titulo="Resumo da Obra"]</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                O token fica salvo no servidor WordPress e a API só retorna dados da obra quando o tenant e a obra publicados coincidem com o token do cliente.
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger>Boas práticas de segurança</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div className="space-y-2">
                  <p>Use um token por cliente e nunca reutilize token entre tenants.</p>
                  <p>No WordPress, o token fica salvo no servidor e a página pública chama apenas o proxy REST do plugin.</p>
                  <p>Rotacione o token se houver suspeita de vazamento e restrinja publicação apenas às obras necessárias.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
