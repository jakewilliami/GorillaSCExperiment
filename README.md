<h1 align="center">
    GorillaSCExperiment
</h1>

Developed by Lizzie Collyer and Jake Ireland, early Feb., 2021, using [Gorilla Experiment Builder's](https://gorilla.sc/) code editor.

## Policy Decision

All images are in a `Stimuli` directory.  Distractors have names `D<num>.jpg`; Faces, `F<num>.jpg`; etc. (for `C`, `HF`, and `LF` as well).  This is an important step in the randomisation process, because instead of randomly pulling an image from the directory, we randomly pull a number from a list of numbers, and then add (for example) `D` to the start, and `.jpg` to the end.

## A Note on `utils`

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

All main code is within a function parameter taken in by the function call `gorilla.ready`.  

We have used `gorilla/state_machine` to transition between trials, blocks, instructions, etc.  The main state machine call happens in the `gorilla.run` function.  When you add a state to the state machine, the function `addState` takes in two arguments: the state name you are adding, and a dictionary.  This dictionary consists of two keys: `onEnter` (whose value is a function which is executed every time the state is entered), and `onExit` (whose value is a function which is executed when the state is left).

You can pass a parameter to the state.  As far as I can tell, you can only pass a single parameter.  However, to overcome this you can create an `interface`.  The way you pass parameters to the `onEnter` part of a state is as follows:
