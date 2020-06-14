import Email from "email-templates";

export class Mailer {
  _emailTemplate: Email;

  constructor() {
    this._emailTemplate = new Email({
      message: {
        from: "no-reply@kusele.com",
      },
      send: true,
      transport: {
        jsonTransport: true,
      },
    });
  }

  send(to: string, template: string, locals: Record<string, unknown>): void {
    this._emailTemplate
      .send({
        message: {
          to,
        },
        template,
        locals,
      })
      .catch((err) => console.error(err));
  }
}
