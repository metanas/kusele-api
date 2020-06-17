import { Arg, Args, ForbiddenError, Mutation, Query, Resolver, Ctx, UseMiddleware } from "type-graphql";
import { Admin } from "../../entity/Admin";
import { PaginatedAdminResponse, PaginatedAdminResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { ElasticService } from "../../utils/ElasticService";
import { ceil } from "lodash";
import { Inject } from "typedi";
import { AdminArgs } from "../../modules/Args/AdminArgs";
import { ElasticServiceTesting } from "../../../test/test-utils/ElasticService";
import { Mailer } from "../../utils/Mailer";
import { StateEnum } from "../../@types/StateEnum";
import { compare, hash } from "bcryptjs";
import { ApiContext } from "../../@types/ApiContext";
import { sign } from "jsonwebtoken";
import { redis } from "../../utils/redis";
import { isAdmin } from "../../../middleware/Admin";

@Resolver()
export class AdminResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService | ElasticServiceTesting;

  @UseMiddleware(isAdmin)
  @Query(() => Admin)
  public async getAdmin(@Arg("id") id: string): Promise<Admin> {
    const admin = await Admin.findOne({ where: { id } });

    if (!admin) {
      throw new Error("Admin not found!");
    }

    return admin;
  }

  @UseMiddleware(isAdmin)
  @Query(() => PaginatedAdminResponse)
  public async getAdmins(
    @Arg("email") email: string,
    @Args() { name, limit, page }: PaginatedRequestArgs,
  ): Promise<PaginatedAdminResponseType> {
    let params = {};

    if (name || email) {
      params = {
        query: {
          match_phrase: {
            username: name,
            email,
          },
        },
      };
    }

    const { body } = await this.elasticService.client.search({
      index: "admin",
      from: (page - 1) * limit,
      size: limit,
      sort: "create_at:desc",
      body: params,
    });

    const data = body.hits.hits.map((hit: { _source: Record<string, unknown> }) => hit._source);
    const total_count = body.hits.total.value;

    return {
      data,
      total_count,
      last_page: ceil(total_count / limit),
    };
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Admin, { nullable: true })
  private async addAdmin(@Args() { email }: AdminArgs): Promise<Admin> {
    const admin = await Admin.create({
      email,
    }).save();

    await this.elasticService.client.index({
      index: "admin",
      id: admin.id,
      body: admin,
    });

    await this.resendEmail(email, admin.id);

    return admin;
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Boolean)
  private async resendEmail(@Arg("email") email: string, @Arg("id") id: string): Promise<boolean> {
    await Admin.createQueryBuilder()
      .update()
      .set({
        state: StateEnum.New,
      })
      .where("id=:id", { id })
      .execute();

    await this.elasticService.client.update({
      index: "admin",
      id,
      body: {
        doc: {
          state: StateEnum.New,
        },
      },
    });

    const mailer = new Mailer();

    mailer.send(email, "admin-invite", { email, link: `http://localhost:3000/admin/${id}/create` });

    return true;
  }

  @Mutation(() => Boolean)
  private async createAdmin(@Arg("id") id: string, @Args() { password, username }: AdminArgs): Promise<boolean> {
    const { body } = await this.elasticService.client.getSource({
      index: "admin",
      id,
    });

    if (body.state !== StateEnum.New) {
      throw new ForbiddenError();
    }

    const encryptedPassword = await hash(password, 12);

    await Admin.createQueryBuilder()
      .update()
      .set({
        password: encryptedPassword,
        username,
        state: StateEnum.Enabled,
      })
      .where("id=:id", { id })
      .execute();

    await this.elasticService.client.update({
      index: "admin",
      id,
      refresh: "true",
      body: {
        doc: {
          username,
          password: encryptedPassword,
          state: StateEnum.Enabled,
        },
      },
    });

    return true;
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Admin)
  private async adminToggleState(@Arg("id") id: string): Promise<Admin> {
    const admin = await this.getAdmin(id);

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
  private async login(@Ctx() ctx: ApiContext, @Args() { email, username, password }: AdminArgs): Promise<Admin> {
    const admin = await Admin.createQueryBuilder()
      .select()
      .where("email=:email", { email })
      .orWhere("username=:username", { username })
      .getOne();

    if (!admin) {
      throw new Error("Admin not found!");
    }

    const isCorrect = await compare(password, admin.password);

    if (!isCorrect) {
      throw new Error("Invalid password!");
    }

    if (admin.state !== StateEnum.Enabled) {
      throw new Error("Your account is inactive, please contact support for more information!");
    }

    const token = sign(JSON.stringify(admin), process.env.ACCESS_TOKEN_SECRET);

    await redis.set(token, JSON.stringify(admin));

    ctx.res.setHeader("Authorization", `Bearer ${token}`);

    return admin;
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Boolean)
  private async deleteAdmin(@Ctx() ctx: ApiContext, @Arg("id") id: string): Promise<boolean> {
    console.log(ctx);

    await Admin.createQueryBuilder().delete().where("id=:id", { id }).execute();

    await this.elasticService.client.delete({
      index: "admin",
      id,
      refresh: "true",
    });
    return true;
  }
}
