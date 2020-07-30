/* eslint-disable */
import { Logger, QueryRunner } from "typeorm";
import HistoryAdminAction from "../src/entity/HistoryAdminAction";
import {Admin} from "../src/entity/Admin";
import { toSafeInteger } from "lodash";

export default class KuseleLogger implements Logger {
  log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): any {}

  logMigration(message: string, queryRunner?: QueryRunner): any {}

  async logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any> {
    const operation = query.match(/(INSERT|UPDATE)/g);
    if (operation && operation.length) {
      const found = query.split(" ").findIndex((word: string): boolean => ["UPDATE", "INTO", "FROM"].includes(word.toUpperCase()));
      const tableCatch = query.split(" ")[found + 1];
      const table = tableCatch.replace(/[.|(]\S+/g, "");
      if (table.includes("history_admin_action")) return;
      if (operation[0] === "INSERT") {
        const data = query.match(/\((.*?)\)/g)
        if (!data?.length) return;
        const createByIndex = data[0].split(",").findIndex((column: string) => column.includes("createdById"));
        if (createByIndex < 0) return;
        const realIndex = data[1].split(",")[createByIndex];
        const index = toSafeInteger(realIndex.replace("$", ""));
        if (index > 0) {
          const admin = await Admin.findOne(parameters[index - 1]);
          await HistoryAdminAction.create({
            type_action: operation[0],
            table_name: table,
            data: data.join(" => ") + " params: " + parameters.join(", "),
            creator: admin,
          }).save();
        }
      } else if (operation[0] === "UPDATE") {
        const data = query.split(" = ");
        const updatedByIndex = data.findIndex((key: string): boolean => key.includes("updatedById"));
        const index = toSafeInteger(data[updatedByIndex + 1].match(/\d/g));
        if (index > 0) {
          const admin = await Admin.findOne(parameters[index - 1]);
          await HistoryAdminAction.create({
            type_action: operation[0],
            table_name: table,
            data: query + " params: " + parameters.join(", "),
            creator: admin,
          }).save();
        }
      }
    }
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): any {}

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): any {}

  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {}
}
