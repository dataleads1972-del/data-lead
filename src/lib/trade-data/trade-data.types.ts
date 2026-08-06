export type TradeRecordCategory = "company" | "aggregate";

export interface TradeEntity {
  name?: string;
  country?: string;
  address?: string;
}

export interface TradeRecord {
  id: string;
  source: string;
  sourceCountry?: string;
  recordCategory: TradeRecordCategory;

  importer?: TradeEntity;
  exporter?: TradeEntity;

  product?: string;
  description?: string;
  hsCode?: string;

  originCountry?: string;
  destinationCountry?: string;

  shipmentDate?: string;
  quantity?: number;
  unit?: string;
  weight?: number;

  tradeValue?: number;
  currency?: string;

  portOfLoading?: string;
  portOfEntry?: string;

  sourceUrl?: string;
  retrievedAt?: string;
}

export interface TradeFilterParams {
  country: string;
  providerId: string;
  tradeDirection: "imports" | "exports" | "both";
  companyQuery?: string;
  productQuery?: string;
  hsCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TradeProviderInfo {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  type: TradeRecordCategory;
  status: "connected" | "setup-required" | "unsupported";
  description: string;
  supportsCompanySearch: boolean;
  officialSourceUrl: string;
  setupInstructions?: {
    credentialsRequired: string;
    registrationUrl: string;
    envVarName: string;
  };
}
