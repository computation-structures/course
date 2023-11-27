answers = (function () {
    var key_prefix = '/ComputationStructures/';   // prefix for all local storage keys

    function lookup(object,fname) {
        $.each(fname.split('.'),function (index,n) {
            if (object) object = object[n];
        });
        return object;
    }

    // identify keys belonging to this workbook
    function valid_storage_key(key) {
        return key.lastIndexOf(key_prefix,0) == 0;
    }

    // return storage key for current page
    function storage_key() {
        // extract relevant portion of document pathname
        var locn = window.location.pathname;
        var index = locn.lastIndexOf('/');
        index = locn.lastIndexOf('/',index-1);
        index = locn.lastIndexOf('/',index-1);

        // canonicalize so we can share state easily
        locn = key_prefix + locn.substr(index+1);
        
        return locn;
    }

    var update_handlers;  // {id: function to call with new answer}

    function setup_answers() {
        // first replace $paramaters with their values
        $('body').html(substitute_parameters($('body').html()));

        // extract relevant portion of document pathname
        var locn = storage_key();

        // {id: {value: string, check: string, message: string},...}
        let saved_answers = {};
        try {
            saved_answers = JSON.parse(localStorage.getItem(locn) || '{}');
        } catch (e) {
            console.log('parse of local state failed.');
        }

        // handler for messages from client iframes/windows
        // message data is JSONified answer object
        const update_handlers = {};
        $(window).on('message',function (event) {
            event = event.originalEvent;
            if (event.origin != window.location.origin) return;

            var answer = JSON.parse(event.data);
            var id = answer.id;
            if (id && update_handlers[id])
                update_handlers[id](answer,false);
        });

        let edict = {};
        $('.xyzzy').each(function () {
            var m = $(this).text().trim();
            edict = JSON.parse(substitute_parameters(xyzzy(m.substring(0,8),hexToString(m.substr(8)),0,0,0,2)));
            $(this).remove();
        });

        var answers = {};  // built from current <answer> tags
        if (saved_answers._seed_) answers._seed_ = saved_answers._seed_;
        $('answer').each(function (index,adiv) {
            adiv = $(adiv);
            const id = adiv.attr('id');
            const type = adiv.attr('type');
            const state_only = adiv.attr('state_only');
            const expected = adiv.attr('expected') || edict[id];
            const samples = adiv.attr('samples');
            const tool_name = adiv.attr('tool_name') || 'tool';
            const custom_checker = adiv.attr('checker');
            const label = adiv.find('label');
            const placeholder = adiv.attr('placeholder');
            const version = adiv.attr('version') || '1';
            let newdiv;
            let target;

            // set up answer object
            let answer;
            if (id) {
                if (id in answers)
                    console.log('duplicate <answer> id: '+id);
                if (id in saved_answers) {
                    answer = saved_answers[id];
                    // if version has changed, throw away old answer
                    if (answer.version != version)
                        answer = {id: id, version: version};
                } else {
                    answer = {id: id, version: version};
                }
                answers[id] = answer;

                // handler to update appropriate state if client sends an update or new state is loaded
                update_handlers[id] = function (a,update_value) {
                    answer.value = a.value;
                    answer.check = a.check;
                    answer.message = a.message;
                    update_answer(!update_value);

                    if (update_value) {
                        if (target) {
                            target.postMessage(JSON.stringify(answer),window.location.origin);
                        } else if (answer.value) {
                            $('.answer-text-input',newdiv).val(answer.value);
                        }
                    }
                };
            }

            function update_answer(update_timestamp) {
                if (answer === undefined) return;

                var a = newdiv;
                if (!a.hasClass('answer')) a = $('.answer',a);

                if (!state_only) {
                    // display results from checker
                    if (answer.message !== undefined)
                        a.find('.answer-message').html(answer.message);
                    else
                        a.find('.answer-message').empty();

                    // clear old result
                    a.removeClass('answer-right').removeClass('answer-wrong');

                    // apply new result, if any
                    if (answer.check !== undefined)
                        a.addClass('answer-'+answer.check);
                }

                // update saved state
                if (update_timestamp) answers._timestamp_ = Date.now();
                localStorage.setItem(locn,JSON.stringify(answers));
            };

            function check_answer(id,v,checker) {
                if (answer === undefined) return;

                // trim white space from answer
                answer.value = v.replace(/^\s+|\s+$/g, '');

                // check the answer
                if (!state_only && answer.value != '' && checker)
                    checker(type,expected,answer,samples);
                else {
                    // no answer given, clear previous messages
                    answer.message = undefined;
                    answer.check = undefined;
                }

                update_answer(true);
            }

            if (type == 'text' || type == 'number' || type == 'twos-complement' || type == 'expression') {
                newdiv = $(answer_text_template);
                if (label !== undefined) newdiv.find('label').html(label).attr('for',id);
                const input = newdiv.find('input');

                if (placeholder !== undefined)
                    input.attr('placeholder',placeholder.text() + ' \u2014 type the Enter key to check answer.');
                else
                    input.attr('placeholder','type the Enter key to check answer.');

	        input.on('change',function () {
                    if (answer === undefined) return;
                    var check;
                    if (type == 'text') {
                        try {
                            // expect that checker specifies a function of (type,expected,answer,samples)
                            // to avoid breaking too much stuff, exsiting custom_checker takes over the default one
                            if (custom_checker) check = eval(custom_checker);
                            else check = check_text;
                        } catch (e) {
                            console.log('eval failed: '+e +" "+ custom_checker);
                        }
                    }
                    else if (type == 'number') check = check_numeric_answer;
                    else if (type == 'twos-complement') check = check_twos_complement_answer;
                    else if (type == 'expression') check = check_expression_answer;
                    check_answer(id,$(this).val(),check);
                });
                adiv.replaceWith(newdiv);
            }
            else if (type == 'choice') {
                newdiv = $(answer_choice_template);
	        if (label !== undefined) newdiv.find('label').html(label).attr('for',id);
                adiv.find('choice').each(function (index,c) {
                    if (answer === undefined) return;
                    var input = $('<input type="radio"></input>');
                    input.attr('name',id).attr('value',index);
                    if (index.toString() == answer.value)
                        input.prop('checked',true);
                    newdiv.find('.answer-choice-input').append(input,$(c).text(),'<br/>');
                    input.on('change',function () {
                        check_answer(id,$(this).val(),check_choice_answer);
                    });
                });
                adiv.replaceWith(newdiv);
            }
            else if (type == 'menu') {
                newdiv = $(answer_menu_template);
                if (label !== undefined) newdiv.find('label').html(label).attr('for',id);
                const select = newdiv.find('select');
                select.attr('name',id);
                adiv.find('menuitem').each(function (index,c) {
                    if (answer === undefined) return;
                    var v = $(c).text();
                    var input = $('<option></option>').text(v);
                    if (v == answer.value)
                        input.prop('selected',true);
                    select.append(input);
                });
                select.on('change',function () {
                    check_answer(id,$(this).val(),check_menu_answer);
                });
                adiv.replaceWith(newdiv);
            }
            else if (type == 'iframe' || type == 'window') {
                var width = adiv.attr('width') || '100%';
                var height = adiv.attr('height') || '600';
                var src = adiv.attr('src');
                var style = adiv.attr('style') || 'border:none;';
                var initialState = adiv.html() || '{}';  // use html() to get CDATA

                // strip out <!--[CDATA[ ... ]]--> tags, if any
                initialState = initialState.replace(/<!--\[CDATA\[([^]*?)\]\]-->/g,
                                                     function(m,body) {
                                                         return body;
                                                     });

                // build message to send to target
                function get_message() {
                    if (answer === undefined)
                        return JSON.stringify({value: initialState});

                    let state;
                    if (answer.value !== undefined) {
                        // extend initial state with saved user state
                        state = JSON.parse(initialState);
                        $.extend(state,JSON.parse(answer.value));
                        state = JSON.stringify(state);
                    }
                    else state = initialState;
                    return JSON.stringify({
                        id: answer.id,
                        value: state,
                        check: answer.check,
                        message: answer.message,
                        version: answer.version
                    });
                }

                // function to send message to target
                function send_message() {
                    target.postMessage(get_message(),window.location.origin);
                }

                if (type == 'iframe') {
                    // set up iframe
                    var iframe = $('<iframe></iframe>').attr('id',id).attr('src',src).attr('width',width).attr('height',height).attr('style',style);
                    newdiv = $('<div></div>');
                    if (id && !state_only) {
                        newdiv.append(iframe_answer_template);
                        if (placeholder) newdiv.find('#placeholder').html(placeholder);
                    } else if (placeholder) newdiv.append(placeholder);
                    newdiv.append(iframe);
                    adiv.replaceWith(newdiv);

                    // when iframe is ready, send it the current state
                    iframe.on('load',function () {
                        target = iframe[0].contentWindow;
                        // ensure pending events happen *before* sending message
                        setTimeout(send_message, 1);
                    });
                } else if (type == 'window') {
                    var wbutton = $('<div class="answer-window"><a href="#">Open '+tool_name+' in a new window</a></div>');
                    wbutton.on('click',function (event) {
                        if (target === undefined) {
                            if (width == '100%') width = '600';
                            target = window.open(src,'Tool Window '+index.toString(),'width='+width+',height='+height);
                            let loaded = false;
                            $(target).on('load',function () {
                                // ensure pending events happen *before* sending message
                                setTimeout(send_message, 1);
                                $('a',wbutton).addClass('open').text(tool_name+' window is open');
                                // we have things to do if target window closes
                                $(target).on('beforeunload',function () {
                                    if (loaded) {
                                        loaded = false;
                                        target = undefined;
                                        $('a',wbutton).removeClass('open').text('Open '+tool_name+' in a new window');
                                    }
                                });
                                loaded = true;
                            });
                        } else {
                            target.focus();
                        }
                        event.preventDefault();
                    });
                    // close child if we close
                    $(window).on('beforeunload',function () {
                        if (target) target.close();
                    });
                    newdiv = $('<div></div>');
                    if (id && !state_only) {
                        newdiv.append(iframe_answer_template);
                        if (placeholder !== undefined) newdiv.find('#placeholder').html(placeholder);
                    } else if (placeholder !== undefined) newdiv.append(placeholder);
                    newdiv.append(wbutton);
                    adiv.replaceWith(newdiv);
                }
            }

            // initialize answer from saved state
            if (answer !== undefined) {
                var a = newdiv;
                if (!a.hasClass('answer')) a = $('.answer',a);

                if (answer.value !== undefined) {
                    a.find('.answer-text-input').val(answer.value);
                    // clear out any canned messaged in template if user answered
                    a.find('.answer-message').empty();
                }
                if (answer.message !== undefined)
                    a.find('.answer-message').text(answer.message);
                if (answer.check !== undefined)
                    a.addClass('answer-'+answer.check);
            }
        });

        // re-save answer state in case number of problems have changed
        localStorage.setItem(locn,JSON.stringify(answers));
    }

    var answer_text_template = '<div class="answer"><div class="answer-row"><label class="answer-label"></label><input type="text" class="answer-text-input" style="height:35px; width:100%;"></input><div class="answer-check"></div></div><div class="answer-message"></div></div>';

    // expected="value"
    function check_text(id,expected,answer) {
        //strip leading/trailing whitespace?
        answer.check = (expected==answer.value) ? 'right' : 'wrong';
        answer.message = undefined;
    }

    // expected="value,tolerance"
    function check_numeric_answer(type,expected,answer) {
        answer.check = 'wrong';
        expected = expected.split(',');

        var v = calculate(expected[0]);
        if (typeof v == 'string') {
            answer.message('Bad expected value: '+expected[0]);
            return;
        }

        var tolerance = 0;
        if (expected.length > 1) {
            var tol = expected[1];
            if (tol[tol.length-1] == '%')
                tolerance = Math.abs(v)*parseFloat(tol.substring(0,tol.length - 1))*.01;
            else
                tolerance = parseFloat(expected[1]);

            if (isNaN(tolerance) || tolerance < 0) {
                answer.message('Bad tolerance: '+expected[1]);
                return;
            }
        }

        var got = calculate(answer.value);
        if (typeof got == 'string') {
            answer.message = got;   // error message
            return;
        }

        answer.check = (got >= v - tolerance && got <= v + tolerance) ? 'right' : 'wrong';
        answer.message = undefined;
    }
    
    //Copy of check_numeric
    //No tolerance: they're all integers
    //Expected="value,bitwidth=32"
    function check_twos_complement_answer(type,expected,answer) {
      
        function complement_wrap(n, bw) {
          // Substract twice, once for the complement, once for the postitive interpretation
          n = n%Math.pow(2,bw);
          return ( n < Math.pow(2, bw-1)) ? n : n-Math.pow(2,bw);
        }
        
        expected = expected.split(',');
        let v = calculate(expected[0]);
        if (typeof v == 'string') {
            answer.message('Bad expected value: '+expected[0]);
            return;
        }

        let bitwidth = 32;
        if (expected.length > 1) {
            bitwidth = parseInt(expected[1]);

            if (isNaN(bitwidth) || bitwidth <= 0) {
                answer.message('Bad bit width: '+expected[1]);
                return;
            }
        }

        v = complement_wrap(v, bitwidth);
        const got = complement_wrap(calculate(answer.value), bitwidth);
        if (typeof got == 'string') {
            answer.message = got;   // error message
            return;
        }

        answer.check = (got == v) ? 'right' : 'wrong';
        answer.message = undefined;
    }

    // expected="expression"
    // samples="variables@lower bounds:upper bounds#ntests"
    function check_expression_answer(type,expected,answer,samples) {
        var s = samples.match(/^(.*?)\@(.*?)\:(.*?)\#(.*?)$/);
        if (s == null) {
            answer.message = 'Malformed samples parameter: '+samples;
            return;
        }

        // split lists
        var variables = s[1].split(/\s*,\s*/);
        var lower_bounds = s[2].split(/\s*,\s*/);;
        var upper_bounds = s[3].split(/\s*,\s*/);;
        var nvars = variables.length;
        if (lower_bounds.length != nvars || upper_bounds.length != nvars) {
            answer.message = 'Mismatched bounds length: '+samples;
            return;
        }

        var ntests = parseInt(s[4]);
        if (isNaN(ntests)) {
            answer.message = 'Bad ntests: '+samples;
            return;
        }

        // convert bounds to numbers
        var i,v;
        var integers = [];  // true if this variable should be an integer
        for (i = 0; i < nvars; i += 1) {
            integers.push(true);
            variables[i] = variables[i].toLowerCase();
            v = parseFloat(lower_bounds[i]);
            if (isNaN(v)) {
                answer.message = 'Bad number in lower bound: '+samples;
                return;
            }
            if (/\./.test(lower_bounds[i])) integers[i] = false;
            lower_bounds[i] = v;

            v = parseFloat(upper_bounds[i]);
            if (isNaN(v)) {
                answer.message = 'Bad number in upper bound: '+samples;
                return;
            }
            if (/\./.test(upper_bounds[i])) integers[i] = false;
            upper_bounds[i] = v;
        }

        // parse expressions
        var exp,got;
        try {
            exp = parse(expected.toLowerCase());
            got = parse(answer.value.toLowerCase());
        } catch(e) {
            answer.message = 'Error in formula: '+e;
            return;
        }

        // run the tests
        try {
            var env = new_environment();
            var vexp,vgot,test,vals;
            for (test = 0; test < ntests; test += 1) {
                // generate variable values
                for (i = 0; i < nvars; i += 1) {
                    v = lower_bounds[i] + (upper_bounds[i] - lower_bounds[i])*Math.random();
                    if (integers[i]) v = v.toFixed();
                    env[variables[i]] = v;
                }
                // evaluate expressions
                vexp = evaluate(exp,env);
                vgot = evaluate(got,env);
                // check
                if (vgot < 0.999*vexp || vgot >= 1.001*vexp) {
                    vals = [];
                    for (i = 0; i < nvars; i += 1) {
                        v = variables[i];
                        if (integers[i]) vals.push(v+'='+env[v]);
                        else vals.push(v+'='+env[v].toPrecision(5));
                    }
                    answer.message = 'Expected '+vexp.toPrecision(5)+' but got '+vgot.toPrecision(5)+' when '+vals.join(', ')+'.';
                    answer.check = 'wrong';
                    return;
                }
            }

            // success
            answer.message = undefined;
            answer.check = 'right';
        } catch(e) {
            answer.message = 'Error evaluating expression: '+e;
            return;
        }
        return;
    }
    
    var answer_choice_template = '<div class="answer"><div class="answer-row"><label class="answer-label" style="vertical-align: top;"></label><div class="answer-choice-input"></div><div class="answer-check" style="vertical-align: top;"></div></div><div class="answer-message"></div></div>';
    
    function check_choice_answer(type,expected,answer) {
        answer.check = (expected == answer.value) ? 'right' : 'wrong';
        answer.message = undefined;
    }

    var answer_menu_template = '<div class="answer"><div class="answer-row"><label class="answer-label" style="vertical-align: top;"></label><select size="1" style="height:35px;"><option>--select answer--</option></select><div class="answer-check" style="vertical-align: top;"></div></div><div class="answer-message"></div></div>';

    function check_menu_answer(type,expected,answer) {
        answer.check = (expected == answer.value) ? 'right' : 'wrong';
        answer.message = undefined;
    }

    var iframe_answer_template = '<div class="answer"><div class="answer-row"><div id="placeholder" style="display: table-cell; width: 100%;"></div><div class="answer-check" style="vertical-align: top;"></div></div><div class="answer-message"></div></div>';

    ////////////////////////////////////////////////////////////
    //   Randomization support
    ////////////////////////////////////////////////////////////

    var seed;

    // generate a seed for this user,page
    function random_seed() {
        var locn = storage_key();
        var state = JSON.parse(localStorage.getItem(locn) || '{}');

        if (state._seed_ === undefined) {
            state._seed_ = Date.now();   // new seed
            state._timestamp_ = state._seed_;  // also update timestamp
            localStorage.setItem(locn,JSON.stringify(state));
        }

        seed = state._seed_;
    }

    function random() {
        if (seed === undefined) random_seed();
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    function random_float(vmin,vmax) {
        return random()*(vmax - vmin) + vmin;
    }

    function random_int(vmin,vmax) {
        return Math.floor(random()*(vmax - vmin + 1)) + vmin;
    }

    function random_choice(a) {
        return a[Math.floor(random()*a.length)];
    }
    
    function random_shuffle(a) {
        var currentIndex = a.length, temporaryValue, randomIndex ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = a[currentIndex];
            a[currentIndex] = a[randomIndex];
            a[randomIndex] = temporaryValue;
        }

        return a;
    }

    // look for ?xxx and replace with current value of xxx in
    // top-level javascript environment (or ignore if xxx is
    // not defined)
    function substitute_parameters(s) {
        var m,v;
        var param = /\?(\w+)/g;
        while ((m = param.exec(s)) !== null) {
            try {
                // is there a javascript variable with the matched name?
                v = eval(m[1]).toString();
                // if so replace matched string with value
                s = s.substring(0,m.index) + v + s.substr(param.lastIndex);
                // restart search after replaced value
                param.lastIndex = m.index + v.length;
            } catch (e) {
                // if eval fails, do nothing
            }
        }
        return s;
    }

    ////////////////////////////////////////////////////////////
    //   DES encrypt/decrypt
    ////////////////////////////////////////////////////////////

    //this takes the key, the message, and whether to encrypt or decrypt
    function xyzzy(key, message, encrypt, mode, iv, padding) {
        //declaring this locally speeds things up a bit
        var spfunction1 = new Array (0x1010400,0,0x10000,0x1010404,0x1010004,0x10404,0x4,0x10000,0x400,0x1010400,0x1010404,0x400,0x1000404,0x1010004,0x1000000,0x4,0x404,0x1000400,0x1000400,0x10400,0x10400,0x1010000,0x1010000,0x1000404,0x10004,0x1000004,0x1000004,0x10004,0,0x404,0x10404,0x1000000,0x10000,0x1010404,0x4,0x1010000,0x1010400,0x1000000,0x1000000,0x400,0x1010004,0x10000,0x10400,0x1000004,0x400,0x4,0x1000404,0x10404,0x1010404,0x10004,0x1010000,0x1000404,0x1000004,0x404,0x10404,0x1010400,0x404,0x1000400,0x1000400,0,0x10004,0x10400,0,0x1010004);
        var spfunction2 = new Array (-0x7fef7fe0,-0x7fff8000,0x8000,0x108020,0x100000,0x20,-0x7fefffe0,-0x7fff7fe0,-0x7fffffe0,-0x7fef7fe0,-0x7fef8000,-0x80000000,-0x7fff8000,0x100000,0x20,-0x7fefffe0,0x108000,0x100020,-0x7fff7fe0,0,-0x80000000,0x8000,0x108020,-0x7ff00000,0x100020,-0x7fffffe0,0,0x108000,0x8020,-0x7fef8000,-0x7ff00000,0x8020,0,0x108020,-0x7fefffe0,0x100000,-0x7fff7fe0,-0x7ff00000,-0x7fef8000,0x8000,-0x7ff00000,-0x7fff8000,0x20,-0x7fef7fe0,0x108020,0x20,0x8000,-0x80000000,0x8020,-0x7fef8000,0x100000,-0x7fffffe0,0x100020,-0x7fff7fe0,-0x7fffffe0,0x100020,0x108000,0,-0x7fff8000,0x8020,-0x80000000,-0x7fefffe0,-0x7fef7fe0,0x108000);
        var spfunction3 = new Array (0x208,0x8020200,0,0x8020008,0x8000200,0,0x20208,0x8000200,0x20008,0x8000008,0x8000008,0x20000,0x8020208,0x20008,0x8020000,0x208,0x8000000,0x8,0x8020200,0x200,0x20200,0x8020000,0x8020008,0x20208,0x8000208,0x20200,0x20000,0x8000208,0x8,0x8020208,0x200,0x8000000,0x8020200,0x8000000,0x20008,0x208,0x20000,0x8020200,0x8000200,0,0x200,0x20008,0x8020208,0x8000200,0x8000008,0x200,0,0x8020008,0x8000208,0x20000,0x8000000,0x8020208,0x8,0x20208,0x20200,0x8000008,0x8020000,0x8000208,0x208,0x8020000,0x20208,0x8,0x8020008,0x20200);
        var spfunction4 = new Array (0x802001,0x2081,0x2081,0x80,0x802080,0x800081,0x800001,0x2001,0,0x802000,0x802000,0x802081,0x81,0,0x800080,0x800001,0x1,0x2000,0x800000,0x802001,0x80,0x800000,0x2001,0x2080,0x800081,0x1,0x2080,0x800080,0x2000,0x802080,0x802081,0x81,0x800080,0x800001,0x802000,0x802081,0x81,0,0,0x802000,0x2080,0x800080,0x800081,0x1,0x802001,0x2081,0x2081,0x80,0x802081,0x81,0x1,0x2000,0x800001,0x2001,0x802080,0x800081,0x2001,0x2080,0x800000,0x802001,0x80,0x800000,0x2000,0x802080);
        var spfunction5 = new Array (0x100,0x2080100,0x2080000,0x42000100,0x80000,0x100,0x40000000,0x2080000,0x40080100,0x80000,0x2000100,0x40080100,0x42000100,0x42080000,0x80100,0x40000000,0x2000000,0x40080000,0x40080000,0,0x40000100,0x42080100,0x42080100,0x2000100,0x42080000,0x40000100,0,0x42000000,0x2080100,0x2000000,0x42000000,0x80100,0x80000,0x42000100,0x100,0x2000000,0x40000000,0x2080000,0x42000100,0x40080100,0x2000100,0x40000000,0x42080000,0x2080100,0x40080100,0x100,0x2000000,0x42080000,0x42080100,0x80100,0x42000000,0x42080100,0x2080000,0,0x40080000,0x42000000,0x80100,0x2000100,0x40000100,0x80000,0,0x40080000,0x2080100,0x40000100);
        var spfunction6 = new Array (0x20000010,0x20400000,0x4000,0x20404010,0x20400000,0x10,0x20404010,0x400000,0x20004000,0x404010,0x400000,0x20000010,0x400010,0x20004000,0x20000000,0x4010,0,0x400010,0x20004010,0x4000,0x404000,0x20004010,0x10,0x20400010,0x20400010,0,0x404010,0x20404000,0x4010,0x404000,0x20404000,0x20000000,0x20004000,0x10,0x20400010,0x404000,0x20404010,0x400000,0x4010,0x20000010,0x400000,0x20004000,0x20000000,0x4010,0x20000010,0x20404010,0x404000,0x20400000,0x404010,0x20404000,0,0x20400010,0x10,0x4000,0x20400000,0x404010,0x4000,0x400010,0x20004010,0,0x20404000,0x20000000,0x400010,0x20004010);
        var spfunction7 = new Array (0x200000,0x4200002,0x4000802,0,0x800,0x4000802,0x200802,0x4200800,0x4200802,0x200000,0,0x4000002,0x2,0x4000000,0x4200002,0x802,0x4000800,0x200802,0x200002,0x4000800,0x4000002,0x4200000,0x4200800,0x200002,0x4200000,0x800,0x802,0x4200802,0x200800,0x2,0x4000000,0x200800,0x4000000,0x200800,0x200000,0x4000802,0x4000802,0x4200002,0x4200002,0x2,0x200002,0x4000000,0x4000800,0x200000,0x4200800,0x802,0x200802,0x4200800,0x802,0x4000002,0x4200802,0x4200000,0x200800,0,0x2,0x4200802,0,0x200802,0x4200000,0x800,0x4000002,0x4000800,0x800,0x200002);
        var spfunction8 = new Array (0x10001040,0x1000,0x40000,0x10041040,0x10000000,0x10001040,0x40,0x10000000,0x40040,0x10040000,0x10041040,0x41000,0x10041000,0x41040,0x1000,0x40,0x10040000,0x10000040,0x10001000,0x1040,0x41000,0x40040,0x10040040,0x10041000,0x1040,0,0,0x10040040,0x10000040,0x10001000,0x41040,0x40000,0x41040,0x40000,0x10041000,0x1000,0x40,0x10040040,0x1000,0x41040,0x10001000,0x40,0x10000040,0x10040000,0x10040040,0x10000000,0x40000,0x10001040,0,0x10041040,0x40040,0x10000040,0x10040000,0x10001000,0x10001040,0,0x10041040,0x41000,0x41000,0x1040,0x1040,0x40040,0x10000000,0x10041000);

        //create the 16 or 48 subkeys we will need
        var keys = plugh(key);
        var m=0, i, j, temp, temp2, right1, right2, left, right, looping;
        var cbcleft, cbcleft2, cbcright, cbcright2;
        var endloop, loopinc;
        var len = message.length;
        var chunk = 0;
        //set up the loops for single and triple des
        var iterations = keys.length == 32 ? 3 : 9; //single or triple des
        if (iterations == 3) {looping = encrypt ? new Array (0, 32, 2) : new Array (30, -2, -2);}
        else {looping = encrypt ? new Array (0, 32, 2, 62, 30, -2, 64, 96, 2) : new Array (94, 62, -2, 32, 64, 2, 30, -2, -2);}

        //pad the message depending on the padding parameter
        if (padding == 2) message += "        "; //pad the message with spaces
        else if (padding == 1) {temp = 8-(len%8); message += String.fromCharCode (temp,temp,temp,temp,temp,temp,temp,temp); if (temp==8) len+=8;} //PKCS7 padding
        else if (!padding) message += "\0\0\0\0\0\0\0\0"; //pad the message out with null bytes

        //store the result here
        var result = "";
        var tempresult = "";

        if (mode == 1) { //CBC mode
            cbcleft = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
            cbcright = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
            m=0;
        }

        //loop through each 64 bit chunk of the message
        while (m < len) {
            left = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++);
            right = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++);

            //for Cipher Block Chaining mode, xor the message with the previous result
            if (mode == 1) {if (encrypt) {left ^= cbcleft; right ^= cbcright;} else {cbcleft2 = cbcleft; cbcright2 = cbcright; cbcleft = left; cbcright = right;}}

            //first each 64 but chunk of the message must be permuted according to IP
            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);
            temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16);
            temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
            temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);

            left = ((left << 1) | (left >>> 31));
            right = ((right << 1) | (right >>> 31));

            //do this either 1 or 3 times for each chunk of the message
            for (j=0; j<iterations; j+=3) {
                endloop = looping[j+1];
                loopinc = looping[j+2];
                //now go through and perform the encryption or decryption
                for (i=looping[j]; i!=endloop; i+=loopinc) { //for efficiency
                    right1 = right ^ keys[i];
                    right2 = ((right >>> 4) | (right << 28)) ^ keys[i+1];
                    //the result is attained by passing these bytes through the S selection functions
                    temp = left;
                    left = right;
                    right = temp ^ (spfunction2[(right1 >>> 24) & 0x3f] | spfunction4[(right1 >>> 16) & 0x3f]
                                    | spfunction6[(right1 >>>  8) & 0x3f] | spfunction8[right1 & 0x3f]
                                    | spfunction1[(right2 >>> 24) & 0x3f] | spfunction3[(right2 >>> 16) & 0x3f]
                                    | spfunction5[(right2 >>>  8) & 0x3f] | spfunction7[right2 & 0x3f]);
                }
                temp = left; left = right; right = temp; //unreverse left and right
            } //for either 1 or 3 iterations

            //move then each one bit to the right
            left = ((left >>> 1) | (left << 31));
            right = ((right >>> 1) | (right << 31));

            //now perform IP-1, which is IP in the opposite direction
            temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
            temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2);
            temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16);
            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);

            //for Cipher Block Chaining mode, xor the message with the previous result
            if (mode == 1) {if (encrypt) {cbcleft = left; cbcright = right;} else {left ^= cbcleft2; right ^= cbcright2;}}
            tempresult += String.fromCharCode ((left>>>24), ((left>>>16) & 0xff), ((left>>>8) & 0xff), (left & 0xff), (right>>>24), ((right>>>16) & 0xff), ((right>>>8) & 0xff), (right & 0xff));

            chunk += 8;
            if (chunk == 512) {result += tempresult; tempresult = ""; chunk = 0;}
        } //for every 8 characters, or 64 bits in the message

        //return the result as an array
        return result + tempresult;
    } //end of des

    //this takes as input a 64 bit key (even though only 56 bits are used)
    //as an array of 2 integers, and returns 16 48 bit keys
    function plugh(key) {
        //declaring this locally speeds things up a bit
        var pc2bytes0  = new Array (0,0x4,0x20000000,0x20000004,0x10000,0x10004,0x20010000,0x20010004,0x200,0x204,0x20000200,0x20000204,0x10200,0x10204,0x20010200,0x20010204);
        var pc2bytes1  = new Array (0,0x1,0x100000,0x100001,0x4000000,0x4000001,0x4100000,0x4100001,0x100,0x101,0x100100,0x100101,0x4000100,0x4000101,0x4100100,0x4100101);
        var pc2bytes2  = new Array (0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808,0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808);
        var pc2bytes3  = new Array (0,0x200000,0x8000000,0x8200000,0x2000,0x202000,0x8002000,0x8202000,0x20000,0x220000,0x8020000,0x8220000,0x22000,0x222000,0x8022000,0x8222000);
        var pc2bytes4  = new Array (0,0x40000,0x10,0x40010,0,0x40000,0x10,0x40010,0x1000,0x41000,0x1010,0x41010,0x1000,0x41000,0x1010,0x41010);
        var pc2bytes5  = new Array (0,0x400,0x20,0x420,0,0x400,0x20,0x420,0x2000000,0x2000400,0x2000020,0x2000420,0x2000000,0x2000400,0x2000020,0x2000420);
        var pc2bytes6  = new Array (0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002,0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002);
        var pc2bytes7  = new Array (0,0x10000,0x800,0x10800,0x20000000,0x20010000,0x20000800,0x20010800,0x20000,0x30000,0x20800,0x30800,0x20020000,0x20030000,0x20020800,0x20030800);
        var pc2bytes8  = new Array (0,0x40000,0,0x40000,0x2,0x40002,0x2,0x40002,0x2000000,0x2040000,0x2000000,0x2040000,0x2000002,0x2040002,0x2000002,0x2040002);
        var pc2bytes9  = new Array (0,0x10000000,0x8,0x10000008,0,0x10000000,0x8,0x10000008,0x400,0x10000400,0x408,0x10000408,0x400,0x10000400,0x408,0x10000408);
        var pc2bytes10 = new Array (0,0x20,0,0x20,0x100000,0x100020,0x100000,0x100020,0x2000,0x2020,0x2000,0x2020,0x102000,0x102020,0x102000,0x102020);
        var pc2bytes11 = new Array (0,0x1000000,0x200,0x1000200,0x200000,0x1200000,0x200200,0x1200200,0x4000000,0x5000000,0x4000200,0x5000200,0x4200000,0x5200000,0x4200200,0x5200200);
        var pc2bytes12 = new Array (0,0x1000,0x8000000,0x8001000,0x80000,0x81000,0x8080000,0x8081000,0x10,0x1010,0x8000010,0x8001010,0x80010,0x81010,0x8080010,0x8081010);
        var pc2bytes13 = new Array (0,0x4,0x100,0x104,0,0x4,0x100,0x104,0x1,0x5,0x101,0x105,0x1,0x5,0x101,0x105);

        //how many iterations (1 for des, 3 for triple des)
        var iterations = key.length > 8 ? 3 : 1; //changed by Paul 16/6/2007 to use Triple DES for 9+ byte keys
        //stores the return keys
        var keys = new Array (32 * iterations);
        //now define the left shifts which need to be done
        var shifts = new Array (0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0);
        //other variables
        var lefttemp, righttemp, m=0, n=0, temp, left, right;

        for (var j=0; j<iterations; j++) { //either 1 or 3 iterations
            left = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);
            right = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);

            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);
            temp = ((right >>> -16) ^ left) & 0x0000ffff; left ^= temp; right ^= (temp << -16);
            temp = ((left >>> 2) ^ right) & 0x33333333; right ^= temp; left ^= (temp << 2);
            temp = ((right >>> -16) ^ left) & 0x0000ffff; left ^= temp; right ^= (temp << -16);
            temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
            temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);

            //the right side needs to be shifted and to get the last four bits of the left side
            temp = (left << 8) | ((right >>> 20) & 0x000000f0);
            //left needs to be put upside down
            left = (right << 24) | ((right << 8) & 0xff0000) | ((right >>> 8) & 0xff00) | ((right >>> 24) & 0xf0);
            right = temp;

            //now go through and perform these shifts on the left and right keys
            for (var i=0; i < shifts.length; i++) {
                //shift the keys either one or two bits to the left
                if (shifts[i]) {left = (left << 2) | (left >>> 26); right = (right << 2) | (right >>> 26);}
                else {left = (left << 1) | (left >>> 27); right = (right << 1) | (right >>> 27);}
                left &= -0xf; right &= -0xf;

                //now apply PC-2, in such a way that E is easier when encrypting or decrypting
                //this conversion will look like PC-2 except only the last 6 bits of each byte are used
                //rather than 48 consecutive bits and the order of lines will be according to
                //how the S selection functions will be applied: S2, S4, S6, S8, S1, S3, S5, S7
                lefttemp = pc2bytes0[left >>> 28] | pc2bytes1[(left >>> 24) & 0xf]
                    | pc2bytes2[(left >>> 20) & 0xf] | pc2bytes3[(left >>> 16) & 0xf]
                    | pc2bytes4[(left >>> 12) & 0xf] | pc2bytes5[(left >>> 8) & 0xf]
                    | pc2bytes6[(left >>> 4) & 0xf];
                righttemp = pc2bytes7[right >>> 28] | pc2bytes8[(right >>> 24) & 0xf]
                    | pc2bytes9[(right >>> 20) & 0xf] | pc2bytes10[(right >>> 16) & 0xf]
                    | pc2bytes11[(right >>> 12) & 0xf] | pc2bytes12[(right >>> 8) & 0xf]
                    | pc2bytes13[(right >>> 4) & 0xf];
                temp = ((righttemp >>> 16) ^ lefttemp) & 0x0000ffff;
                keys[n++] = lefttemp ^ temp; keys[n++] = righttemp ^ (temp << 16);
            }
        } //for each iterations
        //return the keys we've created
        return keys;
    } //end of des_createKeys

    function stringToHex (s) {
        var hexes = "0123456789abcdef";
        var r = [];
        for (var i=0; i<s.length; i++) {
            r.push(hexes [s.charCodeAt(i) >> 4]);
            r.push(hexes [s.charCodeAt(i) & 0xf]);
        }
        return r.join('');
    }

    function hexToString (h) {
        var r = [];
        for (var i= 0; i<h.length; i+=2) {
            r.push(String.fromCharCode(parseInt(h.substr(i, 2), 16)));
        }
        return r.join('');
    }

    // xyzzy(key, message, encrypt, mode, iv, padding) {
    //var cipher = 'b9ce3a86b9e79611f2b8c3f855af6df459f9a3f0254a7a601d369273';
    //var key = cipher.substring(0,8);
    //var msg = cipher.substr(8);
    //console.log(xyzzy(key,hexToString(msg),0,0,0,2));

    //var key = 'deadbeef';
    //var msg = JSON.stringify({"1A":".902,10%","1B":"1.253,10%"});
    //var cipher = stringToHex(xyzzy(key,msg,1,0,0,2));
    //console.log(key + cipher);

    ////////////////////////////////////////////////////////////
    //   Evaluate expressions
    ////////////////////////////////////////////////////////////

    var engineering_suffix = {
        'T': 1e12,
        'G': 1e9,
        'M': 1e6,
        'K': 1e3,
        'k': 1e3,
        'd': 1e-1,
        'c': 1e-2,
        'm': 1e-3,
        'u': 1e-6,
        'n': 1e-9,
        'p': 1e-12,
        'f': 1e-15,
        'a': 1e-18
    };

    var engineering_number = /([0-9]*\.)?[0-9]+([eE][\-+]?[0-9]+|[TGMKkdcmunpfa])?/;

    var built_in_functions = {
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2, // 2 arg
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        log: Math.log,
        log10: Math.log10,
        log2: Math.log2,
        max: Math.max, // multi-arg
        min: Math.min, // multi-arg
        pow: Math.pow, // 2 arg
        round: Math.round,
        sin: Math.sin,
        sqrt: Math.sqrt
    };

    var built_in_environment = {
        pi: Math.PI,
        e: Math.E
    };

    function new_environment() {
        var env = {};
        for (var v in built_in_environment) {
            env[v] = built_in_environment[v];
        }
        return env;
    }

    // if first token is t, consume it and return true
    function read_token(t, tokens) {
        if (tokens.length > 0 && tokens[0] == t) {
            tokens.shift();
            return true;
        }
        return false;
    }

    // builds parse tree for following BNF.  Tree is either a number or
    // or an array of the form [operator,tree,tree].
    // <expression> ::= <term> | <term> "+" <term> | <term> "-" <term> | <term> "|" <term>
    // <term>       ::= <exp> | <exp> "*" <exp> | <exp> "/" <exp> | <exp> "&" <exp> | <exp> "^" <exp>
    // <exp>        ::= <unary> | <unary> "**" <unary>
    // <unary>      ::= <factor> | "-" <factor> | "+" <factor> | "~" <factor>
    // <factor>     ::= <number> | "(" <expression> ")"
    function parse_expression(tokens) {
        var expression = parse_term(tokens);
        while (true) {
            if (read_token('+', tokens)) {
                expression = ['+', expression, parse_term(tokens)];
            }
            else if (read_token('-', tokens)) {
                expression = ['-', expression, parse_term(tokens)];
            }
            else if (read_token('|', tokens)) {
                expression = ['|', expression, parse_term(tokens)];
            }
            else break;
        }
        return expression;
    }

    function parse_term(tokens) {
        var term = parse_exp(tokens);
        while (true) {
            if (read_token('*', tokens)) {
                term = ['*', term, parse_exp(tokens)];
            }
            else if (read_token('/', tokens)) {
                term = ['/', term, parse_exp(tokens)];
            }
            else if (read_token('&', tokens)) {
                term = ['&', term, parse_exp(tokens)];
            }
            else if (read_token('^', tokens)) {
                term = ['^', term, parse_exp(tokens)];
            }
            else break;
        }
        return term;
    }

    function parse_exp(tokens) {
        var term = parse_unary(tokens);
        while (true) {
            if (read_token('**', tokens)) {
                term = ['**', term, parse_unary(tokens)];
            }
            else break;
        }
        return term;
    }

    function parse_unary(tokens) {
        if (read_token('-', tokens)) {
            return ['neg', parse_factor(tokens)];
        }
        if (read_token('~', tokens)) {
            return ['~', parse_factor(tokens)];
        }
        else if (read_token('+', tokens)) {}
        return parse_factor(tokens);
    }

    function parse_factor(tokens) {
        if (read_token('(', tokens)) {
            var exp = parse_expression(tokens);
            if (read_token(')', tokens)) {
                return exp;
            }
            else throw 'Missing ) in expression';
        }
        else if (tokens.length > 0) {
            var token = tokens.shift();
            var n = NaN;
            if (token.search(/^[a-zA-Z_]\w*/) != -1) {
                // variable name
                if (read_token('(', tokens)) {
                    // a function call, parse the argument(s)
                    var args = [];
                    // code assumes at least one argument
                    while (true) {
                        args.push(parse_expression(tokens));
                        if (read_token(',', tokens)) continue;
                        if (read_token(')', tokens)) break;
                        throw "Expected comma or close paren in function call";
                    }
                    if (!(token in built_in_functions)) throw "Call to unrecognized function: " + token;
                    return ['call ' + token].concat(args);
                }
                // otherwise its just a reference to a variable
                return token;
            }
            else if (token.lastIndexOf('0x',0) == 0 || token.lastIndexOf('0X',0) == 0) {
                // remove any underscores added for readability
                n = parseInt(token.substr(2).split('_').join(''),16);
            }
            else if (token.lastIndexOf('0b',0) == 0 || token.lastIndexOf('0B',0) == 0) {
                // remove any underscores added for readability
                n = parseInt(token.substr(2).split('_').join(''),2);
            }
            else if (engineering_number.exec(token)) {
                var multiplier = engineering_suffix[token.substr(token.length - 1)];
                if (multiplier === undefined) multiplier = 1;
                else token = token.substring(0,token.length - 1);
                n = parseFloat(token,10) * multiplier;
            }
            if (isNaN(n)) throw 'Expected an operand, got ' + String(token);
            return n;
        }
        else throw 'Unexpected end of expression';
    }

    function evaluate(tree, environment) {
        if (environment === undefined) environment = built_in_environment;
        if (typeof tree == 'number') return tree;
        else if (typeof tree == 'string') {
            var v = environment[tree];
            if (v === undefined) throw 'Unrecognized variable '+tree;
            return v;
        }
        else {
            // expecting [operator,tree,...]
            var args = tree.slice(1).map(function(subtree) {
                return evaluate(subtree, environment);
            });
            if (tree[0].search(/^call /) != -1) {
                // call of built-in function
                var f = tree[0].slice(5);
                f = built_in_functions[f];
                if (f === undefined) throw "Unknown function: " + f;
                return f.apply(undefined, args);
            }
            // otherwise its just an operator
            else switch (tree[0]) {
            case 'neg':
                return -args[0];
            case '+':
                return args[0] + args[1];
            case '-':
                return args[0] - args[1];
            case '*':
                return args[0] * args[1];
            case '/':
                return args[0] / args[1];
            case '**':
                return Math.pow(args[0],args[1]);
            case '~':
                return ~args[0];
            case '&':
                return args[0] & args[1];
            case '|':
                return args[0] | args[1];
            case '^':
                return args[0] ^ args[1];
            default:
                throw 'Unrecognized operator ' + tree[0];
            }
        }
    }

    function parse(text) {
        if (text === null || text === undefined) text = "";
        // pattern matches hex, binary, and engineering numbers,
        // variable names, parens and the operators +, -, *, /, ^
        var pattern = /0[xX][0-9a-fA-F_]+|0[bB][01_]+|([0-9]*\.)?[0-9]+([eE][\-+]?[0-9]+|[TGMKkdcmunpfa])?|[a-zA-Z_]\w*|\+|\-|\*\*|\*|\/|\~|\&|\||\^|\(|\)|\,/g;
        var tokens = text.match(pattern);
        if (tokens == null || tokens.length == 0) throw "No expression found!";
        return parse_expression(tokens);
    }

    function calculate(text,environment) {
        if (environment === undefined) environment = built_in_environment;
        try {
            var tree = parse(text);
            return evaluate(tree, environment);
        }
        catch (err) {
            return err;
        }
    }
     
    ////////////////////////////////////////////////////////////
    //   Synchornization support
    ////////////////////////////////////////////////////////////

    // retrieve workbook state from localStorage
    function local_state() {
        var state = {};

        // find valid keys in local storage
        for (var key in localStorage) {
            if (valid_storage_key(key)) {
                // save this state!
                var s = JSON.parse(localStorage.getItem(key));

                // add _timestamp_ key to objects if they don't have one
                if (typeof(s) == 'object') {
                    if (!s.hasOwnProperty('_timestamp_')) {
                        s._timestamp_ = Date.now();
                        // remember timestamp for next time!
                        localStorage.setItem(key,JSON.stringify(s));
                    }
                }
                
                state[key] = s;
            }
        }

        return state;
    }


    function merge_state(remote,merged) {
        var current_page = storage_key();
        var remote_update = false;  // true if merged differs from remote
        var key,r,m;

        // update local state
        function update_merged(k,v) {
            merged[k] = v;
            localStorage.setItem(k,JSON.stringify(v));

            /* reload entire page instead... (in case _seed_ has changed)
            // did we just update state for current page?
            if (k == current_page) {
                // update local state
                for (var id in v) {
                    if (update_handlers[id])
                        update_handlers[id](v[id],true);
                }
            }
             */
        }

        // update merged state from remote state
        for (key in remote) {
            r = remote[key];
            m = merged[key];

            // non-object state: always use local value
            if (typeof r != 'object') {
                if (m != r) {
                    remote_update = true;  // local value is different
                }
                continue;
            }

            // if no corresponding local state, use remote state
            if (m === undefined || (typeof m != 'object' )) {
                update_merged(key,r);
                continue;
            }

            if (r._timestamp_ > m._timestamp_) {
                // use remote state if it's more recent
                update_merged(key,r);
            } else if (r._timestamp_ < m._timestamp_) {
                // use local state if it's more recent
                remote_update = true;
            }
        }

        // any local state that's not in the remote state?
        for (key in merged) {
            if (!remote.hasOwnProperty(key)) {
                remote_update = true;
            }
        }

        return remote_update;
    }

    function utoa(data) {
        return btoa(unescape(encodeURIComponent(data)));
    }

    function save_answers(a) {
        a.setAttribute('href','data:text/plain;base64,'+utoa(JSON.stringify(localStorage)));
    }

    function load_answers(target) {
        var file = target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = JSON.parse(e.target.result);
            for (var tag in contents) {
                localStorage.setItem(tag,contents[tag]);
            }
            // reload page so it reflects newly loaded state
            location.reload();
        };
        reader.readAsText(file);
    }

    ////////////////////////////////////////////////////////////
    //   Module exports
    ////////////////////////////////////////////////////////////

    return {
        setup_answers: setup_answers,
        local_state: local_state,
        check_numeric_answer: check_numeric_answer,
        check_expression_answer: check_expression_answer,
        random: random,
        random_int: random_int,
        random_float: random_float,
        random_choice: random_choice,
        random_shuffle: random_shuffle,

        save_answers: save_answers,
        load_answers: load_answers
    };

})();

$(document).ready(answers.setup_answers);
