// Plugins
// imported to experiment.html

var jsPsychThreeArmedBandit = (function (jspsych) { 
    'use strict';
  
    const info = {
      name: 'three-armed-bandit',
      description: '',
      parameters: {
        stimuli: {
            type: jspsych.ParameterType.STRING,
            default: null
        },
        left_key: {
          type: jspsych.ParameterType.KEYCODE,
          pretty_name: 'Left key',
          default: 'f'
        },
        right_key: {
          type: jspsych.ParameterType.KEYCODE,
          pretty_name: 'Right key',
          default: 'h'
        },
        middle_key: {
            type: jspsych.ParameterType.KEYCODE,
            pretty_name: 'Middle key',
            default: 'g'
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
            default: 500,
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
            default: [0, 1, 2],
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
            default: [1200, 500],
            description: 'The dimensions [width, height] of the html canvas on which things are drawn.'
        },
        background_colour: {
            type: jspsych.ParameterType.STRING,
            default: '#878787',
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
        reward_colour: {
            type: jspsych.ParameterType.STRING,
            default: '#fff', // white
            description: 'The colour of the selection box during reward feedback'
        },
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

    class ThreeArmedBanditPlugin {
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
          left_stimulus: null,
          middle_stimulus: null,
          right_stimulus: null,
          left_stim_number: null,
          middle_stim_number: null,
          right_stim_number: null,
          left_box: null,
          middle_box: null,
          right_box: null
        };

    /// TRIAL LOOP ///

    

    function DrawBackground(isPracticePhase){
      console.log("isPracticePhase in DrawBackground: ", isPracticePhase);

      // draw the background
      ctx.fillStyle = trial.background_colour;
      ctx.fillRect(0, 0, trial.canvas_dimensions[0], trial.canvas_dimensions[1]);

      // draw the progress text
      ctx.font = "28px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      let info_text = "";
      let additional_info = "";

      if (isPracticePhase) {
        info_text = "Practice Trial " + counter.trial + " of " + trial.n_trials;
        additional_info = "Press f, g or h."

      } else {
        info_text = "Block " + counter.block + " of " + counter.n_blocks + ", Trial " + counter.trial + " of " + trial.n_trials;
      }

      ctx.fillText(info_text, trial.canvas_dimensions[0]/2, 3* ctx.measureText('M').width/2); 

      // If it's the practice phase, display additional_info
      if (isPracticePhase) {
        ctx.fillStyle = "yellow";
        ctx.font = "bold 28px Arial";
        ctx.fillText(additional_info, trial.canvas_dimensions[0]/2, 100);
      }

    };

    //position of stimulus
    display.left_stim_number = trial.stim_allocation[trial.left_stim_number];
    display.middle_stim_number = trial.stim_allocation[trial.middle_stim_number];
    display.right_stim_number = trial.stim_allocation[trial.right_stim_number];

    //left stimulus
    display.left_stimulus = [trial.stimuli[display.left_stim_number]];
    //right stimulus
    display.right_stimulus = [trial.stimuli[display.right_stim_number]];
    //middle stimulus
    display.middle_stimulus = [trial.stimuli[display.middle_stim_number]];


    DrawScreen();

    // start the response listener
    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: AfterResponse,
      valid_responses: ['f', 'g', 'h'],
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

      // if the left stimulus is selected, show the appropriate selection box
      if (display.left_box == "selected"){
        _DrawSelectionBox(-trial.stimulus_offset[0], trial.stimulus_offset[1], trial.reward_colour);
      } else  if (response.feedback !== undefined && response.feedback !== null) {
        _DrawFeedback();
      }
  
      // draw the left stimulus
      if (display.left_stimulus !== null){
        _DrawStimulus(display.left_stimulus, [-trial.stimulus_offset[0], trial.stimulus_offset[1]]);
      }

      // if the middle stimulus is selected, show the appropriate selection box
      if (display.middle_box == "selected"){
        _DrawSelectionBox(0, trial.stimulus_offset[1], trial.reward_colour);
      } else  if (response.feedback !== undefined && response.feedback !== null) {
        _DrawFeedback();
      }

      // draw the middle stimulus
      if (display.middle_stimulus !== null){
        _DrawStimulus(display.middle_stimulus, [0, trial.stimulus_offset[1]]);
      }


      // if the right stimulus is selected, show the appropriate selection box
      if (display.right_box == "selected"){
        _DrawSelectionBox(trial.stimulus_offset[0], trial.stimulus_offset[1], trial.reward_colour);
      } else  if (response.feedback !== undefined && response.feedback !== null) {
        _DrawFeedback();
      }

      // draw the right stimulus
      if (display.right_stimulus !== null){
        _DrawStimulus(display.right_stimulus, [trial.stimulus_offset[0], trial.stimulus_offset[1]]);
      }
      

    }; 
    
    function AfterResponse(info) {

      // clear keyboard listener
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      // assign response variables
      if (jsPsych.pluginAPI.compareKeys(trial.left_key, response.key)){ 
        response.choice = 'f';
        response.chosen_image = display.left_stim_number;
        //response.ur_chosen_image = trial.left_stim_number;
        display.left_box = "selected";
      } else if (jsPsych.pluginAPI.compareKeys(trial.right_key, response.key)){
        response.choice = 'h';
        response.chosen_image = display.right_stim_number;
        //response.ur_chosen_image = trial.right_stim_number;
        display.right_box = "selected";
      } else if (jsPsych.pluginAPI.compareKeys(trial.middle_key, response.key)){
        response.choice = 'g';
        response.chosen_image = display.middle_stim_number;
        //response.ur_chosen_image = trial.middle_stim_number;
        display.middle_box = "selected";
      }


      // update the screen with the pressed key
      function updateScreen() {
        requestAnimationFrame(() => {
          DrawScreen(ctx);
        });
      }
     
      updateScreen();
     // DrawScreen(ctx);

      // set a timeout to display the feedback after a given delay
      jsPsych.pluginAPI.setTimeout(function() {
        DisplayFeedback();
      }, trial.choice_display_duration);

      console.log("Response info:", info);

    };

    function DisplayFeedback(){

      var left_stim_number = null;
      var right_stim_number = null;
      var middle_stim_number = null;

      left_stim_number = trial.left_stim_number;
      right_stim_number = trial.right_stim_number;
      middle_stim_number = trial.middle_stim_number;
      
        if (response.choice == "f"){
          response.chosen_image = display.left_stim_number
          //response.ur_chosen_image = left_stim_number
        }
      
        if (response.choice == "h"){
          response.chosen_image = display.right_stim_number
          //response.ur_chosen_image = right_stim_number
        }

        if (response.choice == "g"){
            response.chosen_image = display.middle_stim_number
            //response.ur_chosen_image = middle_stim_number
          }
      

      // check recorded choice
      // independent condition
      if (counter.block == 1 && condition_assignment == 'ind' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.ind1[left_stim_number].length > 0){
            response.feedback = queues.ind1[left_stim_number][0];
            queues.ind1[left_stim_number].shift();
            queues.ind1[middle_stim_number].shift();
            queues.ind1[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.ind1[right_stim_number].length > 0){
          response.feedback = queues.ind1[right_stim_number][0];
          queues.ind1[left_stim_number].shift();
          queues.ind1[middle_stim_number].shift();
          queues.ind1[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.ind1[middle_stim_number].length > 0){
          response.feedback = queues.ind1[middle_stim_number][0];
          queues.ind1[left_stim_number].shift();
          queues.ind1[middle_stim_number].shift();
          queues.ind1[right_stim_number].shift(); //shift all queues
        } 
      }
    } else if (condition_assignment == 'ind' && isPracticePhase == true){
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.practice[left_stim_number].length > 0){
            response.feedback = queues.practice[left_stim_number][0];
            queues.practice[left_stim_number].shift();
            queues.practice[middle_stim_number].shift();
            queues.practice[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.practice[right_stim_number].length > 0){
          response.feedback = queues.practice[right_stim_number][0];
          queues.practice[left_stim_number].shift();
          queues.practice[middle_stim_number].shift();
          queues.practice[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.practice[middle_stim_number].length > 0){
          response.feedback = queues.practice[middle_stim_number][0];
          queues.practice[left_stim_number].shift();
          queues.practice[middle_stim_number].shift();
          queues.practice[right_stim_number].shift(); //shift all queues
        } 
      }
    }

  

    if (counter.block == 2 && condition_assignment == 'ind' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.ind2[left_stim_number].length > 0){
            response.feedback = queues.ind2[left_stim_number][0];
            queues.ind2[left_stim_number].shift();
            queues.ind2[middle_stim_number].shift();
            queues.ind2[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.ind2[right_stim_number].length > 0){
          response.feedback = queues.ind2[right_stim_number][0];
          queues.ind2[left_stim_number].shift();
          queues.ind2[middle_stim_number].shift();
          queues.ind2[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.ind2[middle_stim_number].length > 0){
          response.feedback = queues.ind2[middle_stim_number][0];
          queues.ind2[left_stim_number].shift();
          queues.ind2[middle_stim_number].shift();
          queues.ind2[right_stim_number].shift(); //shift all queues
        } 
      }
    }

    if (counter.block == 3 && condition_assignment == 'ind' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.ind3[left_stim_number].length > 0){
            response.feedback = queues.ind3[left_stim_number][0];
            queues.ind3[left_stim_number].shift();
            queues.ind3[middle_stim_number].shift();
            queues.ind3[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.ind3[right_stim_number].length > 0){
          response.feedback = queues.ind3[right_stim_number][0];
          queues.ind3[left_stim_number].shift();
          queues.ind3[middle_stim_number].shift();
          queues.ind3[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.ind3[middle_stim_number].length > 0){
          response.feedback = queues.ind3[middle_stim_number][0];
          queues.ind3[left_stim_number].shift();
          queues.ind3[middle_stim_number].shift();
          queues.ind3[right_stim_number].shift(); //shift all queues
        } 
      }
    }
    

    // structured condition

    if (counter.block == 1 && condition_assignment == 'str' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.str1[left_stim_number].length > 0){
            response.feedback = queues.str1[left_stim_number][0];
            queues.str1[left_stim_number].shift();
            queues.str1[middle_stim_number].shift();
            queues.str1[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.str1[right_stim_number].length > 0){
          response.feedback = queues.str1[right_stim_number][0];
          queues.str1[left_stim_number].shift();
          queues.str1[middle_stim_number].shift();
          queues.str1[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.str1[middle_stim_number].length > 0){
          response.feedback = queues.str1[middle_stim_number][0];
          queues.str1[left_stim_number].shift();
          queues.str1[middle_stim_number].shift();
          queues.str1[right_stim_number].shift(); //shift all queues
        } 
      }
    } else if (condition_assignment == 'str' && isPracticePhase == true){
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.practice[left_stim_number].length > 0){
            response.feedback = queues.practice[left_stim_number][0];
            queues.practice[left_stim_number].shift();
            queues.practice[middle_stim_number].shift();
            queues.practice[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.practice[right_stim_number].length > 0){
          response.feedback = queues.practice[right_stim_number][0];
          queues.practice[left_stim_number].shift();
          queues.practice[middle_stim_number].shift();
          queues.practice[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.practice[middle_stim_number].length > 0){
          response.feedback = queues.practice[middle_stim_number][0];
          queues.practice[left_stim_number].shift();
          queues.practice[middle_stim_number].shift();
          queues.practice[right_stim_number].shift(); //shift all queues
        } 
      }
    }


    if (counter.block == 2 && condition_assignment == 'str' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.str2[left_stim_number].length > 0){
            response.feedback = queues.str2[left_stim_number][0];
            queues.str2[left_stim_number].shift();
            queues.str2[middle_stim_number].shift();
            queues.str2[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.str2[right_stim_number].length > 0){
          response.feedback = queues.str2[right_stim_number][0];
          queues.str2[left_stim_number].shift();
          queues.str2[middle_stim_number].shift();
          queues.str2[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.str2[middle_stim_number].length > 0){
          response.feedback = queues.str2[middle_stim_number][0];
          queues.str2[left_stim_number].shift();
          queues.str2[middle_stim_number].shift();
          queues.str2[right_stim_number].shift(); //shift all queues
        } 
      }
    }

    if (counter.block == 3 && condition_assignment == 'str' && isPracticePhase == false) { 
      if (response.choice == "f"){

        // get feedback from the queue and update the queue
          if (queues.str3[left_stim_number].length > 0){
            response.feedback = queues.str3[left_stim_number][0];
            queues.str3[left_stim_number].shift();
            queues.str3[middle_stim_number].shift();
            queues.str3[right_stim_number].shift(); //shift all queues
          } 

      } else if (response.choice == "h"){

        // get feedback from the queue and update the queue
        if (queues.str3[right_stim_number].length > 0){
          response.feedback = queues.str3[right_stim_number][0];
          queues.str3[left_stim_number].shift();
          queues.str3[middle_stim_number].shift();
          queues.str3[right_stim_number].shift(); //shift all queues
        } 

      }

      else if (response.choice == "g"){

        // get feedback from the queue and update the queue
        if (queues.str3[middle_stim_number].length > 0){
          response.feedback = queues.str3[middle_stim_number][0];
          queues.str3[left_stim_number].shift();
          queues.str3[middle_stim_number].shift();
          queues.str3[right_stim_number].shift(); //shift all queues
        } 
      }
    }
    
  
    
    
      
    

      // draw the updated stimuli to the screen
      //updateScreen();
      DrawScreen(ctx);

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
        console.log("Ending trial. Final response data:", response);

      // clear keyboard listener
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        'left_stim_number': display.left_stim_number,
        'middle_stim_number': display.middle_stim_number,
        'right_stim_number': display.right_stim_number,
        'trial_type': trial.trial_type,
        'chosen_image': response.chosen_image || null,
        'rt': response.rt || null,
        'choice': response.choice || null,
        'key_char': response.key || null,
        'stimulus_array': [trial.left_stim_number, trial.middle_stim_number, trial.right_stim_number],
        'feedback': response.feedback || null
      };

      console.log("Trial data:", trial_data);

      // increment the trial counter
      counter.trial += 1;

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

    function _DrawSelectionBox(stimulus_horiz_offset, stimulus_vert_offset, colour) {

      var selection_horiz_loc = (trial.canvas_dimensions[0]/2) + stimulus_horiz_offset  - (trial.stimulus_dimensions[0] / 2) - trial.selection_pen_width;
      var stim_vert_loc = (trial.canvas_dimensions[1]/2) + stimulus_vert_offset  - (trial.stimulus_dimensions[1] / 2) - trial.selection_pen_width; // specifies the y coordinate of the top left corner of the stimulus

      ctx.fillRect(selection_horiz_loc, stim_vert_loc, trial.stimulus_dimensions[0] + (2 * trial.selection_pen_width), trial.stimulus_dimensions[1] + (2 * trial.selection_pen_width));

      ctx.fillStyle = colour;
    

    } // end _DrawSelectionBox function


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
  } ThreeArmedBanditPlugin.info = info;
return ThreeArmedBanditPlugin;


  
})(jsPsychModule);



