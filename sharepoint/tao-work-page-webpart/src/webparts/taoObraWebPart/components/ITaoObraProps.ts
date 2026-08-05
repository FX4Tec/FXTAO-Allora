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
