import { Connection } from "typeorm";
import { Admin } from "../../../src/entity/Admin";
import { connection } from "../../test-utils/connection";
import { createAdminHelper } from "../../helpers/createAdminHelper";
import { createAdminGroupHelper } from "../../helpers/createAdminGroupHelper";
import { loginHelper } from "../../helpers/loginHelper";
import { truncate } from "../../helpers/truncateTables";
import { createSupplierHelper } from "../../helpers/createSupplierHelper";
import { graphqlCall } from "../../test-utils/graphqlCall";
import * as faker from "faker";
import { StateEnum } from "../../../src/@types/StateEnum";

describe("Supplier Resolver Test", () => {
  let conn: Connection;
  let admin: Admin;
  let token = "";

  beforeAll(async (done) => {
    conn = await connection();
    const group = await createAdminGroupHelper();
    admin = await createAdminHelper(group);
    token = await loginHelper(admin);
    done();
  });

  afterAll(async (done) => {
    await conn.close();
    done();
  });

  it("Test Get Suppliers", async (done) => {
    await truncate(conn, "supplier");

    const suppliers = [];

    for (let i = 0; i < 20; i++) {
      const supplier = await createSupplierHelper(admin);
      suppliers.push({ email: supplier.email });
    }

    let getSuppliersQuery = `{
      getSuppliers(page: 1, limit: 10) {
        data {
          email
        }
        total_count
      }
    }`;

    let response = await graphqlCall({
      source: getSuppliersQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      getSuppliers: {
        data: suppliers.reverse().slice(0, 10),
        total_count: 20,
      },
    });

    getSuppliersQuery = `{
      getSuppliers(page: 2, limit: 10) {
        data {
          email
        }
        total_count
      }
    }`;

    response = await graphqlCall({
      source: getSuppliersQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      getSuppliers: {
        data: suppliers.slice(10, 20),
        total_count: 20,
      },
    });

    done();
  });

  it("Test Get Suppliers By Name", async (done) => {
    await truncate(conn, "supplier");

    const supplier = await createSupplierHelper(admin);

    const getSuppliersQuery = `{
      getSuppliers( name: "${supplier.first_name}") {
        data {
          email
        }
        total_count
      }
    }`;

    const response = await graphqlCall({
      source: getSuppliersQuery,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      getSuppliers: {
        data: [{ email: supplier.email }],
        total_count: 1,
      },
    });

    done();
  });

  it("Test Create Supplier", async (done) => {
    const supplier = {
      email: faker.internet.email(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
    };

    const createSupplierMutation = `mutation {
      createSupplier(email: "${supplier.email}", first_name: "${supplier.first_name}", last_name: "${supplier.last_name}") {
        email
        first_name
        last_name
      }
    }`;

    const response = await graphqlCall({
      source: createSupplierMutation,
      token,
      isAdmin: true,
      admin,
    });

    expect(response.data).toMatchObject({
      createSupplier: supplier,
    });

    done();
  });

  it("Test Supplier Toggle State", async () => {
    const supplier = await createSupplierHelper(admin, StateEnum.New);

    const supplierToggleStateMutation = `mutation {
      supplierToggleState(id: "${supplier.id}") {
        state
      }
    }`;

    const response = await graphqlCall({
      source: supplierToggleStateMutation,
      isAdmin: true,
      token,
      admin,
    });

    expect(response.data).toMatchObject({
      supplierToggleState: {
        state: "Enabled",
      },
    });
  });

  it("Test Delete Supplier", async (done) => {
    const supplier = await createSupplierHelper(admin, StateEnum.New);

    const deleteSupplierMutation = `mutation {
      deleteSupplier(id: "${supplier.id}") 
    }`;

    const response = await graphqlCall({
      source: deleteSupplierMutation,
      isAdmin: true,
      admin,
      token,
    });

    expect(response.data).toMatchObject({
      deleteSupplier: true,
    });

    done();
  });
});
