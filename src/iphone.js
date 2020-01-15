//  iPhone.js
//  Author: Jared L Kerim
//  Saltmine Software

version = 1.94
console.log('Version ' + version);

// Initialize jQTouch
var jQT = $.jQTouch({
    icon            : 'apple-touch-icon.png',
    statusBar       : 'black',    
    addGlossToIcon  : false
});


// Initialize Global Parameters
var call_url = 'http://quickdraft.sportsdraftdaily.com';
var templates = {};
var use_drafts = '';
var previous_pane = '';
var current_pane = '';
var target_pane = '';
var pane_history = [];
var sort_position = 0;
var curr_salary = 0;
var last_synced = 0;

// Timeouts in Milliseconds
var sync_timeout = 300000;
var request_timeout = 120000;

// Pagination 		
var page_size = 25;
var page_offset = 0;

// Application Wide IDs
var user_id = localStorage.getItem('user_id');
var sport_id = 0;
var story_id = 0;
var draft_id = 0;
var position_id = 0;
var position_count_id = 0;
var game_id = 0;
var signup_id = 0;
var leaderboard_account_id = '';
var overview_account_id = '';

// Load Cache from Local Storage
var cache = {};
try {
    cache = JSON.parse(localStorage.getItem('cache'));
    console.log('Successfully restored cache from local storage');
} catch(err) {
    console.log('Error parsing stored cache: ' + err);
}


// Synchronize Local Storage with Server
function synchronize(force_update, callback) {
    curr_time = new Date().getTime();
    diff_time = curr_time - last_synced;
    if ((diff_time < sync_timeout) && (force_update == undefined)) {
        return 0;
    }
    last_synced = curr_time;
    
    console.log('Synchronization beginning UID:' + user_id);
    show_popup('Updating Info');
    params = {'user_id' : user_id};
    $.ajax({
        type      : 'POST',
        url       : call_url + '/mobile/synchronize/', 
        data      : params, 
        dataType  : 'json',
        timeout   : request_timeout,
        success   : function(data, textstatus, request) {
            console.log('Synchronization success');
            cache = data;
            localStorage.setItem('cache', JSON.stringify(data));

            date_string = 'Updated ' + new Date().toString('M/d/yy - h:mm tt');
            $('.update_time').html(date_string);
            localStorage.setItem('update_time', date_string);

        },
        error     : function(request, textstatus, errorThrown) {
            console.log('Synchronization failed ' + textstatus + errorThrown);
        },
        complete  : function(request, textstatus) {
            console.log('Synchronization complete');
            if(callback) {
                callback();
            }
            hide_popup();
            //current_pane = '#home';
            //jQT.goTo('#home', 'flip');
            //console.log('flipping to #home');
        },
    });
}


// Utility Functions
function formatCurrency(num) {
    num = num.toString().replace(/\$|\,/g,'');
    num = Math.floor(num*100+0.50000000001);
    num = Math.floor(num/100).toString();
    for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++) {
        num = num.substring(0,num.length-(4*i+3))+','+ num.substring(num.length-(4*i+3));
    }
    return '$' + num;
}

function inObject(value, values) {
    for(key in values) {
        if(values[key] == value)
            return true;
    }
    return false;
}


// Display a Round Grey Popup
function show_popup(content) {
    $('.popup').html(content);
    $('.popup').show();
}

// Display a Round Grey Popup with an animated Loader
function show_loader() {
    show_popup('<img src="loader.gif" />');
}

// Fade the Popup away
function fade_popup () {
    setTimeout("$('.popup').fadeOut('normal');", 3000);            
    setTimeout("$('.popup').hide();", 3500);            
}

// Hide the Popup
function hide_popup() {
    $('.popup').hide();
}

