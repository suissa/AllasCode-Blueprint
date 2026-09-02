{-# LANGUAGE DataKinds #-}
{-# LANGUAGE KindSignatures #-}

module AtomicBehavior where

data Phase = Incoming | Authorized | Persisted | Acked

data Message (p :: Phase) = Message
  { messageId :: String
  , payload :: String
  }

authorize :: Message 'Incoming -> Message 'Authorized
authorize (Message i p) = Message i p

persist :: Message 'Authorized -> Message 'Persisted
persist (Message i p) = Message i p

ack :: Message 'Persisted -> Message 'Acked
ack (Message i p) = Message i p
