import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Share2, Bell, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function Manual() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          Manual do Sistema FX TAO
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Documentação técnica, fluxos de uso e integrações do sistema de Termo de Abertura de Obras.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard className="w-5 h-5 text-blue-500" /> Fluxo Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            O FX TAO gerencia o ciclo de vida de obras, desde o cadastro inicial (Rascunho), passando por detalhamento financeiro, até a aprovação e finalização.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Aprovações
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Sistema hierárquico de aprovações para Obras e Aditivos. Diretores e Gerentes validam as informações antes da execução.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="w-5 h-5 text-purple-500" /> Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Notificações via E-mail e In-App, além de links rápidos para compartilhamento via WhatsApp e SharePoint.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes Técnicos e Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            
            <AccordionItem value="item-1">
              <AccordionTrigger>1. Cadastro e Edição de TAO</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-600">
                <p><strong>Passo a Passo:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Inicie um novo TAO no botão "Novo Termo" na listagem.</li>
                  <li>Preencha os dados básicos na etapa Inicial (Start).</li>
                  <li>Avance pelas etapas 1 a 5 preenchendo detalhes financeiros, cronograma, equipe e anexos.</li>
                  <li>O sistema salva rascunhos automaticamente ao mudar de etapa ou clicar em "Salvar".</li>
                </ul>
                <p className="mt-2"><strong>Regras:</strong> Usuários comuns não podem editar TAOs finalizados ou em aprovação.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>2. Sistema de Aprovações</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-600">
                <p>O fluxo de aprovação garante a integridade dos dados:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ao finalizar o preenchimento, clique em "Enviar para Aprovação".</li>
                  <li>Os aprovadores configurados receberão uma notificação (Email/App).</li>
                  <li>No menu "Aprovações", os responsáveis podem Aprovar ou Rejeitar (com justificativa).</li>
                  <li>Aditivos seguem um fluxo similar, mas independente da obra principal.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>3. Integrações e Notificações</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-600">
                <p><strong>E-mail:</strong> O sistema envia e-mails automáticos via SendGrid/AWS (Core Integration) para aprovadores quando uma ação é necessária.</p>
                <p><strong>WhatsApp:</strong> Utilize o botão "Compartilhar WhatsApp" dentro da obra para gerar um link direto e enviar para sua equipe.</p>
                <p><strong>SharePoint:</strong> Cada obra possui um link único (Deep Link). Copie este link usando o botão "Copiar Link" e cole na página da obra no SharePoint para acesso rápido.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>4. Manual Técnico de Integrações (API)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-slate-600">
                <p><strong>Deep Linking:</strong> O app suporta URLs parametrizadas: <code>/TaoForm?id=UUID</code>. Isso permite abrir o app diretamente no contexto de um registro.</p>
                <p><strong>Estrutura de Dados:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Tao:</strong> Entidade principal. Contém dados cadastrais e status.</li>
                  <li><strong>TaoAdditive:</strong> Aditivos financeiros vinculados ao TAO.</li>
                  <li><strong>Notification:</strong> Registro de alertas para usuários.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}