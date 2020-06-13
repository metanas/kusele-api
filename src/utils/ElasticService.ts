import { Client } from "@elastic/elasticsearch";

export class ElasticService {
  private readonly _client: Client = new Client({ node: "http://localhost:7200" });

  get client(): Client {
    return this._client;
  }
}
