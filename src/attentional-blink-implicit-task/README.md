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

Also note that string enums will throw compiler errors (at time of writing&mdash;October, 2022), but _they still work_.  Also from Will (upon asking about backend configurations of TypeScript and ECMAScript):
> So, the complaints about blah isn't available without targetting ECMAScript 5 and above are just typing file compliants.  You can see that the file that triggers the error is a .d.ts file.  This is actually just a result of a compilation error with the typing files and shouldn't affect the functionality that is available in the Code Editor.  Indeed, Gorilla is targetting ES5 with it's 'original' tooling (Task Builder 1, Questionnaire Builder 1, Code Editor) and ES6 for the latest tooling (Task Builder 2, Game Builder, Questionnaire Builder 2). 
> [...] 
> I did see that the compiler complained, but the code still compiled and ran correctly.  I suspect there is an issue with the live debugger for the Code Editor targetting an older version of Typescript (while the actual compiler is targeting the correct version).  It is on our roadmap to resolve this.  We do also have a new Code Editor in the works that will target ES6, though this likely won't be released until the latest iteration of our other core tools are fully released and stable.