// Initialize the Dynamic Templates
function setup_templates () {
    // DRAFT ENTRY TEMPLATE
    template = $('.draft_list').html().replace('template', '');
    templates.draft_entry = $.template(template);
   
    // NEWS HEADLINE ENTRY TEMPLATE
    template = $('.news_headlines_list').html().replace('template', '');
    templates.news_headline_entry = $.template(template);

    // NEWS STORY ENTRY TEMPLATE
    template = $('.news_story_list').html().replace('template', '');
    templates.news_story_entry = $.template(template);

    // DRAFT DEADLINE ENTRY
    template = $('.draft_deadline_list').html().replace('template', '');
    templates.draft_deadline_entry = $.template(template);

    // DRAFT SCORING ENTRY
    template = $('.draft_scoring_list').html().replace('template', '');
    templates.draft_scoring_entry = $.template(template);

    // DRAFT SCORING STAT ENTRY
    template = $('.draft_scoring_stat_list').html().replace('template', '');
    templates.draft_scoring_stat_entry = $.template(template);

    // DRAFT DATES ENTRY
    template = $('.draft_dates_list').html().replace('template', '');
    templates.draft_dates_entry = $.template(template);

    // DRAFT GAMES ENTRY
    template = $('.draft_game_list').html().replace('template', '');
    templates.draft_game_entry = $.template(template);

    // DRAFT POSITION EMPTY ENTRY
    template = $('.draft_position_empty_entry')[0].outerHTML.replace('template', '');
    templates.draft_position_empty_entry = $.template(template);

    // DRAFT POSITION OCCUPIED ENTRY
    template = $('.draft_position_occupied_entry')[0].outerHTML.replace('template', '');
    templates.draft_position_occupied_entry = $.template(template);

    // DRAFT SALARY CAP ENTRY
    template = $('.draft_cap_list').html().replace('template', '');
    templates.draft_cap_entry = $.template(template);

    // PLAYER ENTRY 
    template = $('.player_list').html().replace('template', '');
    templates.player_entry = $.template(template);

    // PLAYER INFO
    template = $('.player_info_entry')[0].outerHTML.replace('template', '');
    templates.player_info_entry = $.template(template);

    // PLAYER STATS LABEL
    template = $('.player_stats_label_entry')[0].outerHTML.replace('template', '');
    templates.player_stats_label_entry = $.template(template);

    // PLAYER STATS VALUE
    template = $('.player_stats_value_entry')[0].outerHTML.replace('template', '');
    templates.player_stats_value_entry = $.template(template);
    
    // PLAYER NEWS
    template = $('.player_news_entry')[0].outerHTML.replace('template', '');
    templates.player_news_entry = $.template(template);

    // GAME SCORES
    template = $('.game_score_list').html().replace('template', '');
    templates.game_score_entry = $.template(template);

    // GAME RECAP
    template = $('.game_info_list').html().replace('template', '');
    templates.game_info_entry = $.template(template);

    // USER SCORE
    template = $('.user_score_list').html().replace('template', '');
    templates.user_score_entry = $.template(template);

    // PICK SCORE
    template = $('.draft_scoring_pick_list').html().replace('template', '');
    templates.pick_score_entry = $.template(template);

    // PICK PERFORMANCE
    template = $('.scoring_performance_list').html().replace('template', '');
    templates.performance_entry = $.template(template);

    // PERFORMANCE STAT
    template = $('.scoring_performance_stat_list').html().replace('template', '');
    templates.performance_stat_entry = $.template(template);

    // JOINED BUTTON ENTRY
    template = $('.joined_button_list').html().replace('template', '');
    templates.joined_button_entry = $.template(template);

    // LEADERBOARD ENTRY
    template = $('.leaderboard_list').html().replace('template', '');
    templates.leaderboard_entry = $.template(template);

    // TRANSACTION ENTRY
    template = $('.transaction_list').html().replace('template', '');
    templates.transaction_entry = $.template(template);
}

// Render a Draft
function render_draft(draft, target) {
    template = templates.draft_entry;
    target.append(template, {
        draft_id          : draft.draft_id,
        draft_name        : draft.name,
        draft_signup      : draft.signup ? '<img src="check.png">' : '', 
        draft_fee         : draft.fee,
        draft_prize       : draft.prize,
        draft_signups     : draft.signups,
        draft_max_players : draft.max_players,
        draft_cap         : '$' + draft.cap/1000000 + 'M',
        draft_date        : draft.date,
        draft_time        : draft.time,
        target            : draft.open ? '#draft_menu' : '#draft_scoring_menu',
    });
}

// Render the Draft List
function render_drafts(drafts) {
    // Clear existing list
    $('.draft_list').html('');

    // Add new drafts
    console.log('drafts');
    console.log(drafts);
    template = templates.draft_entry;
    added = 0;
    sorted = [];
    for(i in drafts) {
        sorted.push(drafts[i]);
    }
    console.log('unsorted');
    console.log(sorted);
    sorted.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    })
    console.log('sorted');
    console.log(sorted);
    for(i in sorted) {
        draft = sorted[i];
        added++;
        render_draft(draft, $('.draft_list'));
    }
    if(added == 0) {
        $('.draft_list').append('<li>No Drafts</li>');
    }
}

// Render the News Headlines
function render_news_headlines() {
    // Clear existing list
    $('.news_headlines_list').html('');


    // Add new Player News
    template = templates.news_headline_entry;
    added = 0;
    player_news = cache.player_news;
    for(i in player_news) {
        news = player_news[i];
        if(news.sport_id == sport_id) {
            added++;
            $('.news_headlines_list').append(template, {
                firstname     : news.firstname,
                lastname      : news.lastname,
                team_name     : news.team_name,
                team_city     : news.team_city,
                date          : news.date,
                headline      : news.headline,
                story_id      : i,
            });
        }
    }
    if(added == 0) {
        $('.news_headlines_list').append('<li>No News</li>');
    }
}

// Render News Story
function render_news_story() {
    // Clear existing list
    $('.news_story_list').html('');

    // Add story
    template = templates.news_story_entry;
    news = cache.player_news[story_id];
    $('.news_story_list').append(template, {
        firstname     : news.firstname,
        lastname      : news.lastname,
        team_name     : news.team_name,
        team_city     : news.team_city,
        date          : news.date,
        content       : news.content,
    });
}

// Render Draft Deadline Entry
function render_draft_deadline() {
    // Clear existing list
    $('.draft_deadline_list').html('');

    // Add deadline
    draft = use_drafts[sport_id][draft_id];
    template = templates.draft_deadline_entry;
    $('.draft_deadline_list').append(template, {
        days    : draft.deadline_days,
        hours   : draft.deadline_hours,
        minutes : draft.deadline_minutes,
    });
}

