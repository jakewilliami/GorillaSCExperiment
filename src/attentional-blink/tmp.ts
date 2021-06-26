SM.addState(State.Trial, {
  onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
    console.log("We are in the sub-trial state, and we are now going to display the trial array: " + blockStruct.trialArrayURLs)

      function showTrial(i: number) {
        $('#gorilla')
        .queue(function (next) {
          $('#trial-image-' + i).css('visibility','visible');
          next();
        }) // end queue for '#gorilla'
        .delay(imageDisplayLength)
        .queue(function (next) {
          // this queue isn't strictly necessary, as we loop through the trial state, replacing the trial image
          $('#trial-image-' + i).css('visibility','hidden');
          if ((i + 1) == 20) {
            machine.transition(State.WatchTypeResponse, blockStruct);
          } else {
            showTrial(i + 1);
          }
          next();
        }) // end queue for '#gorilla'
      }

      gorilla.populateAndLoad('#gorilla', 'trial', {trialarray: blockStruct.trialArrayURLs},() => {
        $('#gorilla')
          .delay(beforeFixationDelay)
          .queue(function (next) {
            $('.fixation-cross').show();
            gorilla.refreshLayout();
            // $(this).dequeue();
            next();
          })// end queue for '#gorilla'
          .delay(fixationLength)
          .queue(function (next) {
            $('.fixation-cross').hide();
            gorilla.refreshLayout();
            // $(this).dequeue();
            next();
          }) // end queue for '#gorilla'
          .delay(afterFixationDelay)
          .queue(function (next) {
            // machine.transition(State.Trial, blockStruct);
            // $(this).dequeue();
            showTrial(0);
            next();
          });
      });
  } // end onEnter
}) // end addState State.Trial
