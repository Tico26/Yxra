# Specs

One spec per piece of work, numbered in order: `NNNN-short-name.md`. A spec is agreed in a grilling session, then reviewed and merged by pull request before the build starts. Words with a capital letter (Product, Retailer, UK size) mean exactly what [CONTEXT.md](../../CONTEXT.md) says.

Every spec has these sections, in this order:

1. **Goal**: what a Shopper (or Tico) can do when this is done, in a few sentences.
2. **Out of scope**: what this spec deliberately leaves for later.
3. **Terms**: the glossary words this spec relies on, plus any it adds.
4. **Decisions**: each choice made, the option picked and why, one line each.
5. **Rules**: numbered, one behaviour each, written so each rule can become a test ("When X, then Y"). A rule never names a library or table.
6. **Build steps**: the order of work, each step ending in something that runs.
7. **Open questions**: anything not yet settled, with who decides.

Change a merged spec by pull request, never silently.