// Render Draft Roster Entry
function render_draft_roster() {    
    // Clear existing list
    $('.draft_position_list').html('');
    $('.draft_cap_list').html('');

    // Add positions
    draft = use_drafts[sport_id][draft_id];
    positions = draft.positions;
    empty_template = templates.draft_position_empty_entry;
    occupied_template = templates.draft_position_occupied_entry;
    
    for(position_id in positions) {
        position = positions[position_id];
        for(i=0;i<position.count;i++) {
            pick_id = positions[position_id].pick_ids[i];
            if(pick_id) {
                player = cache.players[pick_id];
                $('.draft_position_list').append(occupied_template, {
                    position_id         : position.id,
                    position_count_id   : i,
                    position_short      : position.short_name,
                    player_id           : player.id,
                    player_lastname     : player.lastname,
                    player_firstname    : player.firstname,
                    player_salary       : formatCurrency(draft.salaries[pick_id]),
                });
            } else {
                $('.draft_position_list').append(empty_template, {
                    position_id         : position.id,
                    position_count_id   : i,
                    position_full       : position.full_name,
                });
            }
        }
    }
    
    // Add Salary Cap counter
    salary_template = templates.draft_cap_entry;
    $('.draft_cap_list').append(salary_template, {
        cap_used        : formatCurrency(draft.cap_used),
        cap_available   : formatCurrency(draft.cap - draft.cap_used),
    });


}

// Render Draft Scoring Entry
function render_draft_scoring() {
    // Clear existing list
    $('.draft_scoring_list').html('');

    // Add scoring
    positions = use_drafts[sport_id][draft_id].scoring;
    position_template = templates.draft_scoring_entry;
    stat_template = templates.draft_scoring_stat_entry;
    for(position in positions) {
        position_list = position.replace(' ', '_') + '_list';
        position_class = '.' + position_list;
        $('.draft_scoring_list').append(position_template, {
            position      : position,
            position_list : position_list,
        });
        $(position_class).html('');
        fields = positions[position];
        for(field in fields) {
            $(position_class).append(stat_template, {
                stat_name     : field,
                multiplier    : fields[field],
            });
        }
    }
}

// Render the Draft Game Dates
function render_draft_dates() {
    // Clear existing dates
    $('.draft_dates_list').html('');

    // Add the Draft Dates
    draft = use_drafts[sport_id][draft_id];
    template = templates.draft_dates_entry;
    $('.draft_dates_list').append(template, {
        games_after   : draft.games_after,
        games_before  : draft.games_before,
    });
}

// Render the Draft Games
function render_draft_games() {
    // Clear existing games
    $('.draft_game_list').html('');

    // Add the Draft Games
    draft = use_drafts[sport_id][draft_id];
    template = templates.draft_game_entry;
    for(game_id in draft.games) {
        game = draft.games[game_id];
        $('.draft_game_list').append(template, {
            teams   : game.teams,
            stadium : game.stadium,
            city    : game.city,
            date    : game.date,
        });
    }
}

// Render the Player List
function render_player_list() {
    // Clear existing list
    $('.player_list').html('');

    // Add players
    draft = use_drafts[sport_id][draft_id];
    position = draft.positions[position_id];
    pick_ids = position.pick_ids;
    player_ids = position.player_ids;
    template = templates.player_entry;
    for(i in player_ids) {
        player_id = player_ids[i];
        player = cache.players[player_id];
        
        if(inObject(player_id, pick_ids)){
            continue;
        }

        $('.player_list').append(template, {
            player_id         : player_id,
            player_firstname  : player.firstname,
            player_lastname   : player.lastname,
            player_salary     : formatCurrency(draft.salaries[player_id]),
        });

    }
}

// Render the Player Info pane
function render_player_info() {
    // Clear existing html
    $('.player_info_list').html('');

    // Add Player Info
    template = templates.player_info_entry;
    player = cache.players[player_id];
    player_info = cache.player_info[player_id];
    $('.player_info_list').append(template, {
        player_id   : player_id,
        lastname    : player.lastname,
        firstname   : player.firstname,
        position    : player_info.position,
        team_name   : player_info.team_name,
        team_city   : player_info.team_city,
    });

    label_template = templates.player_stats_label_entry;
    value_template = templates.player_stats_value_entry;
    $('.player_stats_label_list').html('');
    $('.player_stats_value_list').html('');
    num_stats = player_info.stats.length;
    if(num_stats > 10) {
        middle = player_info.stats.length/2;
    } else {
        middle = num_stats;
    }
    for(i in player_info.stats) {
        label = player_info.stats[i].stat;
        value = player_info.stats[i].value;
        if(i <= middle) {
            $('.player_stats_label_list.first_row').append(label_template, {
														   stats_label     : label,
														   });
            $('.player_stats_value_list.first_row').append(value_template, {
														   stats_value     : value,
														   });
        } else {
            $('.player_stats_label_list.second_row').append(label_template, {
															stats_label     : label,
															});
            $('.player_stats_value_list.second_row').append(value_template, {
															stats_value     : value,
															});
        }
    }
	
    news_template = templates.player_news_entry;
    for(story_id in player_info.news) {
        story = player_info.news[story_id];
        $('.player_info_list').append(news_template, {
            news_date       : story.date,
            news_content    : story.content,
        });
    }

}

function render_game_score(game, game_id, target) {
    template = templates.game_score_entry
    target.append(template, {
        game_id     : game_id,
        date        : game.date,
        home_team   : game.hometeam,
        home_city   : game.homecity,
        home_score  : game.homescore,
        away_team   : game.awayteam,
        away_city   : game.awaycity,
        away_score  : game.awayscore,
    });
}

