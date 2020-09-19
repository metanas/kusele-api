/* eslint-disable @typescript-eslint/ban-ts-comment */
import PaginatedResponse from "../modules/PaginatedResponse";
import { Product } from "../entity/Product";
import { Admin } from "../entity/Admin";
import { AdminGroup } from "../entity/AdminGroup";
import { HistoryAdminAction } from "../entity/HistoryAdminAction";
import Store from "../entity/Store";
import Supplier from "../entity/Supplier";

export const PaginatedProductResponse = PaginatedResponse(Product);
// @ts-ignore
export type PaginatedProductResponseType = InstanceType<typeof PaginatedProductResponse>;

export const PaginatedAdminResponse = PaginatedResponse(Admin);
// @ts-ignore
export type PaginatedAdminResponseType = InstanceType<typeof PaginatedAdminResponse>;

export const PaginatedAdminGroupResponse = PaginatedResponse(AdminGroup);
// @ts-ignore
export type PaginatedAdminGroupResponseType = InstanceType<typeof PaginatedAdminGroupResponse>;

export const PaginatedHistoryResponse = PaginatedResponse(HistoryAdminAction);
// @ts-ignore
export type PaginatedHistoryResponseType = InstanceType<typeof PaginatedHistoryResponse>;

export const PaginatedStoreResponse = PaginatedResponse(Store);
// @ts-ignore
export type PaginatedStoreResponseType = InstanceType<typeof PaginatedStoreResponse>;

export const PaginatedSupplierResponse = PaginatedResponse(Supplier);
// @ts-ignore
export type PaginatedSupplierResponseType = InstanceType<typeof PaginatedSupplierResponse>;
