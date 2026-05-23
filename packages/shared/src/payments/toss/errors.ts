export class TossConfigurationError extends Error {
  readonly code = "toss_configuration_error";

  constructor(message: string) {
    super(message);
    this.name = "TossConfigurationError";
  }
}
