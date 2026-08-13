import type { AadHttpClientFactory } from '@microsoft/sp-http';

export interface ITaoObraProps {
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
  headerBackgroundColor: string;
  headerTextColor: string;
  headerAccentColor: string;
  dataTextColor: string;
  dataLabelColor: string;
  panelBackgroundColor: string;
  panelBackgroundImageUrl: string;
  panelBackgroundUseImage: boolean;
  panelBackgroundOpacity: number;
  aadHttpClientFactory: AadHttpClientFactory;
}
