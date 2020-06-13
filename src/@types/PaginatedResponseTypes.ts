import PaginatedResponse from "../modules/PaginatedResponse";
import { Product } from "../entity/Product";
import { Admin } from "../entity/Admin";
import { AdminGroup } from "../entity/AdminGroup";

export const PaginatedProductResponse = PaginatedResponse(Product);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type PaginatedProductResponseType = InstanceType<typeof PaginatedProductResponse>;

export const PaginatedAdminResponse = PaginatedResponse(Admin);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type PaginatedAdminResponseType = InstanceType<typeof PaginatedAdminResponse>;

export const PaginatedAdminGroupResponse = PaginatedResponse(AdminGroup);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type PaginatedAdminGroupResponseType = InstanceType<typeof PaginatedAdminGroupResponse>;
