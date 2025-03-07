// Plugins
// imported to exp_wu.html

var jsPsychFourArmedBandit = (function (jspsych) { 
    'use strict';
  
    const info = {
      name: 'four-armed-bandit',
      description: '',
      parameters: {
        stimuli: {
            type: jspsych.ParameterType.STRING,
            default: null
        },
        q_key: {
          type: jspsych.ParameterType.KEYCODE,
          pretty_name: 'Q key',
          default: 'q'
        },
        w_key: {
          type: jspsych.ParameterType.KEYCODE,
          pretty_name: 'W key',
          default: 'w'
        },
        o_key: {
            type: jspsych.ParameterType.KEYCODE,
            pretty_name: 'O key',
            default: 'o'
          },
        p_key: {
          type: jspsych.ParameterType.KEYCODE,
          pretty_name: 'P key',
          default: 'p'
        },
        choice_duration: {
          type: jspsych.ParameterType.INT,
          pretty_name: 'Trial duration',
          default: null,
          description: 'Maximum RT'
        },
        feedback_duration: {
          type: jspsych.ParameterType.INT,
          pretty_name: 'Feedback duration',
          default: 1000,
          description: 'Duration of feedback display in ms'
        },
        iti_duration: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Duration of the inter-trial-interval',
            default: 100,
            description: 'How long the blank screen is displayed between trials in ms'
        },
        stimulus_offset: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Stimulus offset',
            default: [350, 0],
            description: '[horizontal, vertical]'
        },
        stim_allocation: {
            type: jspsych.ParameterType.INT,
            default: [0, 1, 2, 3],
            description: 'The mapping of the stimuli (allows randomisation).'
        }, 
        stimulus_dimensions: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Stimulus dimensions',
            default: [250, 250],
            description: 'Stimulus dimensions in pixels [width, height]'
        },
        canvas_dimensions: {
            type: jspsych.ParameterType.INT,
            default: [1400, 500],
            description: 'The dimensions [width, height] of the html canvas on which things are drawn.'
        },
        background_colour: {
            type: jspsych.ParameterType.STRING,
            default: '#878787', //#c0c0c0
            description: 'The colour of the background'
        },
        feedback_offset: {
            type: jspsych.ParameterType.INT,
            pretty_name: 'Feedback offset',
            default: [0, 0],
            description: 'Offset [horizontal, vertical] of the centre of the feedback from the centre of the canvas in pixels'
        },
        selection_pen_width: {
          type: jspsych.ParameterType.INT,
          pretty_name: 'Width of selection box',
          default: 15,
          description: 'Thickness (in pixels) of the selection box'
        },
        selection_colour: {
          type: jspsych.ParameterType.STRING,
          default: 'white',
          description: 'The colour of the selection box'
        },
        /* reward_colour: {
            type: jspsych.ParameterType.STRING,
            default: '#fff', // white
            description: 'The colour of the selection box during reward feedback'
        }, */
        feedback_dimensions: {
          type: jspsych.ParameterType.INT,
          pretty_name: 'Feedback dimensions',
          default: [150, 150],
          description: 'Feedback image dimensions in pixels [width, height]'
        },
        feedback_offset: {
          type: jspsych.ParameterType.INT,
          pretty_name: 'Feedback offset',
          default: [0, 0],//[270, -200],
          description: 'The offset [horizontal, vertical] of the centre of the feedback from the centre of the canvas in pixels'
        },
        feedback: {
          type: jspsych.ParameterType.STRING,
          default: null
        }

      }
    }

    class FourArmedBanditPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {


            // define new HTML, add canvas, and draw a blank background
            var new_html = `<canvas id="trial_canvas" width="${trial.canvas_dimensions[0]}" height="${trial.canvas_dimensions[1]} style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
            <canvas id="feedback_canvas" width="${trial.canvas_dimensions[0]}" height="${trial.canvas_dimensions[1]*2}" style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>`;
            display_element.innerHTML = new_html;
            var ctx = document.getElementById('trial_canvas').getContext('2d');
            DrawBackground(isPracticePhase);

            
          //container for key responses (~empty data frame in R?)
          var response = {
          rt: null,
          key: null,
          choice: null,
          key_char: null
          };

        //container for display configuration
        var display = {
          q_stimulus: null,
          w_stimulus: null,
          o_stimulus: null,
          p_stimulus: null,
          q_stim_number: null,
          w_stim_number: null,
          o_stim_number: null,
          p_stim_number: null,
          q_box: null,
          w_box: null,
          o_box: null,
          p_box: null
        };


    /// TRIAL LOOP ///


    function DrawBackground(isPracticePhase){
      /* console.log("isPracticePhase in DrawBackground: ", isPracticePhase); */

      // draw the background
      ctx.fillStyle = trial.background_colour;
      ctx.fillRect(0, 0, trial.canvas_dimensions[0], trial.canvas_dimensions[1]);

      // draw the progress text
      ctx.font = "34px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      let info_text = "";
      let additional_info = "";

      if (isPracticePhase && trial.choice_type == "round") { 
        info_text = "Practice: Trial " + counter.trial + " of " + trial.n_trials;
        additional_info = "Press q, w, o or p."

      } else if (isPracticePhase && trial.choice_type == "preview") {
        info_text = "Practice: Preview";
        additional_info = "Choose one option of which you'd like to see the outcome in trial 1."

      } else if (isPracticePhase == false && trial.choice_type == "round") {
        info_text = "Round " + counter.round + " of " + counter.n_rounds + ", Trial " + counter.trial + " of " + trial.n_trials;
      
      } else if (isPracticePhase == false && trial.choice_type == "preview") {
        info_text = "Preview";
        additional_info = "Choose one option of which you'd like to see the outcome in trial 1."
      
      }

      ctx.fillText(info_text, trial.canvas_dimensions[0]/2, 3* ctx.measureText('M').width/2); 

      // If it's the practice phase, display additional_info
      if (isPracticePhase == true || trial.choice_type == "preview") {
        ctx.fillStyle = "black";
        ctx.font = "bold 28px Arial";
        ctx.fillText(additional_info, trial.canvas_dimensions[0]/2, 100);
      }

    };

    //position of stimulus
    display.q_stim_number = trial.stim_allocation[trial.q_stim_number];
    display.w_stim_number = trial.stim_allocation[trial.w_stim_number];
    display.o_stim_number = trial.stim_allocation[trial.o_stim_number];
    display.p_stim_number = trial.stim_allocation[trial.p_stim_number];

    // Q stimulus
    display.q_stimulus = [trial.stimuli[display.q_stim_number]];
    // W stimulus
    display.w_stimulus = [trial.stimuli[display.w_stim_number]];
    // O stimulus
    display.o_stimulus = [trial.stimuli[display.o_stim_number]];
    // P stimulus
    display.p_stimulus = [trial.stimuli[display.p_stim_number]];


    DrawScreen();

    function updateScreen() {
      requestAnimationFrame(() => {
        DrawScreen(ctx);
      });
    }

    // start the response listener
    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: AfterResponse,
      valid_responses: ['q', 'w', 'o', 'p'],
      rt_method: 'performance',
      persist: false,
      allow_held_key: false
    });

    // set a timeout function to end the trial after a given time if no response is recorded
    if (trial.choice_duration !== null) {

      jsPsych.pluginAPI.setTimeout(function() {
        EndTrial();
      }, trial.choice_duration);

    }
  

    function DrawScreen() {

      // draw the Q stimulus
      if (display.q_stimulus !== null){
        _DrawStimulus(display.q_stimulus, [-trial.stimulus_offset[0]-100, trial.stimulus_offset[1]]);
      }
      // draw the W stimulus
      if (display.w_stimulus !== null){
        _DrawStimulus(display.w_stimulus, [-trial.stimulus_offset[0]+200, trial.stimulus_offset[1]]);
      }
      // draw the O stimulus
      if (display.o_stimulus !== null){
        _DrawStimulus(display.o_stimulus, [trial.stimulus_offset[0]-200, trial.stimulus_offset[1]]);
      }
      // draw the P stimulus
      if (display.p_stimulus !== null){
        _DrawStimulus(display.p_stimulus, [trial.stimulus_offset[0]+100, trial.stimulus_offset[1]]);
      }
      
    
      console.log(response.feedback)

      // draw feedback
      if (response.feedback !== undefined && response.feedback !== null) {
        _DrawFeedback();
      }
      

    }; 
    
    function AfterResponse(info) { // after each response, the unchosen stimuli disappear from the screen and the feedback is displayed

      // clear keyboard listener
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      // Clear the entire canvas first
      ctx.clearRect(0, 0, trial.canvas_dimensions[0], trial.canvas_dimensions[1]);
      // assign response variables
      if (jsPsych.pluginAPI.compareKeys(trial.q_key, response.key)){ 
        response.choice = 'q';
        response.chosen_image = display.q_stim_number;
        display.q_box = "selected";
        display.w_stimulus = null;
        display.o_stimulus = null;
        display.p_stimulus = null;
      } else if (jsPsych.pluginAPI.compareKeys(trial.w_key, response.key)){
        response.choice = 'w';
        response.chosen_image = display.w_stim_number;
        display.w_box = "selected";
        display.q_stimulus = null;
        display.o_stimulus = null;
        display.p_stimulus = null;
      } else if (jsPsych.pluginAPI.compareKeys(trial.o_key, response.key)){
        response.choice = 'o';
        response.chosen_image = display.o_stim_number;
        display.o_box = "selected";
        display.q_stimulus = null;
        display.w_stimulus = null;
        display.p_stimulus = null;
      } else if (jsPsych.pluginAPI.compareKeys(trial.p_key, response.key)){
        response.choice = 'p';
        response.chosen_image = display.p_stim_number;
        display.p_box = "selected";
        display.q_stimulus = null;
        display.w_stimulus = null;
        display.o_stimulus = null;

      }


      // update the screen with the pressed key
     
      //updateScreen();
      DrawBackground(isPracticePhase);
      DrawScreen(ctx);

      // set a timeout to display the feedback after a given delay
      jsPsych.pluginAPI.setTimeout(function() {
        DisplayFeedback();
      }, 100);

    };

    function DisplayFeedback(){

      var q_stim_number = null;
      var w_stim_number = null;
      var o_stim_number = null;
      var p_stim_number = null;

      q_stim_number = trial.q_stim_number;
      w_stim_number = trial.w_stim_number;
      o_stim_number = trial.o_stim_number;
      p_stim_number = trial.p_stim_number;
      
        if (response.choice == "q"){
          response.chosen_image = display.q_stim_number
        }
      
        if (response.choice == "w"){
          response.chosen_image = display.w_stim_number
        }

        if (response.choice == "o"){
            response.chosen_image = display.o_stim_number
        }

        if (response.choice == "p"){
          response.chosen_image = display.p_stim_number
        }
      
      /*
      // Store an original copy of each queue for resetting
      let originalQueues = JSON.parse(JSON.stringify(queues));  // Deep copy

      */

      // check recorded choice
      // independent condition
      if ((condition_assignment == 'ind' && isPracticePhase == false && isAcquisition == true) || (condition_assignment == 'str' && isPracticePhase == false && isAcquisition == false)) { 
      // Determine the correct queue based on counter.round
      let queueName_ind = "ind" + (counter.round <= 20 ? counter.round : counter.round-20); // Dynamically create the queue name
      let queue_ind = queues[queueName_ind]; // Access the appropriate queue object

      if (response.choice == "q"){

        // get feedback from the queue and update the queue
          if (queue_ind[q_stim_number].length > 0){
            response.feedback = queue_ind[q_stim_number][0];

            if (trial.choice_type == "round") { 
              queue_ind[q_stim_number].shift();
              queue_ind[w_stim_number].shift();
              queue_ind[o_stim_number].shift();
              queue_ind[p_stim_number].shift(); //shift all queues (no shift after preview trial)
            }

          } 

      } else if (response.choice == "w"){

        // get feedback from the queue and update the queue
        if (queue_ind[w_stim_number].length > 0){
          response.feedback = queue_ind[w_stim_number][0];

          if (trial.choice_type == "round") { 
            queue_ind[q_stim_number].shift();
            queue_ind[w_stim_number].shift();
            queue_ind[o_stim_number].shift();
            queue_ind[p_stim_number].shift(); //shift all queues
          } 
        }

      }

      else if (response.choice == "o"){

        // get feedback from the queue and update the queue
        if (queue_ind[o_stim_number].length > 0){
          response.feedback = queue_ind[o_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queue_ind[q_stim_number].shift();
            queue_ind[w_stim_number].shift();
            queue_ind[o_stim_number].shift();
            queue_ind[p_stim_number].shift(); //shift all queues
          } 
        } 
      }

      else if (response.choice == "p"){

        // get feedback from the queue and update the queue
        if (queue_ind[p_stim_number].length > 0){
          response.feedback = queue_ind[p_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queue_ind[q_stim_number].shift();
            queue_ind[w_stim_number].shift();
            queue_ind[o_stim_number].shift();
            queue_ind[p_stim_number].shift(); //shift all queues
          } 
        } 
      }


    } else if (condition_assignment == 'ind' && isPracticePhase == true){
      if (response.choice == "q"){

        // get feedback from the queue and update the queue
          if (queues.practice_ind[q_stim_number].length > 0){
            response.feedback = queues.practice_ind[q_stim_number][0];
            
            if (trial.choice_type == "round") { 
              queues.practice_ind[q_stim_number].shift();
              queues.practice_ind[w_stim_number].shift();
              queues.practice_ind[o_stim_number].shift();
              queues.practice_ind[p_stim_number].shift(); //shift all queues
            }
          } 

      } else if (response.choice == "w"){

        // get feedback from the queue and update the queue
        if (queues.practice_ind[w_stim_number].length > 0){
          response.feedback = queues.practice_ind[w_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_ind[q_stim_number].shift();
            queues.practice_ind[w_stim_number].shift();
            queues.practice_ind[o_stim_number].shift();
            queues.practice_ind[p_stim_number].shift(); //shift all queues
          }
        } 

      }

      else if (response.choice == "o"){

        // get feedback from the queue and update the queue
        if (queues.practice_ind[o_stim_number].length > 0){
          response.feedback = queues.practice_ind[o_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_ind[q_stim_number].shift();
            queues.practice_ind[w_stim_number].shift();
            queues.practice_ind[o_stim_number].shift();
            queues.practice_ind[p_stim_number].shift(); //shift all queues
          }
        } 
      }

      else if (response.choice == "p"){

        // get feedback from the queue and update the queue
        if (queues.practice_ind[p_stim_number].length > 0){
          response.feedback = queues.practice_ind[p_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_ind[q_stim_number].shift();
            queues.practice_ind[w_stim_number].shift();
            queues.practice_ind[o_stim_number].shift();
            queues.practice_ind[p_stim_number].shift(); //shift all queues
          }
        } 
      }
    }


    // structured condition

    if ((condition_assignment == 'str' && isPracticePhase == false && isAcquisition == true) || (condition_assignment == 'ind' && isPracticePhase == false && isAcquisition == false)) { 
      // Determine the correct queue based on counter.round
      let queueName_str = "str" + (counter.round <= 20 ? counter.round : counter.round-20); // Dynamically create the queue name
      let queue_str = queues[queueName_str]; // Access the appropriate queue object
      
      if (response.choice == "q"){

        // get feedback from the queue and update the queue
          if (queue_str[q_stim_number].length > 0){
            response.feedback = queue_str[q_stim_number][0];
            
            if (trial.choice_type == "round") { 
              queue_str[q_stim_number].shift();
              queue_str[w_stim_number].shift();
              queue_str[o_stim_number].shift();
              queue_str[p_stim_number].shift(); //shift all queues
            } 
            
          } 

      } else if (response.choice == "w"){

        // get feedback from the queue and update the queue
        if (queue_str[w_stim_number].length > 0){
          response.feedback = queue_str[w_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queue_str[q_stim_number].shift();
            queue_str[w_stim_number].shift();
            queue_str[o_stim_number].shift();
            queue_str[p_stim_number].shift(); //shift all queues
          } 
        } 

      }

      else if (response.choice == "o"){

        // get feedback from the queue and update the queue
        if (queue_str[o_stim_number].length > 0){
          response.feedback = queue_str[o_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queue_str[q_stim_number].shift();
            queue_str[w_stim_number].shift();
            queue_str[o_stim_number].shift();
            queue_str[p_stim_number].shift(); //shift all queues
          } 
        } 
      }

      else if (response.choice == "p"){

        // get feedback from the queue and update the queue
        if (queue_str[p_stim_number].length > 0){
          response.feedback = queue_str[p_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queue_str[q_stim_number].shift();
            queue_str[w_stim_number].shift();
            queue_str[o_stim_number].shift();
            queue_str[p_stim_number].shift(); //shift all queues
          } 
        } 
      }


    } else if (condition_assignment == 'str' && isPracticePhase == true){
      if (response.choice == "q"){

        // get feedback from the queue and update the queue
          if (queues.practice_str[q_stim_number].length > 0){
            response.feedback = queues.practice_str[q_stim_number][0];
            
            if (trial.choice_type == "round") { 
              queues.practice_str[q_stim_number].shift();
              queues.practice_str[w_stim_number].shift();
              queues.practice_str[o_stim_number].shift();
              queues.practice_str[p_stim_number].shift(); //shift all queues
            }
          } 

      } else if (response.choice == "w"){

        // get feedback from the queue and update the queue
        if (queues.practice_str[w_stim_number].length > 0){
          response.feedback = queues.practice_str[w_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_str[q_stim_number].shift();
            queues.practice_str[w_stim_number].shift();
            queues.practice_str[o_stim_number].shift();
            queues.practice_str[p_stim_number].shift(); //shift all queues
          }
        } 

      }

      else if (response.choice == "o"){

        // get feedback from the queue and update the queue
        if (queues.practice_str[o_stim_number].length > 0){
          response.feedback = queues.practice_str[o_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_str[q_stim_number].shift();
            queues.practice_str[w_stim_number].shift();
            queues.practice_str[o_stim_number].shift();
            queues.practice_str[p_stim_number].shift(); //shift all queues
          }
        } 
      }

      else if (response.choice == "p"){

        // get feedback from the queue and update the queue
        if (queues.practice_str[p_stim_number].length > 0){
          response.feedback = queues.practice_str[p_stim_number][0];
          
          if (trial.choice_type == "round") { 
            queues.practice_str[q_stim_number].shift();
            queues.practice_str[w_stim_number].shift();
            queues.practice_str[o_stim_number].shift();
            queues.practice_str[p_stim_number].shift(); //shift all queues
          }
        } 
      }
    }

    /* will (probably) need this if acquisition phase = 20 rounds, but then perhaps if(condition_assignment == ...) instead of ||.
      Queues of the other condition are not depleted (transfer phase), and restoring all queues seems problematic (or code is not working properly).

    // resetting queues after the first use:
    if (queues.str10[q_stim_number].length == 0 || queues.ind10[q_stim_number].length == 0) {
      queues = JSON.parse(JSON.stringify(originalQueues));  // Restore original state
    
    }
    */

    

      // draw the updated stimuli to the screen
      updateScreen();
      //DrawScreen(ctx);

      // set a timeout to end the trial after a given delay
     jsPsych.pluginAPI.setTimeout(function() {
      ITI();
     }, trial.feedback_duration);

    }
    

    
    

  function ITI() {

    // draw the background of the canvas
     DrawBackground(isPracticePhase);

      // clear keyboard listener
       jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // set a timeout to end the ITI after a given delay
       jsPsych.pluginAPI.setTimeout(function() {
        EndTrial();
     }, trial.iti_duration);

    };

    function EndTrial() {

      
        if (condition_assignment == "ind") {
          if (counter.round == 1 || counter.round == 6 || counter.round == 13 || counter.round == 16) {
            correct_option = "w"
          } else if ([2, 3, 9, 12, 18, 22, 23, 26, 28, 29, 30].includes(counter.round)) {
            correct_option = "q"
          } else if ([4, 10, 11, 14, 19, 20, 21, 24, 25, 27].includes(counter.round)) {
            correct_option = "p"
          } else if ([5, 7, 8, 15, 17].includes(counter.round)) {
            correct_option = "o"
          }
          
        } else if (condition_assignment == "str") {
          if (counter.round == 21 || counter.round == 26) {
            correct_option = "w"
          } else if ([2, 3, 6, 8, 9, 10, 14, 15, 17, 18, 20, 22, 23, 29].includes(counter.round)) {
            correct_option = "q"
          } else if ([1, 4, 5, 7, 11, 12, 13, 16, 19, 24, 30].includes(counter.round)) {
            correct_option = "p"
          } else if ([25, 27, 28].includes(counter.round)) {
            correct_option = "o"
          }

        }

        console.log("Correct option set:", correct_option);  // Debugging
      
      // clear keyboard listener
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        'q_stim_number': display.q_stim_number,
        'w_stim_number': display.w_stim_number,
        'o_stim_number': display.o_stim_number,
        'p_stim_number': display.p_stim_number,
        'choice_type': trial.choice_type,                  /* type = preview vs. round */
        'chosen_image': response.chosen_image || null,
        'rt': response.rt || null,
        'choice': response.choice || null,
        'key_char': response.key || null,
        'stimulus_array': [trial.q_stim_number, trial.w_stim_number, trial.o_stim_number, trial.p_stim_number],
        'feedback': response.feedback || null,
        'round': counter.round,
        'correct_option': correct_option
      };

      
      // increment the trial counter
      counter.trial += 1;

      // track accuracy
      if (trial.choice_type === "round" && response.choice === correct_option) {
        accurate_choices += 1;
      }

      console.log("Choice made:", response.choice)
      console.log("Correct option:", correct_option) // cannot access correct_option as defined in on_start (round)
      console.log("Current accuracy:", accurate_choices)

      // move on to the next trial
      jsPsych.finishTrial(trial_data);

    }; // end EndTrial function

  function _DrawStimulus(stimulus_array, stimulus_offset) {

      // array sanity check: only draw a stimulus array if (a) the array exists, and (b) the array has a length greater than 0
      if (Array.isArray(stimulus_array) && stimulus_array.length > 0) {

        // create new image element
        var img = new Image();

        // specify that the image should be drawn once it is loaded
        img.onload = function(){_ImageOnload(img, trial.stimulus_dimensions, stimulus_offset)};

        // set the source path of the image; in JavaScript, this command also triggers the loading of the image
        img.src = stimulus_array[0];

      } // end array sanity check if-loop

    } // end _DrawStimulus function



    function _DrawFeedback() {

      // draw the background
      var feedback_ctx = document.getElementById('feedback_canvas').getContext('2d');
      feedback_ctx.fillStyle = trial.background_colour;
      feedback_ctx.fillRect(685, 1000, trial.feedback_dimensions[0], trial.feedback_dimensions[1]);

      // draw the feedback text
      feedback_ctx.font = "28px Arial";
      feedback_ctx.fillStyle = "white";
      feedback_ctx.textAlign = "center";
      var feedback_text = response.feedback + " points";
      feedback_ctx.fillText(feedback_text, 790 + trial.feedback_dimensions[0] / 2 - feedback_ctx.measureText(feedback_text).width, 600 + trial.feedback_dimensions[1] / 2);

    }

  
    function _ImageOnload(im, image_dimensions, image_offset){

      var stim_horiz_loc = (trial.canvas_dimensions[0]/2) + image_offset[0]  - (image_dimensions[0] / 2); // specifies the x coordinate of the top left corner of the stimulus
      var stim_vert_loc = (trial.canvas_dimensions[1]/2) + image_offset[1] - (image_dimensions[1] / 2); // specifies the y coordinate of the top left corner of the stimulus
      ctx.drawImage(im, stim_horiz_loc, stim_vert_loc, image_dimensions[0], image_dimensions[1]);

      } // end _StimulusOnload function

    } // end plugin.trial
  } FourArmedBanditPlugin.info = info;
return FourArmedBanditPlugin;


  
})(jsPsychModule);



