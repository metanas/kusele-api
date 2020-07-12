import { Connection } from "typeorm";
import { connection } from "../../test-utils/connection";
import { createAdminGroupHelper } from "../../helpers/createAdminGroupHelper";
import { createAdminHelper } from "../../helpers/createAdminHelper";
import { loginHelper } from "../../helpers/loginHelper";
import { Admin } from "../../../src/entity/Admin";
import { graphqlCall } from "../../test-utils/graphqlCall";
import * as faker from "faker";
import { truncate } from "../../helpers/truncateTables";
import Permissions from "../../../src/utils/Permissions";

describe("Test AdminGroup Resolver", () => {
  let conn: Connection;
  let admin: Admin;
  let token: string;

  beforeAll(async (done) => {
    conn = await connection();
    done();
  });

  afterAll(async (done) => {
    await conn.close();
    done();
  });

  beforeEach(async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    token = await loginHelper(admin);
    done();
  });

  it("Test create new admin group", async (done) => {
    const modify = [];
    const access = [];

    for (let i = 0; i < faker.random.number(20); i++) {
      access.push(faker.name.jobType());
    }

    for (let i = 0; i < faker.random.number(20); i++) {
      modify.push(faker.name.jobType());
    }

    const name = faker.name.jobTitle();

    const addAdminGroupMutation = `mutation {
      addAdminGroup(name: "${name}", access: ${JSON.stringify(access)}, modify: ${JSON.stringify(modify)}) {
        name
        permissions {
          access
          modify
        }
      } 
    }`;

    const response = await graphqlCall({
      source: addAdminGroupMutation,
      isAdmin: true,
      admin,
      token,
    });

    expect(response.data).toMatchObject({
      addAdminGroup: {
        name,
        permissions: {
          access,
          modify,
        },
      },
    });

    done();
  });

  it("Test update admin group", async (done) => {
    const adminGroup = await createAdminGroupHelper();

    const name = faker.name.jobTitle();

    const modify = [];
    const access = [];

    for (let i = 0; i < faker.random.number(20); i++) {
      access.push(faker.name.jobType());
    }

    for (let i = 0; i < faker.random.number(20); i++) {
      modify.push(faker.name.jobType());
    }

    const updateAdminGroupMutation = `mutation {
      updateAdminGroup(id: "${adminGroup.id}", name: "${name}", access: ${JSON.stringify(
      access,
    )}, modify: ${JSON.stringify(modify)}) {
        name
        permissions {
          access
          modify
        }
      }
    }`;

    const response = await graphqlCall({
      source: updateAdminGroupMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      updateAdminGroup: {
        name,
        permissions: {
          access,
          modify,
        },
      },
    });

    done();
  });

  it("Test delete admin group", async (done) => {
    const adminGroup = await createAdminGroupHelper();

    const deleteAdminGroupMutation = `mutation {
      deleteAdminGroup(id: "${adminGroup.id}") 
    }`;

    const response = await graphqlCall({
      source: deleteAdminGroupMutation,
      token,
      isAdmin: true,
      admin,
    });

    expect(response.data).toMatchObject({
      deleteAdminGroup: true,
    });

    done();
  });

  it("Test delete associated admin group", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    await createAdminHelper(adminGroup);

    const deleteAdminGroupMutation = `mutation {
      deleteAdminGroup(id: "${adminGroup.id}") 
    }`;

    const response = await graphqlCall({
      source: deleteAdminGroupMutation,
      token,
      isAdmin: true,
      admin,
    });

    expect(response.errors).toEqual([new Error("Group have relation with admin")]);

    done();
  });

  it("Test Get Admin Group by ID", async (done) => {
    const getAdminGroupQuery = `{
      getAdminGroup(id: "${admin.group.id}") {
        id
        name
        permissions {
          access
          modify
        }
      }
    }`;

    const response = await graphqlCall({
      source: getAdminGroupQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      getAdminGroup: {
        id: admin.group.id,
        name: admin.group.name,
        permissions: admin.group.permissions,
      },
    });

    done();
  });

  it("Test Get admin groups", async (done) => {
    await truncate(conn, "admin_group", true);
    const adminGroups = [];
    let name = "";
    for (let i = 0; i < 20; i++) {
      const adminGroup = await createAdminGroupHelper();
      adminGroups.push({ id: adminGroup.id });
      name = adminGroup.name;
    }

    let getAdminGroupsQuery = `{
      getAdminGroups {
        data {
          id
        }
        last_page
        total_count
      }
    }`;

    let response = await graphqlCall({
      source: getAdminGroupsQuery,
      isAdmin: true,
      admin,
      token,
    });

    expect(response.data).toMatchObject({
      getAdminGroups: {
        data: adminGroups,
        last_page: 1,
        total_count: 20,
      },
    });

    getAdminGroupsQuery = `{
      getAdminGroups(name: "${name}") {
        data {
          name
        }
        last_page
        total_count
      }
    }`;

    response = await graphqlCall({
      source: getAdminGroupsQuery,
      isAdmin: true,
      admin,
      token,
    });

    expect(response.data).toMatchObject({
      getAdminGroups: {
        data: [
          {
            name,
          },
        ],
        last_page: 1,
        total_count: 1,
      },
    });

    done();
  });

  it("Test get permissions", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const token = await loginHelper(admin);

    const getPermissionQuery = `{ getPermissions {
        access
        modify
      }
    }`;

    const response = await graphqlCall({
      source: getPermissionQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      getPermissions: Permissions,
    });

    done();
  });
});
