<h1 align="center">
    A Simple Search Task using Gorilla Experiment Builder
</h1>

<p align="center"><i>Developed by Lizzie Collyer and Jake Ireland, early Feb., 2021, using [Gorilla Experiment Builder's](https://gorilla.sc/) code editor.</i></p>

## Policy Decision

All images are in a `Stimuli` directory.  Distractors have names `D<num>.jpg`; Faces, `F<num>.jpg`; etc. (for `C`, `HF`, and `LF` as well).  This is an important step in the randomisation process, because instead of randomly pulling an image from the directory, we randomly pull a number from a list of numbers, and then add (for example) `D` to the start, and `.jpg` to the end (you can change the file extension by changing the line at the top of `utils.ts`).

Furthermore, we aim to keep this programme as flexible as possible.  That is, to change the number of targets in each trial you will need to change `Tend` in `utils.ts` (similarly with the number of distractors).  To change the types of target images, you will need to change the lines defining the different prefixes at the top of `utils.ts`, and change the `stimConditions` variable at the top of `main.ts`, as well as, of course, uploading said target images given the naming convention (see above).  There are also a couple of functions within `utils.ts` one would have to change, should they add different conditions.

There are limitations to the flexibility of this programme, however.  Currently the programme is implemented to take different target blocks *given each block have the same number of target images*.  Though it is experimentally questionable to want blocks with different number of target images, to implement such a feature you would probably need to define a function which handles the array construction for different targets.  This could probably be an extension of `constructTargetArray` using a `switch`/`case` statement, and then you could need to change the appropriate function calls in `main.ts`

## A Note on `utils/`

These utilities were from prior to Gorilla work, where we considered pregenerating the arrays.  The main utility is `make_image_arr.py`, where we generate these image arrays.

Example:
```bash
$ python3 utils/make_image_arr.py # will generate an array of distractors

$ python3 utils/make_image_arr.py D # will generate an array of distractors

$ python3 utils/make_image_arr.py F # will generate an array of distractors with a face in a random position
```

If you need to change image size and padding between images, etc., there are lines at the top of the file you can change

Please ensure you have a `data` directory, with appropriate subdirectories (see below), and an `out` directory for the created images to go.
```bash
$ tree -L 2
.
├── LICENSE
├── README.md
├── data
│   ├── Cars
│   ├── Distractor
│   ├── Faces
│   ├── Highface\ pareidolia
│   └── Lowface\ pareidolia
├── out
│   ├── out.png
│   ├── out_resized.png
│   └── out_with_borders.png
├── src
│   ├── Style.less
│   ├── finish.hbs
│   ├── instructions.hbs
│   ├── main.ts
│   ├── trial.hbs
│   └── utils.ts
└── utils
    ├── getres.sh
    └── make_image_arr.py
```

## Notes on Gorilla's API

  - All main code is within a function parameter taken in by the function call `gorilla.ready`.  

  - Ensure you create any metrics called in `main.ts` in the <kbd>Metrics</kbd> tab or the Gorilla Code Editor.

  - We have used `gorilla/state_machine` to transition between trials, blocks, instructions, etc.  The main state machine call happens in the `gorilla.run` function.  When you add a state to the state machine, the function `addState` takes in two arguments: the state name you are adding, and a dictionary.  This dictionary consists of two keys: `onEnter` (whose value is a function which is executed every time the state is entered), and `onExit` (whose value is a function which is executed when the state is left).

  - You can pass a parameter to the state.  As far as I can tell, you can only pass a single parameter.  However, to overcome this you can create an `interface`.  The way you pass parameters to the `onEnter` part of a state is as follows:
    ```typescript
    SM.addState(State.MyState, {
        onEnter: (machine: stateMachine.Machine, someParameter: string) => {
        ....
        }
    })
    ```
    And then you call this in `transition`:
    ```typescript
    machine.transition(State.MyState, 'hello world')
    ```
    This works well `onEnter`, but as of time of writing (Feb., 2021), this functionality does not exist `onExit`.
