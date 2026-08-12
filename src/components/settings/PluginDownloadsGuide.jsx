import React from 'react';
import { Download, FileCode2, MapPinned, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SHAREPOINT_PACKAGE_URL = '/downloads/fxtao-work-page.sppkg';
const WORDPRESS_PLUGIN_URL = '/downloads/fxtao-public-map.zip';

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

      <CardContent className="grid gap-4 lg:grid-cols-2">
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
              <Download className="mr-2 h-4 w-4" /> Baixar webpart SharePoint
            </a>
          </Button>
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
      </CardContent>

      <CardContent className="border-t border-indigo-100 pt-4">
        <Accordion type="single" collapsible defaultValue="sharepoint">
          <AccordionItem value="sharepoint">
            <AccordionTrigger>Manual detalhado: deploy e configuração da webpart no SharePoint</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">1. Instalação no catálogo de aplicativos</p>
                <StepList steps={[
                  'Baixe o arquivo fxtao-work-page.sppkg pelo botão acima.',
                  'Acesse o SharePoint Admin Center com uma conta administradora.',
                  'Entre em More features > Apps > App Catalog. Se o tenant ainda não tiver catálogo, crie um.',
                  'Faça upload do arquivo fxtao-work-page.sppkg na biblioteca Apps for SharePoint.',
                  'Quando solicitado, habilite a disponibilização do app para os sites necessários.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">2. Permissões Microsoft 365 / API</p>
                <StepList steps={[
                  'No SharePoint Admin Center, acesse Advanced > API access.',
                  'Aprove a permissão exibida para a API FX TAO, normalmente FX TAO API / access_as_user.',
                  'Confirme no Microsoft Entra que o aplicativo usado pela API FXTAO aceita tokens do tenant correto.',
                  'Valide que a URL do FXTAO SaaS do cliente está em HTTPS e autorizada nas configurações de SSO/API.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">3. Uso na página da obra</p>
                <StepList steps={[
                  'Abra a página SharePoint da obra e clique em Editar.',
                  'Adicione a webpart FXTAO Obra.',
                  'Configure a URL da API/portal FXTAO, por exemplo https://fxtao.fx4.com.br.',
                  'Informe o identificador da obra: ID interno, ERP ou outro identificador aceito pela webpart.',
                  'Publique a página e teste com um usuário autorizado do Microsoft 365.',
                ]} />
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
                  'Em ID/slug do cliente, informe o slug do tenant SaaS, por exemplo cinci, allora ou cymz.',
                  'Cole o Bearer token da integração Mapa público de obras do respectivo cliente.',
                  'Informe o Link do FXTAO, por exemplo https://fxtao.fx4.com.br.',
                  'Opcionalmente informe uma Obra padrão para exibir apenas uma obra na página.',
                  'Mantenha Mostrar somente obras ativas habilitado, salvo necessidade operacional diferente.',
                ]} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">3. Inserção do componente nas páginas</p>
                <div className="space-y-2 rounded-lg border bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  <p>[fxtao_public_map]</p>
                  <p>[fxtao_public_map obra="CASA ATLÂNTICA"]</p>
                  <p>[fxtao_public_map cliente="cinci" fxtao_url="https://fxtao.fx4.com.br" seletor="true"]</p>
                  <p>[fxtao_public_map height="640px"]</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Para uma obra aparecer, ela precisa ter latitude/longitude e estar habilitada para publicação no mapa público do FXTAO.
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
