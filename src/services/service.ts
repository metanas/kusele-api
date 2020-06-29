import Express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { createAccessToken, createRefreshToken } from "../utils/Authorization";
import { AdminWhiteListJwt } from "../entity/AdminWhiteListJwt";
import { toSafeInteger } from "lodash";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function InitService() {
  const app = Express();

  app.use(cookieParser());

  app.post("/refresh_token", async (req: Request, res: Response) => {
    const token = req.cookies.jid;

    if (!token) {
      return res.send({ status: Error("Not Authenticated") });
    }

    let payload: Record<string, string>;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET) as Record<string, string>;
    } catch {
      return res.send({ status: Error("Not Authenticated") });
    }

    const admin = JSON.parse(await redis.get(payload.userId));

    if (!admin && admin.version !== payload.version) {
      return res.send({ status: Error("Not Authenticated") });
    }

    res.cookie("jid", createRefreshToken({ id: payload.id, version: toSafeInteger(payload.version) + 1 }));

    const jit = await AdminWhiteListJwt.createQueryBuilder()
      .update()
      .set({
        version: toSafeInteger(payload.version) + 1,
      })
      .returning(["version"])
      .execute();

    admin.version = jit.raw.version;

    await redis.set(payload.id, JSON.stringify({ ...admin }));

    return res.send({ status: true, token: createAccessToken(admin) });
  });

  return app;
}
