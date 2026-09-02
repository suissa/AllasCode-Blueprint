effect ledsa
  ctl authorize(intent : string, payload-hash : string) : bool
  ctl append-local(message-id : string, payload : string) : bool
  ctl publish(subject : string, payload : string) : bool
  ctl acknowledge(message-id : string) : bool

fun process(message-id : string, intent : string, payload : string, payload-hash : string) : <ledsa> bool
  if authorize(intent, payload-hash) then
    if append-local(message-id, payload) then acknowledge(message-id)
    else False
  else False