// Render the Game Scores pane
function render_game_scores() {
    // Clear existing html
    $('.game_score_list').html('');

    // Render the games
    added = 0;
    for(game_id in cache.games) {
        game = cache.games[game_id];
        if(game.sport_id == sport_id) {
            added++;
            target = $('#game_scores .game_score_list');
            render_game_score(game, game_id, target);
            if(game.complete) {
                selector = '#game_scores .game_score_entry[game_id=' + game_id + ']';
                $(selector + ' .right_arrow').html('&rang;');
                entry = $(selector);
                entry.addClass('slide');
                entry.attr('target', '#game_info');
            }
        }
    }
    if(added == 0) {
        $('.game_score_list').append('<li>No Games</li>');
    }
}

// Render the Game Info Pane
function render_game_info() {
    game = cache.games[game_id];
    target = $('#game_info .game_info_list');
    target.html('');
    render_game_score(game, game_id, target);

    template = templates.game_info_entry;
    info = cache.game_info[game_id];
    target.append(template, {
        headline    : info.headline,
        recap       : info.recap,
    });
}

// Render the User Score list
function render_user_scores() {
    // Clear existing list
    $('.user_score_list').html('');

    // Populate score entries
    draft = use_drafts[sport_id][draft_id];
    scores = draft.results;

    template = templates.user_score_entry;
    for(score_id in scores) {
        score = scores[score_id];
        $('.user_score_list').append(template, {
            signup_id   : score_id,
            username    : score.username,
            score       : score.score,
        });
    }
}

// Render the Scoring Roster
function render_scoring_roster() {
    // Clear existing list
    $('.draft_scoring_pick_list').html('');

    // Populate Pick Entries
    picks = use_drafts[sport_id][draft_id].results[signup_id].roster;

    template = templates.pick_score_entry;
    for(pick_id in picks) {
        pick = picks[pick_id];
        $('.draft_scoring_pick_list').append(template, {
            pick_id           : pick_id,
            firstname         : pick.firstname,
            lastname          : pick.lastname,
            position          : pick.position,
            score             : pick.score,
        });
    }
}

// Render Overview Account Types
function render_overview_account_types() {
    // Clear Existing Entries
    $('#account_overview .joined_button_list').html('');

    // Add Account Types
    template = templates.joined_button_entry;
    for(account_type in cache.account_info.financial) {
        if(overview_account_id == '' ) {
            overview_account_id = account_type;
        }
        
        if(overview_account_id == account_type) {
            selected = 'selected';
        } else {
            selected = '';
        }
        
        $('#account_overview .joined_button_list').append(template, {
            account_type    : account_type,
            selected        : selected,
        });
    }
}

// Render Account Overview
function render_account_overview(more) {
    if(!more) {
        // Clear Existing Entries
        $('.transaction_list').html('');
    } else {
        $('.transaction_list .more').remove();
    }

    // Add Balance
    balance = cache.account_info.financial[overview_account_id].balance;
    $('#account_overview .balance').html(balance);

    // Add Transactions
    template = templates.transaction_entry;
    transactions = cache.account_info.financial[overview_account_id].transactions;
    added = 0;
    for(i=page_offset; i<(page_offset+page_size); i++) {
        transaction = transactions[i];
        if(transaction) {
            added++;
            $('.transaction_list').append(template, {
                date    : transaction.date,
                time    : transaction.time,
                memo    : transaction.memo,
                amount  : transaction.amount,
            });
        }
    }
    if(added == 0) {
        $('.transaction_list').html('<li>No Transactions</li>');
    }
    if((added + page_offset) < transactions.length) {
        page_offset += added;
        $('.transaction_list').append('<li class="more">More</li>');
        $('.transaction_list .more').click(function () {
            render_account_overview(true);
        });
    }
}

// Render Draft Scoring Performance Entry
function render_scoring_performance() {
    // Clear existing list
    $('.scoring_performance_list').html('');

    // Add scoring
    positions = use_drafts[sport_id][draft_id].results[signup_id].roster[pick_id].stats;
    position_template = templates.performance_entry;
    stat_template = templates.performance_stat_entry;
    for(position_id in positions) {
        position = positions[position_id];
        position_list = 'performance_' + position.position.replace(' ', '_') + '_list';
        position_class = '.' + position_list;
        $('.scoring_performance_list').append(position_template, {
            position        : position.position,
            position_total  : position.total,
            position_list   : position_list,
        });
        $(position_class).html('');
        fields = position.fields;
        for(field_id in fields) {
            field = fields[field_id];
            $(position_class).append(stat_template, {
                stat_name     : field.name.replace(position.position, ''),
                multiplier    : field.multiplier,                
                stat_value    : field.value,
				stat_total	  : (parseFloat(field.multiplier) * parseFloat(field.value)).toFixed(1),
            });
        }
    }
}

// Render Leaderboard Account Types
function render_leaderboard_account_types() {
    // Clear Existing Entries
    $('#leaderboard .joined_button_list').html('');

    // Add Account Types
    template = templates.joined_button_entry;
    for(account_type in cache.leaderboard) {
        if(leaderboard_account_id == '' ) {
            leaderboard_account_id = account_type;
        }
        
        if(leaderboard_account_id == account_type) {
            selected = 'selected';
        } else {
            selected = '';
        }
        
        $('#leaderboard .joined_button_list').append(template, {
            account_type    : account_type,
            selected        : selected,
        });
    }
}

