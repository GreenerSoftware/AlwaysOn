type ReturnDecision = {
  state: ReturnState;
  redirectLink?: string;
};

enum ReturnState {
  ServerError,
  ValidationError,
  Primary,
  Secondary,
  Tertiary,
  Quaternary,
  Quinary,
  Redirect,
}

export {ReturnState, type ReturnDecision};
