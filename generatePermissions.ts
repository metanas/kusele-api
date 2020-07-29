import * as fs from "fs";
import PermissionsWhiteList from "./src/utils/PermissionsWhiteList";

async function main() {
  console.log("**************** Start Generating Permissions ****************");
  const files = fs.readdirSync(__dirname + "/src/Resolvers/admin");

  const permissions = [];

  for (const key of files) {
    const resolver = await import(`./src/Resolvers/admin/${key}`);
    const { name, prototype } = Object.entries(resolver)[0][1] as { name: string; prototype: string[] };
    const result = Reflect.ownKeys(prototype);
    permissions.push(
      ...result
        .filter((key) => key !== "constructor" && !PermissionsWhiteList.includes(key as string))
        .map((key) => `${name.replace("Resolver", "")}/${key.toString()}`),
    );
  }
  fs.writeFileSync("./src/utils/permissions.json", JSON.stringify(permissions));
}

main().then(() => {
  console.log("**************** Permissions are generated! ****************");
  process.exit();
});