// Render Leaderboard
function render_leaderboard() {
    // Clear Existing Entries
    $('.leaderboard_list').html('');

    // Add Entries
    template = templates.leaderboard_entry;
    entries = eval("cache.leaderboard['" + leaderboard_account_id + "'];");
    added = 0;
    for(entry_id in entries) {
        added++;
        entry = entries[entry_id];
        $('.leaderboard_list').append(template, {
            rank      : entry.rank,
            username  : entry.user,
            score     : entry.score,
        });
    }
    if(added == 0) {
        $('.leaderboard_list').html('<li>No Leaders</li>');
    }
}

// Initialize the Login Page
function setup_login() {
    // Populate Username/Password
    username = localStorage.getItem('username');
    password = localStorage.getItem('password');
    if(username) {
        $('#username').val(username);
        $('#password').val(password);
        $('#remember_me').click();
    }


    // Setup Login Callback
    $('#login_submit').click(function () {
        // Show Loader Popup
        show_loader();

        // Store Username/Password
        username = $('#username').val();
        password = $('#password').val();
        if((username.length == 0) || (password.length == 0)) {
            show_popup('Please enter a Username and Password');
            fade_popup();
            return false;
        }
        remember = $('#remember_me').attr('checked');
        if(remember) {
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
        } else {
            localStorage.setItem('username', '');
            localStorage.setItem('password', '');
        }

        // Dispatch POST
        var params = $('#login_form').serialize();
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/login/', 
            data      : params, 
            dataType  : 'json',
            timeout   : 15000,
            success   : function(data, textstatus, request) {
                console.log('Login success');                
                if(data.success) {
                    user_id = data.msg;
                    localStorage.setItem('user_id', user_id);
                    hide_popup();
                    current_pane = '#home';
                    jQT.goTo('#home', 'flip');
                    //synchronize(true);
                } else {
                    show_popup(data.msg);
                    fade_popup();
                }
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Login Failed');
                show_popup('Unable To Connect.<br>Please try again.');
                fade_popup();
            },
        });
        return false;
    });
}

// Initialize the New Account Page
function setup_new_account () {
    // New Account Submission
    $('#submit_new_account').click(function () {
        username = $('#new_username').val();
        if(username.length == 0) {
            show_popup('Please enter a Username');
            fade_popup();
            return false;
        }
        
        password = $('#new_password').val();
        if(password.length == 0) {
            show_popup('Please enter a Password');
            fade_popup();
            return false;
        }

        email = $('#new_email').val();
        if(email.length == 0) {
            show_popup('Please enter an Email Address');
            fade_popup();
            return false;
        }
        
        over_18 = $('#over_18').attr('checked');
        if(!over_18) {
            show_popup('You must be over 18 to play Quickdraft');
            fade_popup();
            return false;
        }
        
        // Dispatch POST
        show_loader();
        var params = $('#new_account_form').serialize();
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/register/', 
            data      : params, 
            dataType  : 'text',
            timeout   : request_timeout,
            success   : function(data, textstatus, request) {
                console.log('Registration Success');
                show_popup(data);
                fade_popup();
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Registration Failed');
                show_popup('Registration Failed');
                fade_popup();
            },
        });



        return false;
    });
}




// Setup the Change Password Page
function setup_change_password() {
    $('#change_password_button').click(function () {
        // Dispatch POST
        show_loader();
        var params = $('#change_password_form').serialize();
        if(params.indexOf('=&') >= 0) {
            show_popup('Please enter your old and new password');
            fade_popup();
            return false();
        }
        params = params + '&user_id=' + user_id;
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/change_password/', 
            data      : params, 
            dataType  : 'text',
            timeout   : request_timeout,
            success   : function(data, textstatus, request) {
                console.log('Change Password success');
                show_popup(data);
                fade_popup();
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Change Password failed');
                show_popup('Change Password Failed');
                fade_popup();
            },
        });
        return false;
    });
}

// Setup the Withdrawal Page
function setup_withdrawal() {
    $('#withdraw_submit').click(function () {
        // Dispatch POST
        show_loader();
        var params = $('#withdraw_form').serialize();
        if(params.indexOf('=&') >= 0) {
            show_popup('Please enter a withdrawal amount');
            fade_popup();
            return false();
        }
        params = params + '&user_id=' + user_id;
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/withdraw/', 
            data      : params, 
            dataType  : 'text',
            timeout   : request_timeout,
            success   : function(data, textstatus, request) {
                console.log('Withdrawal Success');
                show_popup(data);
                fade_popup();
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Withdrawal failed');
                show_popup('Withdrawal Failed');
                fade_popup();
            },
        });
        return false;
    });
}

// Setup the Edit Profile Page
function setup_edit_profile() {
    $('#edit_info_button').click(function () {
        show_loader();
        var params = $('#edit_info_form').serialize();
        params = params + '&user_id=' + user_id;
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/edit_profile/', 
            data      : params, 
            dataType  : 'text',
            timeout   : request_timeout,
            success   : function(data, textstatus, request) {
                console.log('Edit Profile success');
                show_popup(data);
                fade_popup();
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Edit Profile failed');
                show_popup('Edit Profile Failed');
                fade_popup();
            },
        });
        return false;
    });
}


