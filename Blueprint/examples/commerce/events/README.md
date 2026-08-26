# Events

Events communicate facts between bounded contexts. They carry only the knowledge required by the next participant. Action terminal results remain `Ok` and `Error`; the domain event name carried by `Ok` describes the successful fact.
