# Attentional Blink &mdash; Implicit Task

## What's New

This experiment is based on [the original attentional blink experiment](../attentional-blink), with some changes:
  - T1 can now be either a face, a pariedolia face, or a watch (no distinction between digital or analogue);
  - T2 is always a flower;
  - There is no T1-related question;
  - Only lags 3 and 7 are allowed between T1 and T2 images (previously lag 1 was allowed).

### Refactor

In this version of the experiment, the structure of the experiment was heavily modified for the better, spliting things into different files, using strongly typed classes or interfaces where possible, and making everything generally more extensible.  While it is still not perfect, I think that future modifications of the experiment should use this as its basis.

## Configuratioins

You can edit configurations for this experiment in [`config.ts`](./src/config.ts).  There may also be parameters (such as target types and response keys) that you should change in [`types.ts`](./src/types.ts).

**In Gorilla, you must omit the file extensions**, so `config.ts` should be named in Gorilla as `config`, &c.

Will from Gorilla support said:
> The issue here was the naming of the files in the code tab.  They should be without the file extension.  Gorilla will implicitly assume that they are either .js or .ts files and treat them accordingly. If it were possible, another way of fixing this would have been to change the imports to filename.ts However, imports don't allow the extension to be specified so renaming the files was the best option!