// Setup the Player List Sorting Functions
function setup_player_list_sorting() {
    // Name Sort
    $('.player_list_name_sort').click(function () {
        position = use_drafts[sport_id][draft_id].positions[position_id];

        $('.player_list_name_sort').addClass('selected');
        $('.player_list_salary_sort').removeClass('selected'); 
        
        if(position.sort_type == 'name') {
            position.sort_direction = !position.sort_direction;
        } else {
            position.sort_type = 'name';
        }
        
        if(position.sort_direction) {
            $('.player_list_name_sort .direction').html('&uarr;');
            $('.player_list_salary_sort .direction').html('&uarr;');
            position.player_ids.sort(function(a, b) { 
                if(cache.players[b].lastname < cache.players[a].lastname) { 
                    return 1; 
                } else { 
                    return -1;
                }});
        } else {
            $('.player_list_name_sort .direction').html('&darr;');
            $('.player_list_salary_sort .direction').html('&darr;');
            position.player_ids.sort(function(a, b) { 
                if(cache.players[b].lastname < cache.players[a].lastname) { 
                    return -1; 
                } else { 
                    return 1;
                }});
        }
        
        render_player_list();
        bind_slide('.player_entry');
        setup_player_pick_button('.player_entry .button');
		setup_player_pick_button('.player_entry .player_name');
    });

    // Salary Sort
    $('.player_list_salary_sort').click(function () {
        position = use_drafts[sport_id][draft_id].positions[position_id];

        $('.player_list_salary_sort').addClass('selected');
        $('.player_list_name_sort').removeClass('selected'); 

        if(position.sort_type == 'salary') {
            position.sort_direction = !position.sort_direction;
        } else {
            position.sort_type = 'salary';
        }
    
        if(position.sort_direction) {
            $('.player_list_salary_sort .direction').html('&uarr;');
            $('.player_list_name_sort .direction').html('&uarr;');
            position.player_ids.sort(function(a, b) { 
                return cache.players[b].salary - cache.players[a].salary;
            });
        } else {
            $('.player_list_salary_sort .direction').html('&darr;');
            $('.player_list_name_sort .direction').html('&darr;');
            position.player_ids.sort(function(a, b) { 
                return cache.players[a].salary - cache.players[b].salary;
            });
        }
        
        render_player_list();
        bind_slide('.player_entry');
        setup_player_pick_button('.player_entry .button');
		setup_player_pick_button('.player_entry .player_name');
    });
}

// Setup the player picking mechanism
function setup_player_pick_button(tag) {
    $(tag).click(function (event) {
        event.stopPropagation();
        console.log('pick button clicked');
        player_id = $(this).attr('player_id');

        player = cache.players[player_id];
        draft = use_drafts[sport_id][draft_id];
        player_salary = draft.salaries[player_id];	
				 
        if((player_salary + draft.cap_used) > draft.cap) {
            show_popup('That pick would exceed the salary cap');
            fade_popup();
        } else {    
			previous_id = draft.positions[position_id].pick_ids[position_count_id];
			if(previous_id) {
				 previous_salary = draft.salaries[previous_id];	
				 previous_player = cache.players[previous_id];
				 draft.cap_used -= previous_salary;
			}
            draft.positions[position_id].pick_ids[position_count_id] = player_id;
            draft.cap_used += player_salary;
            if(current_pane == '#player_list') {
                $('#player_list .back').click();
            } else if(current_pane == '#player_info') {
                skip_back_to('#draft_roster');
            }
        }            
    });
}

// Setup Account Type Selection
function setup_account_types() {
    $('#leaderboard .joined_button_entry').click(function () {
        $('#leaderboard .joined_button_entry').removeClass('selected');
        
        leaderboard_account_id = $(this).attr('leaderboard_account_id');
        $(this).addClass('selected');
        render_leaderboard();
    });
    
    $('#account_overview .joined_button_entry').click(function () {
        $('#account_overview .joined_button_entry').removeClass('selected');
        
        overview_account_id = $(this).attr('overview_account_id');
        $(this).addClass('selected');
        page_offset = 0;
        render_account_overview();
    });
}

// Bind Reset/Submit Buttons for Draft Roster
function bind_roster_reset_submit() {
    $('#draft_roster .reset_button').click(function (event) {
        draft = use_drafts[sport_id][draft_id];
        draft.cap_used = 0;
        for(position_id in draft.positions) {
            positions[position_id].pick_ids = {};
        }
        render_draft_roster();
        bind_slide('.draft_position_empty_entry');
        bind_slide('.draft_position_occupied_entry');
        bind_roster_reset_submit();
    });

    $('#draft_roster .submit_button').click(function (event) {
        show_loader();
        params = {
            'user_id'       : user_id,
            'draft_id'      : draft_id,
        };
        $('.draft_position_occupied_entry').each(function (index, item) {
            position_id = $(this).attr('position_id');
            count_id = $(this).attr('position_count_id');
            player_id = $(this).attr('player_id');
            key = 'pick_' + position_id + '_' + count_id;
            params[key] = player_id;
        });
        $.ajax({
            type      : 'POST',
            url       : call_url + '/mobile/submit_roster/', 
            data      : params, 
            dataType  : 'json',
            timeout   : request_timeout,
            success   : function(data, textstatus, request) {
                console.log('Roster submitted');
                result = data.msg;
                show_popup(result);
                fade_popup();
				if(data.success) {
					draft = use_drafts[sport_id][draft_id];
					draft.signup = true;
					
					current_pane = '#schedule';
					previous_pane = '#sport';
					target_pane = '#schedule';
					pane_history = ['#home', '#sport'];
					jQT.goBack('#schedule');
				}
            },
            error     : function(request, textstatus, errorThrown) {
                console.log('Roster submit failed');
                show_popup('Roster Not Submitted');
                fade_popup();
            },
            complete  : function(request, textstatus) {
                console.log('Roster submit complete');
            },
        });
    });
}

