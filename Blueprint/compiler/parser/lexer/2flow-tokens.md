# 2flow Lexer Tokens

This file defines the lexical contract for extended `2flow` sources.

## Structural keywords

- `flow` — starts a flow declaration.
- `execution` — starts the low-level execution declaration for one topological node.

## Topology operators

- `:--:` → `SEQUENCE`
- `!->` → `FAILURE_EDGE`
- `[` → `LBRACKET`
- `]` → `RBRACKET`
- `[?` → `HUMAN_GATE_START`
- `,` → `COMMA`

The lexer MUST prefer the longest token. Therefore `[?` is recognized before `[` and `->>` is recognized before `->`.

## Execution operators

- `->` → `EVENT_INGRESS`
- `<-` → `EVENT_EGRESS`
- `->>` → `INVOKE`
- `<<-` → `INVOCATION_RECEIVER`

The directional symbols are relative to the execution scope being described.

## Result algebra tokens

- `Ok` → `OK`
- `Error` → `ERROR`
- `<` → `LANGLE`
- `>` → `RANGLE`

`Ok<T>` and `Error<E>` are parsed structurally and MUST NOT be emitted as opaque string tokens.

## Names

`IDENTIFIER` accepts ASCII letters or `_` as the first character, followed by letters, digits, `_` or `-`.

`.` is emitted as `DOT`, allowing canonical references such as:

```2flow
StockAgent.DecreaseStock
```

The parser constructs `QualifiedName` rather than the lexer flattening it into one string.

## Layout

Newlines are significant for `flow`, topology continuation and `execution` statements.

Recommended tokens:

- `NEWLINE`
- `INDENT`
- `COMMENT`
- `EOF`

Indentation is structural only inside execution/result blocks and topology continuation. A compiler MAY normalize tabs to an implementation-defined indentation width before parsing, but the normalized source location MUST still map back to the original file for diagnostics.

## Comments

`#` begins a comment and consumes all characters until the next line ending.

## Longest-match order

A lexer SHOULD test symbolic tokens in approximately this order:

```text
<<-
->>
:--:
!->
[?
->
<-
[
]
<
>
,
.
```

This prevents the shorter arrows from consuming prefixes of the lower-level invocation operators.
