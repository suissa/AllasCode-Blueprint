import { AuthSessionService } from './auth-session.js';
import { DpopSecurityService, type DpopPublicJwk, type DpopResult } from './dpop.js';
import { PostQuantumSecurityService, type PqResult, type PqEncryptedEnvelope, type PqDetachedSignature, type PqPublicKeyDescriptor } from './post-quantum.js';

/** Single Auth bounded-context façade. Sub-capabilities never authorize around it. */
export class AuthManagerAgent {
  constructor(
    private readonly sessions:AuthSessionService,
    private readonly dpop:DpopSecurityService,
    private readonly pq:PostQuantumSecurityService,
  ){}

  issueSenderConstrainedToken(input:{session_id:string;public_jwk:DpopPublicJwk;context_id:string;ttl_ms:number;now:string}):DpopResult<{access_token:string;token_type:'DPoP';expires_in:number;cnf:{jkt:string}}>{
    const session=this.sessions.get(input.session_id,input.now);
    if(!session||session.state!=='active')return{outcome:'Error',code:'AccessTokenInactive'};
    if(session.context_id!==input.context_id)return{outcome:'Error',code:'CrossContextDenied'};
    return this.dpop.issueBoundAccessToken({public_jwk:input.public_jwk,principal_id:session.principal_id,context_id:session.context_id,capabilities:session.capabilities,ttl_ms:input.ttl_ms,now:input.now});
  }

  authorizeProtectedRequest(input:Parameters<DpopSecurityService['verifyProtectedRequest']>[0]){return this.dpop.verifyProtectedRequest(input);}
  createPostQuantumKey(input:{now:string;key_id?:string}):PqResult<PqPublicKeyDescriptor>{return this.pq.createKeySet(input);}
  rotatePostQuantumKey(input:{key_id:string;now:string}){return this.pq.rotate(input);}
  protect(input:{key_id:string;context_id:string;plaintext:string|Uint8Array;now:string}):PqResult<PqEncryptedEnvelope>{return this.pq.encrypt(input);}
  unprotect(input:{envelope:PqEncryptedEnvelope;context_id:string;now:string}){return this.pq.decrypt(input);}
  sign(input:{key_id:string;message:string|Uint8Array;context_id?:string;now:string}):PqResult<PqDetachedSignature>{return this.pq.sign(input);}
  verify(input:{signature:PqDetachedSignature;message:string|Uint8Array;context_id?:string;now:string}){return this.pq.verify(input);}
}
