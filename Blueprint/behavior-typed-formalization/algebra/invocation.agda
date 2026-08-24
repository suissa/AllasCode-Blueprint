module Invocation where

postulate
  Agent : Set
  Behavior : Set
  CanInvoke : Agent -> Behavior -> Set
