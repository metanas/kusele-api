/* eslint-disable @typescript-eslint/ban-ts-comment */
import PaginatedResponse from "../modules/PaginatedResponse";
import { Product } from "../entity/Product";
import { Admin } from "../entity/Admin";
import { AdminGroup } from "../entity/AdminGroup";
import { HistoryAdminAction } from "../entity/HistoryAdminAction";

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
