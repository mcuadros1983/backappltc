export class ArcaError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = "ArcaError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
