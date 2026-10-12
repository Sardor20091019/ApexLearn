import dns from "node:dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { patchNodemailerIpv6 } from "./common/mailer.util";

async function bootstrap() {
  patchNodemailerIpv6();
  const app = await NestFactory.create(AppModule, { rawBody: true });

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, 
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);


  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });

  app.use("/queues", (req: Request, res: Response, next: NextFunction) => {
    const user = process.env.BULL_BOARD_USER;
    const pass = process.env.BULL_BOARD_PASSWORD;
    const authHeader = req.headers.authorization || "";

    if (authHeader.startsWith("Basic ")) {
      const b64 = authHeader.split(" ")[1] || "";
      const [u, p] = Buffer.from(b64, "base64").toString().split(":");
      if (u === user && p === pass) {
        return next();
      }
    }

    res.set("WWW-Authenticate", 'Basic realm="BullBoard Dashboard"');
    return res
      .status(401)
      .send("Authentication required to access BullMQ Dashboard");
  });

  const port = Number(process.env.PORT);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(
    `Bull Board Dashboard available at: http://localhost:${port}/queues`,
  );
}
bootstrap();
