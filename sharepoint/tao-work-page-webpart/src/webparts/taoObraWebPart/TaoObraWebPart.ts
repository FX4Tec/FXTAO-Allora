import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import TaoObra from './components/TaoObra';
import type { ITaoObraProps } from './components/ITaoObraProps';

export interface ITaoObraWebPartProps {
  title: string;
  taoIdentifier: string;
  apiBaseUrl: string;
  apiResourceUri: string;
  taoPortalBaseUrl: string;
  showStatus: boolean;
  showCostCenters: boolean;
  refreshMinutes: number;
  visibleFieldsCsv: string;
  hiddenFieldsCsv: string;
  fieldsJson: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerAccentColor: string;
  dataTextColor: string;
  dataLabelColor: string;
  panelBackgroundColor: string;
  panelBackgroundImageUrl: string;
  panelBackgroundUseImage: boolean;
  panelBackgroundOpacity: number;
  layoutMode: string;
  showHeader: boolean;
  showPortalLink: boolean;
  transparentShell: boolean;
  fieldAlignment: string;
  fieldLabelWidth: number;
  fieldFontSize: number;
  fieldLineHeight: number;
  fieldGap: number;
  contentPadding: number;
  maxWidth: number;
  customCss: string;
}

export default class TaoObraWebPart extends BaseClientSideWebPart<ITaoObraWebPartProps> {
  public render(): void {
    const element: React.ReactElement<ITaoObraProps> = React.createElement(TaoObra, {
      title: this.properties.title,
      taoIdentifier: this.properties.taoIdentifier,
      apiBaseUrl: this.properties.apiBaseUrl,
      apiResourceUri: this.properties.apiResourceUri,
      taoPortalBaseUrl: this.properties.taoPortalBaseUrl,
      showStatus: this.properties.showStatus === true,
      showCostCenters: this.properties.showCostCenters !== false,
      refreshMinutes: this.properties.refreshMinutes ?? 15,
      visibleFieldsCsv: this.properties.visibleFieldsCsv || '',
      hiddenFieldsCsv: this.properties.hiddenFieldsCsv || '',
      fieldsJson: this.properties.fieldsJson || '',
      layoutMode: this.properties.layoutMode || 'classic',
      showHeader: this.properties.showHeader !== false,
      showPortalLink: this.properties.showPortalLink !== false,
      transparentShell: this.properties.transparentShell === true,
      fieldAlignment: this.properties.fieldAlignment || 'left',
      fieldLabelWidth: this.properties.fieldLabelWidth ?? 118,
      fieldFontSize: this.properties.fieldFontSize ?? 14,
      fieldLineHeight: this.properties.fieldLineHeight ?? 1.35,
      fieldGap: this.properties.fieldGap ?? 10,
      contentPadding: this.properties.contentPadding ?? 24,
      maxWidth: this.properties.maxWidth ?? 0,
      customCss: this.properties.customCss || '',
      headerBackgroundColor: this.properties.headerBackgroundColor || '#263547',
      headerTextColor: this.properties.headerTextColor || '#ffffff',
      headerAccentColor: this.properties.headerAccentColor || '#f5b94d',
      dataTextColor: this.properties.dataTextColor || '#20242a',
      dataLabelColor: this.properties.dataLabelColor || '#69727d',
      panelBackgroundColor: this.properties.panelBackgroundColor || '#ffffff',
      panelBackgroundImageUrl: this.properties.panelBackgroundImageUrl || '',
      panelBackgroundUseImage: this.properties.panelBackgroundUseImage === true,
      panelBackgroundOpacity: this.properties.panelBackgroundOpacity ?? 85,
      aadHttpClientFactory: this.context.aadHttpClientFactory
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: 'Integração da página da obra com o FX TAO' },
        groups: [{
          groupName: 'Obra e API',
          groupFields: [
            PropertyPaneTextField('title', { label: 'Título', placeholder: 'Página da Obra' }),
            PropertyPaneTextField('taoIdentifier', { label: 'Código ERP, código da obra ou ID da TAO' }),
            PropertyPaneTextField('apiBaseUrl', { label: 'URL base da API FX TAO', placeholder: 'https://tao.empresa.com.br' }),
            PropertyPaneTextField('apiResourceUri', { label: 'URI do recurso Entra ID', placeholder: 'api://<application-id>' }),
            PropertyPaneTextField('taoPortalBaseUrl', { label: 'URL do portal FX TAO (opcional)' }),
            PropertyPaneToggle('showStatus', { label: 'Exibir status da TAO' }),
            PropertyPaneToggle('showCostCenters', { label: 'Exibir centros de custo' }),
            PropertyPaneToggle('showPortalLink', { label: 'Exibir link para abrir o FX TAO', onText: 'Sim', offText: 'Não' }),
            PropertyPaneSlider('refreshMinutes', { label: 'Atualização automática (minutos)', min: 0, max: 60, step: 5, showValue: true })
          ]
        }, {
          groupName: 'Campos',
          groupFields: [
            PropertyPaneTextField('visibleFieldsCsv', {
              label: 'Campos visíveis (CSV)',
              description: 'Ex.: clientName,areaM2,segment,startDate. Vazio usa a ordem padrão.'
            }),
            PropertyPaneTextField('hiddenFieldsCsv', {
              label: 'Campos ocultos (CSV)',
              description: 'Ex.: architecture,clientCode,companyCode'
            }),
            PropertyPaneTextField('fieldsJson', {
              label: 'JSON de campos',
              description: 'Permite reordenar, renomear e habilitar/desabilitar campos. Ex.: [{"key":"clientName","label":"Cliente","enabled":true}]',
              multiline: true,
              resizable: true,
              rows: 8
            })
          ]
        }, {
          groupName: 'Visual',
          groupFields: [
            PropertyPaneDropdown('layoutMode', {
              label: 'Modo de layout',
              options: [
                { key: 'classic', text: 'Clássico / cartão atual' },
                { key: 'overlay', text: 'Overlay transparente / Seiji' },
                { key: 'minimal', text: 'Minimalista sem cabeçalho' }
              ]
            }),
            PropertyPaneToggle('showHeader', { label: 'Exibir cabeçalho interno da webpart', onText: 'Sim', offText: 'Não' }),
            PropertyPaneToggle('transparentShell', { label: 'Remover borda, fundo e sombra externos', onText: 'Sim', offText: 'Não' }),
            PropertyPaneDropdown('fieldAlignment', {
              label: 'Alinhamento dos campos',
              options: [
                { key: 'left', text: 'Esquerda' },
                { key: 'center', text: 'Centralizado' },
                { key: 'right', text: 'Direita' }
              ]
            }),
            PropertyPaneSlider('fieldFontSize', { label: 'Tamanho da fonte dos campos (px)', min: 12, max: 44, step: 1, showValue: true }),
            PropertyPaneSlider('fieldLineHeight', { label: 'Altura da linha dos campos', min: 1, max: 2, step: 0.05, showValue: true }),
            PropertyPaneSlider('fieldGap', { label: 'Espaço entre linhas (px)', min: 0, max: 28, step: 1, showValue: true }),
            PropertyPaneSlider('fieldLabelWidth', { label: 'Largura dos rótulos no modo clássico (px)', min: 0, max: 260, step: 10, showValue: true }),
            PropertyPaneSlider('contentPadding', { label: 'Padding interno (px)', min: 0, max: 80, step: 4, showValue: true }),
            PropertyPaneSlider('maxWidth', { label: 'Largura máxima do bloco (px, 0 = total)', min: 0, max: 1200, step: 20, showValue: true }),
            PropertyPaneTextField('headerBackgroundColor', { label: 'Cor do cabeçalho', placeholder: '#263547' }),
            PropertyPaneTextField('headerTextColor', { label: 'Cor do texto do cabeçalho', placeholder: '#ffffff' }),
            PropertyPaneTextField('headerAccentColor', { label: 'Cor de destaque do cabeçalho', placeholder: '#f5b94d' }),
            PropertyPaneTextField('dataTextColor', { label: 'Cor dos valores dos dados', placeholder: '#20242a' }),
            PropertyPaneTextField('dataLabelColor', { label: 'Cor dos rótulos dos dados', placeholder: '#69727d' }),
            PropertyPaneTextField('panelBackgroundColor', { label: 'Cor de fundo do quadro', placeholder: '#ffffff' }),
            PropertyPaneToggle('panelBackgroundUseImage', { label: 'Usar imagem no fundo do quadro' }),
            PropertyPaneTextField('panelBackgroundImageUrl', { label: 'URL da imagem de fundo', placeholder: 'https://...' }),
            PropertyPaneSlider('panelBackgroundOpacity', { label: 'Transparência do fundo (%)', min: 0, max: 100, step: 5, showValue: true }),
            PropertyPaneTextField('customCss', {
              label: 'CSS customizado do bloco',
              description: 'Opcional. Use seletores do componente para ajustes finos de tipografia, espaçamento e fundo.',
              multiline: true,
              resizable: true,
              rows: 6
            })
          ]
        }]
      }]
    };
  }
}
