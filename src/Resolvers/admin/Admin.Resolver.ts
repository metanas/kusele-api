import { Arg, Args, Authorized, Ctx, ForbiddenError, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Admin } from "../../entity/Admin";
import { PaginatedAdminResponse, PaginatedAdminResponseType } from "../../@types/PaginatedResponseTypes";
import { ElasticService } from "../../utils/ElasticService";
import { ceil, set } from "lodash";
import { Inject } from "typedi";
import { ElasticServiceTesting } from "../../../test/test-utils/ElasticService";
import { Mailer } from "../../utils/Mailer";
import { StateEnum } from "../../@types/StateEnum";
import { compare, compareSync, hash } from "bcryptjs";
import { ApiContext } from "../../@types/ApiContext";
import { verify } from "jsonwebtoken";
import { isAdmin } from "../../../middleware/isAdmin";
import { randomBytes } from "crypto";
import { AdminWhiteListJwt } from "../../entity/AdminWhiteListJwt";
import { createAccessToken, createRefreshToken } from "../../utils/Authorization";
import { redis } from "../../utils/redis";
import { AwsS3 } from "../../utils/AwsS3";
import { v1 } from "uuid";
import { ManagedUpload } from "aws-sdk/clients/s3";
import { S3Mock } from "../../../test/test-utils/S3Mock";
import { AdminGroup } from "../../entity/AdminGroup";
import { HistoryAdminAction } from "../../entity/HistoryAdminAction";
import { UpdatePasswordArgs } from "../../modules/Args/admin/updatePasswordArgs";
import { GetAdminsArgs } from "../../modules/Args/admin/getAdminsArgs";
import { AddAdminArgs } from "../../modules/Args/admin/addAdminArgs";
import { CreateAdminArgs } from "../../modules/Args/admin/createAdminArgs";
import { LoginArgs } from "../../modules/Args/admin/loginArgs";
import { EditAdminArgs } from "../../modules/Args/admin/editAdminArgs";

