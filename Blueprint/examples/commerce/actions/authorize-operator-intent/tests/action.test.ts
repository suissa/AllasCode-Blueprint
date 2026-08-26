import { join } from 'node:path';
import { defineActionTests } from '../../../tests/action-harness.js';
import { authorizeOperatorIntent } from '../implementation/implementation.js';

const actionDir = join(import.meta.dirname, '..');
defineActionTests({
  name: 'AuthorizeOperatorIntent',
  semantic_id: 'commerce.action.authorize-operator-intent',
  manifest: { name: 'AuthorizeOperatorIntent', semantic_id: 'commerce.action.authorize-operator-intent', results: { Ok: 'OperatorAuthorized', Error: 'OperatorAuthorizationError' } },
  implementation: authorizeOperatorIntent,
  actionDir,
  valid(index=0){ return { user_id: `user-${index}` }; },
  invalid(){ return {}; },
  setup(state,payload){ state.users.set(payload.user_id,{ user_id: payload.user_id, status:'active' }); },
});
