import { DpopSecurityService } from './dpop.js';
import { PostQuantumSecurityService } from './post-quantum.js';

// Composition root for the executable example. Production replaces repository
// adapters here without changing Agent/Tool contracts.
export const dpopSecurity = new DpopSecurityService();
export const postQuantumSecurity = new PostQuantumSecurityService();