@Resolver()
export class AdminResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService | ElasticServiceTesting;

  @Inject("S3")
  AWSS3: AwsS3 | S3Mock;

  @UseMiddleware(isAdmin)
  @Query(() => Admin)
  private async me(@Ctx() ctx: ApiContext): Promise<Admin> {
    const { body } = await this.elasticService.client.getSource({
      index: "admin",
      id: ctx.user.id,
    });
    return (body as unknown) as Admin;
  }

  @Authorized("Admin/getAdmin")
  @Query(() => Admin)
  public async getAdmin(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<Admin> {
    const admin = await Admin.findOne({ where: { id }, relations: ["group"] });

    if (!admin) {
      throw new Error("Admin not found!");
    }

    return admin;
  }

  @Authorized("Admin/getAdmins")
  @Query(() => PaginatedAdminResponse)
  public async getAdmins(
    @Args() { email, name, limit, page, order, sort }: GetAdminsArgs,
  ): Promise<PaginatedAdminResponseType> {
    let params = {};

    let sorted = "created_at:desc";

    if (name || email) {
      params = {
        query: {
          match_phrase_prefix: {
            username: name,
            email,
          },
        },
      };
    }

    if (order) {
      sorted = `${order}:${sort}`;
    }

    const { body } = await this.elasticService.client.search({
      index: "admin",
      from: (page - 1) * limit,
      size: limit,
      sort: sorted,
      body: params,
    });

    const data = body.hits.hits.map(({ _source }: { _source: Admin }) => ({
      ..._source,
      updated_at: new Date(_source.updated_at),
      created_at: new Date(_source.created_at),
    }));
    const total_count = body.hits.total.value;

    return {
      data,
      total_count,
      last_page: ceil(total_count / limit),
    };
  }

  @Authorized("Admin/addAdmin")
  @Mutation(() => Admin, { nullable: true })
  private async addAdmin(@Ctx() ctx: ApiContext, @Args() { email, group_id }: AddAdminArgs): Promise<Admin> {
    const group = await AdminGroup.findOne({ where: { id: group_id } });

    if (!group) {
      throw new Error("Admin group not found");
    }

    const admin = await Admin.create({
      email,
      created_by: ctx.user,
      group,
    }).save();

    await this.elasticService.client.index({
      index: "admin",
      id: admin.id,
      body: admin,
      refresh: true,
    });

    await this.resendEmail(ctx, admin.id);

    return admin;
  }

  @Authorized("Admin/resetPassword")
  @Mutation(() => Boolean)
  private async resetPassword(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<boolean> {
    let admin = await this.getAdmin(ctx, id);

    admin.reset_password_token = randomBytes(48).toString("hex");

    admin.reset_password_send_at = new Date();

    admin.updated_by = ctx.user;

    admin = await admin.save();

    await this.elasticService.client.update({
      index: "admin",
      id: admin.id,
      body: {
        doc: {
          reset_password_token: admin.reset_password_token,
          reset_password_send_at: admin.reset_password_send_at,
        },
      },
    });

    const mailer = new Mailer();

    await mailer.send(admin.email, "admin-invite", {
      email: admin.email,
      link: `http://localhost:8080/admin_ks/admin/${admin.reset_password_token}/reset_token`,
    });

    return true;
  }

  @Authorized("Admin/resetPassword")
  @Mutation(() => Boolean)
  private async resendEmail(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<boolean> {
    const admin = await this.getAdmin(ctx, id);
    if (admin.state !== StateEnum.New) {
      throw new ForbiddenError();
    }

    const mailer = new Mailer();

    await mailer.send(admin.email, "admin-invite", {
      email: admin.email,
      link: `http://localhost:8080/admin_ks/admins/${id}/create`,
    });

    return true;
  }

  @Mutation(() => Boolean)
  public async createAdmin(@Args() { id, username, password, avatar }: CreateAdminArgs): Promise<boolean> {
    let image: ManagedUpload.SendData = null;
    if (avatar?.filename) {
      image = await this.AWSS3.S3.upload({
        Key: `kusele-${v1()}`,
        Body: avatar.createReadStream(),
        Bucket: "kusele-storage",
      }).promise();
    }
    const { body } = await this.elasticService.client.getSource({
      index: "admin",
      id,
    });

    if (body.state !== StateEnum.New) {
      throw new ForbiddenError();
    }

    const encryptedPassword = await hash(password, 12);

    const data = {
      password: encryptedPassword,
      username,
      state: StateEnum.Enabled,
    };

    if (image) {
      set(data, "avatar", image.Location);
    }

    await Admin.createQueryBuilder().update().set(data).where("id=:id", { id }).execute();

    await this.elasticService.client.update({
      index: "admin",
      id,
      refresh: true,
      body: {
        doc: data,
      },
    });

    return true;
  }

  @Authorized("Admin/adminToggleState")
  @Mutation(() => Admin)
  private async adminToggleState(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<Admin> {
    if (ctx.user.id === id) {
      throw new ForbiddenError();
    }

    const admin = await this.getAdmin(ctx, id);

    const state = admin.state === StateEnum.Enabled ? StateEnum.Disabled : StateEnum.Enabled;

    await Admin.createQueryBuilder()
      .update()
      .set({
        state,
      })
      .where("id=:id", { id })
      .execute();

    await this.elasticService.client.update({
      index: "admin",
      id,
      body: {
        doc: {
          state,
        },
      },
    });

    admin.state = state;

    return admin;
  }

  @Mutation(() => Admin)
  private async login(@Ctx() ctx: ApiContext, @Args() { password, username }: LoginArgs): Promise<Admin> {
    const admin = await Admin.createQueryBuilder("admin")
      .select()
      .innerJoinAndSelect("admin.group", "group")
      .where("email=:username", { username })
      .orWhere("username=:username", { username })
      .getOne();

    if (!admin) {
      throw new Error("Admin not found!");
    }

    const isCorrect = await compare(password, admin.password || "");

    if (!isCorrect) {
      throw new Error("Invalid password!");
    }

    if (admin.state !== StateEnum.Enabled) {
      throw new Error("Your account is inactive, please contact support for more information!");
    }

    const jit = await AdminWhiteListJwt.create({
      admin,
    }).save();

    ctx.res.cookie("jid", createRefreshToken({ id: jit.id, version: jit.version }), {
      path: "/",
      expires: jit.expire_at,
      httpOnly: true,
    });

    ctx.res.set("Access-Control-Expose-Headers", ["x-token"]);
    ctx.res.set("x-token", createAccessToken({ id: admin.id }));

    await redis.set(jit.id, JSON.stringify({ ...admin, version: jit.version }));

    return admin;
  }

  @Authorized("Admin/deleteAdmin")
  @Mutation(() => Boolean)
  private async deleteAdmin(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<boolean> {
    const admin = await this.getAdmin(ctx, id);

    if (admin.state !== StateEnum.New) {
      throw new Error("You can delete enable/disable admin");
    }

    await this.elasticService.client.delete({
      index: "admin",
      id,
      refresh: true,
    });

    const creator = await Admin.findOne({ where: { id: ctx.user.id } });

    await Admin.createQueryBuilder().delete().where("id=:id", { id }).execute();

    await HistoryAdminAction.create({
      creator,
      table_name: `"admin"`,
      type_action: "DELETE",
      data: `DELETE FROM ADMIN WHERE id=${admin.id}`,
    }).save();

    return true;
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Boolean)
  async updatePassword(
    @Ctx() ctx: ApiContext,
    @Args() { password, new_password }: UpdatePasswordArgs,
  ): Promise<boolean> {
    const correct = await compareSync(password, ctx.user.password);

    if (!correct) {
      throw new Error("Wrong Password");
    }

    const encryptedPassword = await hash(new_password, 12);
    await Admin.createQueryBuilder()
      .update()
      .set({
        password: encryptedPassword,
      })
      .where("id=:id", { id: ctx.user.id })
      .execute();

    this.elasticService.client.update({
      index: "admin",
      id: ctx.user.id,
      body: {
        doc: {
          password: encryptedPassword,
        },
      },
    });

    this.elasticService.client.indices.refresh();

    return true;
  }

  @Authorized("Admin/editAdmin")
  @Mutation(() => Admin)
  public async editAdmin(@Args() { username, id, avatar, group_id }: EditAdminArgs): Promise<Admin> {
    const admin = await Admin.findOne({ where: { id }, relations: ["group"] });

    if (!admin) throw new Error("Admin Not Found!");

    const group = await AdminGroup.findOne({ where: { id: group_id } });

    if (!group) throw new Error("Admin Group Not Found!");

    const data = {
      username,
      group,
    };

    if (avatar?.filename) {
      const image = await this.AWSS3.S3.upload({
        Key: `kusele-${v1()}`,
        Body: avatar.createReadStream(),
        Bucket: "kusele-storage",
      }).promise();
      set(data, "avatar", image.Location);
    }

    await Admin.createQueryBuilder().update().set(data).where("id=:id", { id }).execute();

    await this.elasticService.client.update({
      index: "admin",
      id,
      refresh: true,
      body: {
        doc: {
          ...data,
          updated_at: new Date(),
        },
      },
    });

    return await Admin.findOne({ where: { id }, relations: ["group"] });
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Boolean)
  private async logout(@Ctx() ctx: ApiContext): Promise<boolean> {
    try {
      const jid = verify(ctx.req.cookies.jid, process.env.REFRESH_TOKEN_SECRET) as Record<string, string>;
      await AdminWhiteListJwt.createQueryBuilder().delete().where("id=:id", { id: jid.id }).execute();
      ctx.res.clearCookie("jid");
    } catch {
      return false;
    }
    return true;
  }
}
