# Parser

Lexing, grammar parsing, AST construction and diagnostics for AllasCode artifacts.

For extended `2flow`, the parser is organized as:

```text
.2flow source
   ↓
lexer/2flow-tokens.md
   ↓
grammar/2flow.ebnf
   ↓
ast/2flow.md
   ↓
name + ownership resolution
   ↓
semantic diagnostics
   ↓
Semantic Projection Graph / runtime IR
```

## Directories

- `grammar/` — normative concrete grammar. `2flow.ebnf` defines both topological and execution-level syntax.
- `lexer/` — lexical/token contracts and longest-match rules for 2flow operators.
- `ast/` — canonical abstract syntax tree. Topology and execution remain distinct AST families.
- `diagnostics/` — lexical, parser and semantic diagnostic codes.

The parser MUST preserve source spans so later semantic checks can report ownership, result-algebra and topology errors at the exact source location.

Human-facing semantics and examples live in `../../2flow.md`.
