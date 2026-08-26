import type { ActionImplementation, UserInput } from '../../../runtime/types.js';

export const authorizeOperatorIntent: ActionImplementation = {
  execute({ state, payload }) {
    const input = payload as { user_id?: string };
    if (!input?.user_id) return { status: 'Error', event: 'OperatorAuthorizationError', payload: { message: 'user_id is required' } };
    const user = state.users.get(input.user_id) as UserInput | undefined;
    if (!user || user.status !== 'active') return { status: 'Error', event: 'OperatorAuthorizationError', payload: { message: 'operator is not active' } };
    return { status: 'Ok', event: 'OperatorAuthorized', payload: { user_id: user.user_id } };
  },
};
