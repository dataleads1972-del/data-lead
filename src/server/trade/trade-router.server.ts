import { TradeFilterParams, TradeRecord } from "@/lib/trade-data/trade-data.types";
import { fetchUSCensusTradeData } from "./us-census.server";
import { fetchSECEdgarTradeData } from "./sec-edgar-trade.server";
import { fetchUKHMRCImportersData } from "./uk-hmrc.server";
import { fetchUNComtradeData } from "./un-comtrade.server";

export class TradeRouterServer {
  async executeTradeSearch(params: TradeFilterParams): Promise<{ records: TradeRecord[]; totalCount: number }> {
    let records: TradeRecord[] = [];

    switch (params.providerId) {
      case "us-census-api":
        records = await fetchUSCensusTradeData(params);
        break;

      case "us-sec-edgar":
        records = await fetchSECEdgarTradeData(params);
        break;

      case "uk-hmrc-importers":
        records = await fetchUKHMRCImportersData(params);
        break;

      case "un-comtrade":
        records = await fetchUNComtradeData(params);
        break;

      default:
        // Default based on country selection
        if (params.country === "United Kingdom") {
          records = await fetchUKHMRCImportersData(params);
        } else if (params.country === "United States") {
          records = await fetchUSCensusTradeData(params);
        } else {
          records = await fetchUNComtradeData(params);
        }
        break;
    }

    return {
      records,
      totalCount: records.length,
    };
  }
}

export const tradeRouterServer = new TradeRouterServer();
