import { Client } from "@elastic/elasticsearch";

export class ElasticServiceTesting {
  private readonly _client: Client = new Client({ node: "http://localhost:9200" });

  get client(): Client {
    return this._client;
  }

  close(): void {
    this._client.close();
  }
}
