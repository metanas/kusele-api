import { ElasticService } from "./src/utils/ElasticService";

function main() {
  const elastic = new ElasticService();
  process.argv.slice(2, process.argv.length).forEach((key) => {
    elastic.client.indices
      .delete({
        index: key,
      })
      .then(() => {
        console.log(`${key} index is done`);
        elastic.client.indices.refresh();
      })
      .catch(() => {
        console.error(`${key} index not found`);
      });
  });
}

main();
