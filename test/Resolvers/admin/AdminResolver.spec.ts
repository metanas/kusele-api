import { Connection } from "typeorm";
import { connection } from "../../test-utils/connection";
import { Admin } from "../../../src/entity/Admin";
import { graphqlCall } from "../../test-utils/graphqlCall";
import { createAdminHelper } from "../../helpers/createAdminHelper";
import { createAdminGroupHelper } from "../../helpers/createAdminGroupHelper";
import { truncate } from "../../helpers/truncateTables";
import faker from "faker";

describe("Test Admin Resolver", () => {
  let conn: Connection;
  let admin: Admin;

  beforeAll(async (done) => {
    conn = await connection();
    done();
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

  it("Test get not found admin", async (done) => {
    const getUserQuery = `{
      getAdmin(id: "${faker.random.uuid()}" ){
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

    expect(response.errors[0].message).toEqual("Admin not found!");
    done();
  });

  it("Test get admins", async (done) => {
    await truncate(conn, "admin");
    const adminGroup = await createAdminGroupHelper();

    const admins = [];

    for (let i = 0; i < 10; i++) {
      admin = await createAdminHelper(adminGroup);
      admins.push({ email: admin.email });
    }

    const getAdminsQuery = `{
      getAdmins {
        data {
          email 
        }
      }
    }`;

    const response = await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
    });

    expect(response).toMatchObject({
      data: {
        getAdmins: {
          data: admins.reverse(),
        },
      },
    });

    done();
  });

  it("Test get admins pagination and limit", async (done) => {
    await truncate(conn, "admin");
    const adminGroup = await createAdminGroupHelper();

    const admins = [];

    for (let i = 0; i < 20; i++) {
      admin = await createAdminHelper(adminGroup);
      admins.push({ id: admin.id });
    }

    const getAdminsQuery = `{
      getAdmins(page: 2, limit: 7) {
        data {
          id 
        }
        last_page
        total_count
      }
    }`;
    console.table(admins);

    const response = await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
    });

    expect(response).toMatchObject({
      data: {
        getAdmins: {
          data: admins.reverse().slice(7, 14),
          last_page: 3,
          total_count: 20,
        },
      },
    });

    done();
  });

  it("Test get admins by email", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const getAdminsQuery = `{
      getAdmins(email: "${admin.email}") {
        data {
          email 
        }
      }
    }`;

    const response = await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
    });

    expect(response).toMatchObject({
      data: {
        getAdmins: {
          data: [{ email: admin.email }],
        },
      },
    });

    done();
  });
});
