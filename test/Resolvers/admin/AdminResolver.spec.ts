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
import { getAdmin } from "../../helpers/getAdmin";

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

  it("Test Admin get info", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);

    const token = await loginHelper(admin);

    const meQuery = `{
      me {
        id
        email
      }
    }`;

    const response = await graphqlCall({
      source: meQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      me: {
        id: admin.id,
        email: admin.email,
      },
    });

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
      admin,
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
      admin,
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
      getAdmins(order: "create_at") {
        data {
          email 
        }
      }
    }`;

    const response = await graphqlCall({
      source: getAdminsQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response).toMatchObject({
      data: {
        getAdmins: {
          data: admins,
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
      admin,
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
      admin,
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
      addAdmin(email: "${email}", group_id: ${adminGroup.id}) {
        username
        state
        email
      }
    }`;

    const response = await graphqlCall({
      source: addAdminMutation,
      isAdmin: true,
      token,
      admin,
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

    const form = {
      id: admin.id,
      username: faker.name.firstName(),
      password: faker.random.alphaNumeric(10),
    };

    const createAdminMutation = `mutation createAdmin($id: String, $password: String, $username: String, $avatar: Upload) {
      createAdmin(id: $id, password: $password, username: $username, avatar: $avatar)
    }`;

    let response = await graphqlCall({
      source: createAdminMutation,
      value: form,
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
      admin,
    });

    expect(response).toMatchObject({
      data: {
        getAdmin: {
          email: admin.email,
          username: form.username,
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
    const superAdmin = await createAdminHelper(adminGroup, StateEnum.Enabled);
    admin = await createAdminHelper(adminGroup, StateEnum.Disabled);
    const token = await loginHelper(superAdmin);

    const adminToggleStateMutation = `mutation {
      adminToggleState(id: "${admin.id}") {
        state
      }
    }`;

    let response = await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
      admin: superAdmin,
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
      admin: superAdmin,
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
      login(username: "${admin.email}", password: "${password}") {
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
      login(username: "${faker.internet.email()}", password: "${faker.random.alphaNumeric(10)}") {
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
    const superAdmin = await createAdminHelper(adminGroup);
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

    const token = await loginHelper(superAdmin);

    await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
      admin: superAdmin,
    });

    const loginMutation = `mutation {
      login(username: "${admin.email}", password: "${password}") {
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
      login(username: "${admin.email}", password: "${faker.random.alphaNumeric(10)}") {
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

  it("Test delete enable/disable admin", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup, StateEnum.Enabled);

    const token = await loginHelper(admin);

    const deleteAdminMutation = `mutation {
      deleteAdmin(id: "${admin.id}")
    }`;

    const response = await graphqlCall({
      source: deleteAdminMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.errors).toEqual([new Error("You can delete enable/disable admin")]);

    done();
  });

  it("Test resend email when is not new", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup, StateEnum.Enabled);

    const token = await loginHelper(admin);

    const resendEmail = `mutation { 
      resendEmail(id: "${admin.id}")
    }`;

    const response = await graphqlCall({
      source: resendEmail,
      token,
      admin,
      isAdmin: true,
    });

    expect(response.errors[0].message).toBe(new ForbiddenError().message);

    done();
  });

  it("Test delete new admin", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup);
    const user = await createAdminHelper(adminGroup);

    const token = await loginHelper(admin);

    const getUserQuery = `{
      getAdmin(id: "${user.id}" ){
        email
        group {
          name
        }
      }
    }`;

    let response = await graphqlCall({
      source: getUserQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response).toMatchObject({
      data: {
        getAdmin: {
          email: user.email,
          group: {
            name: adminGroup.name,
          },
        },
      },
    });

    const deleteAdminMutation = `mutation {
      deleteAdmin(id: "${user.id}")
    }`;

    response = await graphqlCall({
      source: deleteAdminMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      deleteAdmin: true,
    });

    response = await graphqlCall({
      source: getUserQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.errors[0].message).toEqual("Admin not found!");

    done();
  });

  it("Test Admin Toggle his account", async (done) => {
    const adminGroup = await createAdminGroupHelper();
    admin = await createAdminHelper(adminGroup, StateEnum.Disabled);
    const token = await loginHelper(admin);

    const adminToggleStateMutation = `mutation {
      adminToggleState(id: "${admin.id}") {
        state
      }
    }`;

    const response = await graphqlCall({
      source: adminToggleStateMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.errors[0].message).toBe(new ForbiddenError().message);

    done();
  });

  it("Test Admin reset Password", async (done) => {
    const group = await createAdminGroupHelper();
    admin = await createAdminHelper(group);
    const token = await loginHelper(admin);

    expect(admin.reset_password_token).toBeNull();
    expect(admin.reset_password_send_at).toBeNull();

    const resetPasswordMutation = `mutation {
      resetPassword(id: "${admin.id}")
    }`;

    const response = await graphqlCall({
      source: resetPasswordMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      resetPassword: true,
    });

    admin = await getAdmin(admin.id);

    expect(admin.reset_password_token).not.toBeNull();
    expect(admin.reset_password_send_at).not.toBeNull();

    done();
  });
});
