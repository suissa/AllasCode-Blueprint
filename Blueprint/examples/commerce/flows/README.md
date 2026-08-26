# Flows

Flows are semantic choreographies. They connect domain events to the next responsible agent/action while preserving context isolation. They do not embed language-specific calls.

In the `.2flow` notation used here: `->` means event/input entering a participant, `<-` means event/output leaving it, `->>` means invocation and `<<-` means being invoked.
