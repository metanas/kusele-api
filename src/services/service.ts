import Express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { createAccessToken, createRefreshToken } from "../utils/Authorization";
import { AdminWhiteListJwt } from "../entity/AdminWhiteListJwt";
import { toSafeInteger } from "lodash";
import { graphqlUploadExpress } from "graphql-upload";
import cors from "cors";
import monitor from "express-status-monitor";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function InitService() {
  const app = Express();

  app.use(cookieParser());

  app.use(monitor());

  app.use(
    cors({
      origin: "http://localhost:8080",
      credentials: true,
    }),
  );

  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  app.post("/refresh_token", async (req: Request, res: Response) => {
    const token = req.cookies.jid;

    if (!token) {
      return res.status(403).json({ ok: false, message: "Not Authenticated" });
    }

    let payload: Record<string, string>;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET) as Record<string, string>;
    } catch {
      return res.status(403).send({ ok: false, message: "Not Authenticated" });
    }

    const admin = JSON.parse(await redis.get(payload.id));

    if (!admin && admin?.version !== payload.version) {
      return res.status(403).send({ ok: false, message: "Not Authenticated" });
    }

    res.cookie("jid", createRefreshToken({ id: payload.id, version: toSafeInteger(payload.version) + 1 }));

    await AdminWhiteListJwt.createQueryBuilder()
      .update()
      .set({
        version: toSafeInteger(payload.version) + 1,
      })
      .where("id=:id", { id: payload.id })
      .returning(["version"])
      .execute();

    admin.version = toSafeInteger(payload.version) + 1;

    await redis.set(payload.id, JSON.stringify({ ...admin }));

    return res.status(200).send({ token: createAccessToken(admin) });
  });

  return app;
}
