import { connection } from "./connection";

connection(true).then(() => {
  console.log("Connecting to database!");
});
setTimeout(() => {
  console.log("connected");
}, 10000);
