import { Connection } from "typeorm";
import { connection } from "../../test-utils/connection";
import { Admin } from "../../../src/entity/Admin";
import { graphqlCall } from "../../test-utils/graphqlCall";
import { createAdminHelper } from "../../helpers/createAdminHelper";
import { createAdminGroupHelper } from "../../helpers/createAdminGroupHelper";

describe("Test Admin Resolver", () => {
  let conn: Connection;
  let admin: Admin;

  beforeAll(async () => {
    conn = await connection();
  });

  afterAll(async () => {
    await conn.close();
  });

  it("Test Getting Get By ID", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const getUserQuery = `{
      getAdmin(id: "${admin.id}" ){
        username
        group {
          name
        }
      }
    }`;

    const response = await graphqlCall({
      source: getUserQuery,
      isAdmin: true,
    });

    expect(response).toMatchObject({
      data: {
        getAdmin: {
          username: admin.username,
          group: {
            name: adminGroup.name,
          },
        },
      },
    });

    done();
  });

  it("Test get User", async (done) => {
    const getAdminsQuery = `{
      getAdmins {
        data {
          email 
        }
      }
    }`;

    await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
    });
    done();
  });
});
