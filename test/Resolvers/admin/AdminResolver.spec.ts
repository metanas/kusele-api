import { Connection } from "typeorm";
import { connection } from "../../test-utils/connection";
import { Admin } from "../../../src/entity/Admin";
import { graphqlCall } from "../../test-utils/graphqlCall";
import { createAdminHelper } from "../../helpers/createAdminHelper";
import { createAdminGroupHelper } from "../../helpers/createAdminGroupHelper";
import { truncate } from "../../helpers/truncateTables";
import * as faker from "faker";
import { StateEnum } from "../../../src/@types/StateEnum";
import { ForbiddenError } from "type-graphql";
import { loginHelper } from "../../helpers/loginHelper";

describe("Test Admin Resolver", () => {
  let conn: Connection;
  let admin: Admin;

  beforeAll(async (done) => {
    conn = await connection();
    done();
  });

  afterAll(async (done) => {
    await conn.close();
    done();
  });

  it("Test Getting Get By ID", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);
    const token = await loginHelper(admin);

    const getUserQuery = `{
      getAdmin(id: "${admin.id}" ){
        email
        group {
          name
        }
      }
    }`;

    const response = await graphqlCall({
      source: getUserQuery,
      isAdmin: true,
      token,
    });

    expect(response).toMatchObject({
      data: {
        getAdmin: {
          email: admin.email,
          group: {
            name: adminGroup.name,
          },
        },
      },
    });
    done();
  });

  it("Test get not found admin", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);
    const token = await loginHelper(admin);

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
      token,
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

    const token = await loginHelper(admin);

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
      token,
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

    const token = await loginHelper(admin);

    const getAdminsQuery = `{
      getAdmins(page: 2, limit: 7) {
        data {
          id 
        }
        last_page
        total_count
      }
    }`;

    const response = await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
      token,
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
    const token = await loginHelper(admin);

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
      token,
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

  it("Test add new admin", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);
    const token = await loginHelper(admin);

    const email = faker.internet.email();
    const addAdminMutation = `mutation {
      addAdmin(email: "${email}") {
        username
        state
        email
      }
    }`;

    const response = await graphqlCall({
      source: addAdminMutation,
      isAdmin: true,
      token,
    });

    expect(response).toMatchObject({
      data: {
        addAdmin: {
          email,
          username: null,
          state: StateEnum.New,
        },
      },
    });

    done();
  });

  it("Test create Admin", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const username = faker.name.firstName();

    const createAdminMutation = `mutation {
      createAdmin(id: "${admin.id}", password: "${faker.random.alphaNumeric(10)}", username: "${username}")
    }`;

    let response = await graphqlCall({
      source: createAdminMutation,
      isAdmin: true,
    });

    expect(response.data.createAdmin).toBe(true);

    const token = await loginHelper(admin);

    const getUserQuery = `{
      getAdmin(id: "${admin.id}" ){
        email
        username
        state
        group {
          name
        }
      }
    }`;

    response = await graphqlCall({
      source: getUserQuery,
      isAdmin: true,
      token,
    });

    expect(response).toMatchObject({
      data: {
        getAdmin: {
          email: admin.email,
          username: username,
          state: StateEnum.Enabled,
          group: {
            name: adminGroup.name,
          },
        },
      },
    });

    done();
  });

  it("Test create admin not found", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup, StateEnum.Disabled);

    const createAdminMutation = `mutation {
      createAdmin(id: "${admin.id}", password: "${faker.random.alphaNumeric(
      10,
    )}", username: "${faker.name.firstName()}")
    }`;

    const response = await graphqlCall({
      source: createAdminMutation,
      isAdmin: true,
    });

    expect(response.errors[0].message).toBe(new ForbiddenError().message);
    done();
  });

  it("Test toggle state", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup, StateEnum.Disabled);
    const token = await loginHelper(admin);

    const adminToggleStateMutation = `mutation {
      adminToggleState(id: "${admin.id}") {
        state
      }
    }`;

    let response = await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
    });

    expect(response.data).toMatchObject({
      adminToggleState: {
        state: StateEnum.Enabled,
      },
    });

    response = await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
    });

    expect(response.data).toMatchObject({
      adminToggleState: {
        state: StateEnum.Disabled,
      },
    });

    done();
  });

  it("Test admin login", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const password = faker.random.alphaNumeric(10);

    const createAdmin = `mutation {
      createAdmin(id: "${admin.id}", password: "${password}", username: "${faker.name.firstName()}")
    }`;

    await graphqlCall({
      source: createAdmin,
      isAdmin: true,
    });

    const loginMutation = `mutation {
      login(email: "${admin.email}", password: "${password}") {
        id
      }
    }`;

    const response = await graphqlCall({
      source: loginMutation,
      isAdmin: true,
    });

    expect(response.data).toMatchObject({
      login: {
        id: admin.id,
      },
    });

    done();
  });

  it("Test login with not found admin", async (done) => {
    const loginMutation = `mutation {
      login(email: "${faker.internet.email()}", password: "${faker.random.alphaNumeric(10)}") {
        id
      }
    }`;

    const response = await graphqlCall({
      source: loginMutation,
      isAdmin: true,
    });

    expect(response.errors).toMatchObject([new Error("Admin not found!")]);
    done();
  });

  it("Test login with disabled account", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const password = faker.random.alphaNumeric(10);

    const createAdmin = `mutation {
      createAdmin(id: "${admin.id}", password: "${password}", username: "${faker.name.firstName()}")
    }`;

    await graphqlCall({
      source: createAdmin,
      isAdmin: true,
    });

    const adminToggleStateMutation = `mutation {
      adminToggleState(id: "${admin.id}") {
        state
      }
    }`;

    const token = await loginHelper(admin);

    await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
    });

    const loginMutation = `mutation {
      login(email: "${admin.email}", password: "${password}") {
        id
      }
    }`;

    const response = await graphqlCall({
      source: loginMutation,
      isAdmin: true,
    });

    expect(response.errors).toMatchObject([
      new Error("Your account is inactive, please contact support for more information!"),
    ]);
    done();
  });

  it("Test login when password is incorrect", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const password = faker.random.alphaNumeric(10);

    const createAdmin = `mutation {
      createAdmin(id: "${admin.id}", password: "${password}", username: "${faker.name.firstName()}")
    }`;

    await graphqlCall({
      source: createAdmin,
      isAdmin: true,
    });

    const loginMutation = `mutation {
      login(email: "${admin.email}", password: "${faker.random.alphaNumeric(10)}") {
        id
      }
    }`;

    const response = await graphqlCall({
      source: loginMutation,
      isAdmin: true,
    });

    expect(response.errors).toMatchObject([new Error("Invalid password!")]);

    done();
  });
});