// Bind Slide Animation Mechanism to Target
function bind_slide(target_elements) {
    // Slide Animation Mechanism
    $(target_elements).click(function () {
        // Set Global ID parameters from selected element
        for(key in $.getAttributes($(this))) {
            if(key.indexOf('_id') >= 0) {
                value = parseInt($(this).attr(key));
                cmd = key + ' = ' + value + ';';
                console.log('evaling: ' + cmd);
                eval(cmd);
            }
        }
        
        // Slide to Target Pane
        pane_history.push(current_pane);
        previous_pane = current_pane;
        if(current_pane == '#sport') {
            // Sport is selected, move to target
            current_pane = target_pane;
            jQT.goTo(target_pane, 'slide');            
        } else {
            // Determine whether to use All Drafts or My Drafts
            drafts = $(this).attr('drafts');
            if(drafts) {
                use_drafts = eval(drafts);
            }            
            target = $(this).attr('target');
            if($(target).hasClass('sport_required')) {
                // Target pane requires Sport
                target_pane = target;
                current_pane = '#sport';
                jQT.goTo('#sport', 'slide');
            } else {
                // Move directly to Target
                current_pane = target;
                console.log('Sliding to: ' + target);
                jQT.goTo(target, 'slide');
            }
        }
    });
}

// Skip pages to a target page
function skip_back_to(target) {
    while(true) {
        passed_pane = pane_history.pop();
        if(passed_pane == target)
            break;
    }
    previous_pane = current_pane;
    current_pane = target;
    jQT.goBack(target);
}

// Setup Refresh
function setup_refresh() {
    $('.refresh_button').click(function () {
        show_loader();
        synchronize(true, function () {
            hide_popup();
            $(current_pane).trigger('pageAnimationStart', [{direction:'in'}]);
        });
    });
}

// Setup the Schedule Page
function setup_navigation () {
    // Bind Slide Behaviour
    bind_slide('.transparent_menu .slide');

    // Bind Back Button Behaviour
    $('.back').click(function () {
        if(current_pane == '#sport') {
            target_pane = '';
        }
        last_pane = pane_history.pop();
        previous_pane = current_pane;
        current_pane = last_pane;
        jQT.goBack(last_pane);
    });
    
    // Bind Home Button 
    $('.home_button').click(function () {
        sport_id = 0;
        story_id = 0;
        draft_id = 0;
        target_pane = '';
        current_pane = '#home';
        pane_history = [];
        jQT.goBack('#home');
    });
   
    // Bind Logout Button
    $('.logout').click(function () {
	    last_synced = 0;
		cache = null;
		localStorage.setItem('cache', '');
		jQT.goTo('#splash', 'flip');
	});
	
    // Home page Loads
    $('#home').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            synchronize();
        }
    });

    // Schedule Page Loads
    $('#schedule').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            sport = $('.slide[sport_id=' + sport_id + '] .sport_name').html();
            $('#schedule .center').html(sport);
            render_drafts(use_drafts[sport_id]);
            bind_slide('.draft_entry');
        }
    });

    // Draft Menu Loads
    $('#draft_menu').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            $('#draft_menu .draft_info').html('');
            draft = use_drafts[sport_id][draft_id];
            render_draft(draft, $('#draft_menu .draft_info'));
            render_draft_deadline();
        }
    });

    // Edit Info Loads
    $('#edit_info').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            personal = cache.account_info.personal;
            $('#edit_info input[name=firstname]').attr('value', personal.firstname);
            $('#edit_info input[name=lastname]').attr('value', personal.lastname);
            $('#edit_info input[name=addressField]').attr('value', personal.address);
            $('#edit_info input[name=city]').attr('value', personal.city);            
            $('#edit_info select[name=state]').children('[value=' + personal.state + ']').attr('selected', true);
            $('#edit_info input[name=zipcode]').attr('value', personal.zipcode);
            $('#edit_info input[name=telephoneField]').attr('value', personal.telephone);

        }
    });

    // Account Overview Loads
    $('#account_overview').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            page_offset = 0;
            render_overview_account_types();
            render_account_overview();
            setup_account_types();
        }
    });

    // Deposit Loads
    $('#deposit').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            window.location.replace('http://quickdraft.sportsdraftdaily.com/');
        }
    });

    // Player News Headlines Page Loads
    $('#news_headlines').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            render_news_headlines();
            bind_slide('.news_headline_entry');
        }
    });

    // Player News Story Page Loads
    $('#news_story').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            console.log('rendering story');
            render_news_story();
        }
    });

    // Draft Roster Page Loads
    $('#draft_roster').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            // Add current player from salary used
            draft = use_drafts[sport_id][draft_id]
            if(curr_salary) {
                draft.cap_used += curr_salary;
                curr_salary = 0;
            }
        
            console.log('rendering roster');
            render_draft_roster();
            bind_slide('.draft_position_empty_entry');
            bind_slide('.draft_position_occupied_entry');
            bind_roster_reset_submit();
        }
    });

    // Draft Games Page Loads
    $('#draft_games').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            console.log('rendering games');
            render_draft_dates();
            render_draft_games();
        }
    });

    // Draft Scoring Page Loads
    $('#draft_scoring').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            console.log('rendering scoring');
            render_draft_scoring();
        }
    });

    // Player List Loads
    $('#player_list').bind('pageAnimationStart', function(event, info) {
        console.log('curpane: ' + current_pane);
        if((info.direction == 'in') && (previous_pane == '#draft_roster')) {
			position = use_drafts[sport_id][draft_id].positions[position_id];

            // Reset Sorting Buttons
            if(position.sort_direction) {
                $('#player_list .direction').html('&uarr;');
            } else {
                $('#player_list .direction').html('&darr;');
            }

            if(position.sort_type == 'name') {
                $('.player_list_name_sort').addClass('selected');
                $('.player_list_salary_sort').removeClass('selected'); 
            } else {
                $('.player_list_salary_sort').addClass('selected');
                $('.player_list_name_sort').removeClass('selected'); 
            }

            // Render Pane
            console.log('rendering player list');
            render_player_list();
            bind_slide('.player_entry');
            setup_player_pick_button('.player_entry .button');
			setup_player_pick_button('.player_entry .player_name');

            // Remove current player from salary used
            draft = use_drafts[sport_id][draft_id]
            player_id = draft.positions[position_id].pick_ids[position_count_id];
            if(player_id) {
                player = cache.players[player_id];
				player_salary = draft.salaries[player_id]
                draft.cap_used -= player_salary;
                curr_salary = player_salary;
            }
        }
    });

    // Player Info Loads
    $('#player_info').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            if(cache.player_info[player_id]) {
                render_player_info();
                setup_player_pick_button('.player_info_list .pick_button');
            } else {
                $('.player_info_list').html('');
                show_loader();
                params = {
                    'template_id' : draft_id,
                    'player_id'   : player_id,
                }
                $.ajax({
                    type      : 'POST',
                    url       : call_url + '/mobile/player_info/', 
                    data      : params, 
                    dataType  : 'json',
                    timeout   : request_timeout,
                    success   : function(data, textstatus, request) {
                        console.log('Player Info success');
                        cache.player_info[player_id] = data;
                        render_player_info();
                        setup_player_pick_button('.player_info_list .pick_button');
                        hide_popup();
                    },
                    error     : function(request, textstatus, errorThrown) {
                        console.log('Login failed');
                        show_popup('Player Info Request Failed');
                        fade_popup();
                        $('#player_info .back').click();
                    },
                });

            }
        }
    });

    // Game Scores Loads
    $('#game_scores').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            render_game_scores();
            bind_slide('.game_score_entry.slide');
        }
    });

    // Game Info Loads
    $('#game_info').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            if(cache.game_info[game_id]) {
                render_game_info();
            } else {
                $('.game_info_list').html('');
                show_loader();
                params = {
                    game_id   : cache.games[game_id].id,
                }
                $.ajax({
                    type      : 'POST',
                    url       : call_url + '/mobile/game_info/', 
                    data      : params, 
                    dataType  : 'json',
                    timeout   : request_timeout,
                    success   : function(data, textstatus, request) {
                        console.log('Game Info success');
                        cache.game_info[game_id] = data;
                        render_game_info();
                        hide_popup();
                    },
                    error     : function(request, textstatus, errorThrown) {
                        console.log('Game Info failed');
                        show_popup('Game Info Request Failed');
                        fade_popup();
                        $('#game_info .back').click();
                    },
                });

            }
        }
    });

    // Draft Scoring Menu Loads
    $('#draft_scoring_menu').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            $('#draft_scoring_menu .draft_info').html('');
            draft = use_drafts[sport_id][draft_id];
            render_draft(draft, $('#draft_scoring_menu .draft_info'));
            render_user_scores();
            bind_slide('.user_score_entry');
        }
    });
    
    // Draft Scoring Roster Page Loads
    $('#draft_scoring_roster').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            render_scoring_roster();
            bind_slide('.draft_scoring_pick_entry');
        }
    });

    // Draft Scoring Performance Page Loads
    $('#draft_scoring_performance').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            console.log('rendering scoring');
            render_scoring_performance();
        }
    });

    // Leaderboard Page Loads
    $('#leaderboard').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            render_leaderboard_account_types();
            render_leaderboard();
            setup_account_types();
        }
    });

    // Withdraw Page Loads
    $('#withdraw').bind('pageAnimationStart', function(event, info) {
        if(info.direction == 'in') {
            balance = cache.account_info.financial['US Dollars'].balance;
            $('#withdraw .balance').html(balance);
        }
    });
}

// Perform all Page Initializations on Document Ready
$(document).ready(function () {
	$('body > *').css({minHeight: '460px !important'});
    setup_templates();
    setup_navigation();
    setup_login();
    setup_new_account();
    setup_change_password();
    setup_withdrawal();
    setup_edit_profile();
    setup_player_list_sorting();    
    setup_refresh();

    if(user_id) {
        $('#login_submit').click();
        console.log('User ID found, logging in');
    }

    $('.version').html('v' + version);
    $('.update_time').html(localStorage.getItem('update_time'));
});


