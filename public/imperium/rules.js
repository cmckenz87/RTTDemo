"use strict";

//let action_cards = require("./action_cards.js");

const Aggression = "Aggression";
const Mobilization = "Mobilization";
const Administration = "Administration";
const Construction = "Construction";

const Material = "Material";
const Fuel = "Fuel";
const Weapon = "Weapon";
const Relic = "Relic";
const Psionic = "Psionic";

const Build = "Build";
const Repair = "Repair";
const Tax = "Tax";
const Influence = "Influence";
const Move = "Move";
const Battle = "Battle";
const Secure = "Secure";

const Tycoon = "Tycoon";
const Warlord = "Warlord";
const Tyrant = "Tyrant";
const Keeper = "Keeper";
const Empath = "Empath";

const Gate1 = 100;
const Arrow1 = 101;
const Moon1 = 102;
const Hex1 = 103;

const Gate2 = 200;
const Arrow2 = 201;
const Moon2 = 202;
const Hex2 = 203;

const Gate3 = 300;
const Arrow3 = 301;
const Moon3 = 302;
const Hex3 = 303;

const Gate4 = 400;
const Arrow4 = 401;
const Moon4 = 402;
const Hex4 = 403;

const Gate5 = 500;
const Arrow5 = 501;
const Moon5 = 502;
const Hex5 = 503;

const Gate6 = 600;
const Arrow6 = 601;
const Moon6 = 602;
const Hex6 = 603;

const player_names = ["Yellow", "Blue", "Red", "White"];

const player_names_by_scenario = {
  "2P": player_names.slice(0, 2),
  "3P": player_names.slice(0, 3),
  "4P": player_names.slice(0, 4),
};

const player_index = Object.fromEntries(Object.entries(player_names).map(([k, v]) => [v, k | 0]));

const system_names = {
  [Gate1]: "Cluster 1 - Gate",
  [Arrow1]: "Cluster 1 - Arrow",
  [Moon1]: "Cluster 1 - Moon",
  [Hex1]: "Cluster 1 - Hex",
  [Gate2]: "Cluster 2 - Gate",
  [Arrow2]: "Cluster 2 - Arrow",
  [Moon2]: "Cluster 2 - Moon",
  [Hex2]: "Cluster 2 - Hex",
  [Gate3]: "Cluster 3 - Gate",
  [Arrow3]: "Cluster 3 - Arrow",
  [Moon3]: "Cluster 3 - Moon",
  [Hex3]: "Cluster 3 - Hex",
  [Gate4]: "Cluster 4 - Gate",
  [Arrow4]: "Cluster 4 - Arrow",
  [Moon4]: "Cluster 4 - Moon",
  [Hex4]: "Cluster 4 - Hex",
  [Gate5]: "Cluster 5 - Gate",
  [Arrow5]: "Cluster 5 - Arrow",
  [Moon5]: "Cluster 5 - Moon",
  [Hex5]: "Cluster 5 - Hex",
  [Gate6]: "Cluster 6 - Gate",
  [Arrow6]: "Cluster 6 - Arrow",
  [Moon6]: "Cluster 6 - Moon",
  [Hex6]: "Cluster 6 - Hex",
};

let game = null;
let player = null;
let view = null;

let states = {};

const scenario_player_count = { "2P": 2, "3P": 3, "4P": 4 };

exports.scenarios = ["2P", "3P", "4P"];

exports.roles = function (scenario) {
  return player_names_by_scenario[scenario];
};

function random(n) {
  if (game.rng === 1) return (((game.seed = (game.seed * 69621) % 0x7fffffff) / 0x7fffffff) * n) | 0;
  return (game.seed = (game.seed * 200105) % 34359738337) % n;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; --i) {
    let j = random(i + 1);
    let tmp = deck[j];
    deck[j] = deck[i];
    deck[i] = tmp;
  }
}

function remove_from_array(array, item) {
  let i = array.indexOf(item);
  if (i >= 0) array.splice(i, 1);
}

function set_active(new_active) {
  if (game.active !== new_active) clear_undo();
  game.active = new_active;
  update_aliases();
}

function update_aliases() {
  player = game.players[game.active];
}

function find_card_in_court(c) {
  for (let col = 0; col < 4; ++col) if (c === game.court_cards[col]) return [col];
  return null;
}

function next_player(current) {
  return (current + 1) % game.players.length;
}

function logbr() {
  if (game.log.length > 0 && game.log[game.log.length - 1] !== "") game.log.push("");
}

function log(msg) {
  game.log.push(msg);
}

function logi(msg) {
  game.log.push(">" + msg);
}

function deep_copy(original) {
  if (Array.isArray(original)) {
    let n = original.length;
    let copy = new Array(n);
    for (let i = 0; i < n; ++i) {
      let v = original[i];
      if (typeof v === "object" && v !== null) copy[i] = deep_copy(v);
      else copy[i] = v;
    }
    return copy;
  } else {
    let copy = {};
    for (let i in original) {
      let v = original[i];
      if (typeof v === "object" && v !== null) copy[i] = deep_copy(v);
      else copy[i] = v;
    }
    return copy;
  }
}

function push_undo() {
  let copy = {};
  for (let k in game) {
    let v = game[k];
    if (k === "undo") continue;
    else if (k === "log") v = v.length;
    else if (typeof v === "object" && v !== null) v = deep_copy(v);
    copy[k] = v;
  }
  game.undo.push(copy);
}

function pop_undo() {
  let save_log = game.log;
  let save_undo = game.undo;
  game = save_undo.pop();
  save_log.length = game.log;
  game.log = save_log;
  game.undo = save_undo;
}

function clear_undo() {
  game.undo = [];
}

function gen_action(action, argument = undefined) {
  if (argument !== undefined) {
    if (!(action in view.actions)) {
      view.actions[action] = [argument];
    } else {
      if (!view.actions[action].includes(argument)) view.actions[action].push(argument);
    }
  } else {
    view.actions[action] = 1;
  }
}

// STATE QUERIES

function active_has_court_card(c) {
  let court = player.court;
  for (let i = 0; i < court.length; ++i) if (court[i] === c) return true;
  return false;
}

function player_has_court_card(p, c) {
  let court = game.players[p].court;
  for (let i = 0; i < court.length; ++i) if (court[i] === c) return true;
  return false;
}

function which_player_has_court_card(c) {
  for (let p = 0; p < game.players.length; ++p) {
    let court = game.players[p].court;
    for (let i = 0; i < court.length; ++i) if (court[i] === c) return p;
  }
  return -1;
}

function controller_of_system(s) {
  //NYI
}

function player_controls_system(p, s) {
  return controller_of_system(s) === p;
}

function active_controls_system(s) {
  return player_controls_system(game.active, s);
}

// ACTION PHASE

function goto_actions() {
  game.phasing = game.active;
  game.actions = 2;
  game.used_cards = []; // track cards that have been used
  game.used_pieces = [];
  game.selected = -1;
  game.where = 0;
  logbr();
  log(`.turn ${player_names[game.phasing]}`);
  logbr();

  let bmh = active_can_blackmail(Herat);
  let bmk = active_can_blackmail(Kandahar);
  if (bmh || bmk) {
    game.state = "blackmail";
    game.where = bmh && bmk ? -1 : bmh ? Herat : Kandahar;
    game.selected = select_available_cylinder();
  } else {
    resume_actions();
  }
}

function end_action() {
  check_leverage();
}

function resume_actions() {
  set_active(game.phasing);
  game.selected = -1;
  game.where = 0;
  game.state = "actions";
}

function goto_next_player() {
  game.phasing = next_player(game.phasing);
  set_active(game.phasing);
  goto_actions();
}

function mark_card_used(c) {
  if (!game.used_cards.includes(c)) game.used_cards.push(c);
}

states.lead_card = {
  inactive: "lead",
  prompt() {
    // Pass / End turn
    gen_action("button_pass_initiative");

    // Card-based actions
    for (let i = 0; i < player.hand.length; ++i) {
      let c = player.hand[i];
      gen_action(c, "lead");
    }

    view.prompt = `Choose a lead card or pass initiative.`;
  },

  button_pass_initiative() {
    game.inititaive = next_player(game.active);
    game.active = next_player(game.active);
  },

  // Purchase card from market
  card(c) {
    push_undo();
    logbr();

    let [row, col] = find_card_in_market(c);
    game.actions--;

    let cost = market_cost(col, c);
    let cost_per_card = cost / col;
    if (cost_per_card > 0) {
      for (let i = 0; i < col; ++i) {
        if (game.market_cards[row][i] > 0) {
          game.market_coins[row][i] += cost_per_card;
          mark_card_used(game.market_cards[row][i]);
        } else {
          game.market_coins[1 - row][i] += cost_per_card;
          mark_card_used(game.market_cards[1 - row][i]);
        }
      }
    }
    check_public_withdrawal();

    logbr();

    if (cost > 0) player.coins -= cost;

    let took = game.market_coins[row][col];
    if (took > 0) player.coins += took;

    game.market_coins[row][col] = 0;
    game.market_cards[row][col] = 0;

    log(`Purchased #${c}.`);
    if (cost > 0 && took > 0) logi(`Paid ${cost} and took ${took}.`);
    else if (cost > 0) logi(`Paid ${cost}.`);
    else if (took > 0) logi(`Took ${took}.`);

    if (is_dominance_check(c)) {
      do_dominance_check("purchase");
    } else if (is_event_card(c)) {
      events_if_purchased[cards[c].if_purchased]();
    } else {
      player.hand.push(c);
      resume_actions();
    }
  },

  // Play card to court
  play_left(c) {
    do_play_1(c, 0);
  },
  play_right(c) {
    do_play_1(c, 1);
  },

  // Use card based ability
  tax(c) {
    do_card_action_1(c, "Tax", 0);
  },
  gift(c) {
    do_card_action_1(c, "Gift", min_gift_cost());
  },
  build(c) {
    do_card_action_1(c, "Build", 2);
  },
  move(c) {
    do_card_action_1(c, "Move", 0);
  },
  betray(c) {
    do_card_action_1(c, "Betray", 2);
  },
  battle(c) {
    do_card_action_1(c, "Battle", 0);
  },

  pass_initiative() {
    logbr();
    log(`Passed.`);
    goto_cleanup_court();
  },
  end_turn() {
    goto_cleanup_court();
  },
};

// TAX

// CHAPTER START AND END

function deal_action_cards() {
  //let action_cards = [12, 13, 14, 15, 16, 22, 23, 24, 25, 26, 32, 33, 34, 35, 36, 42, 43, 44, 45, 46];
  //shuffle(action_cards);
  //game.action_discard = action_cards;
  //for (let i in game.players) {
  //  game.players[i].hand = [];
  //  for (let j = 0; j < 6; j++) {
  //    game.players[i].hand.push(game.action_discard.pop());
  //  }
  //}
}

// SETUP

exports.setup = function (seed, scenario, options) {
  let player_count = scenario_player_count[scenario];

  game = {
    seed: seed,
    log: [],
    undo: [],

    //open: options.open_hands ? 1 : 0,

    active: 0,
    initiative: 0,
    state: "none",
    used_cards: [],
    used_pieces: [],
    count: 0,
    reserve: 0,
    bribe: -1,
    selected: -1,
    region: 0,
    card: 0,
    where: 0,

    phasing: null,
    actions: 0,
    deck: [],
    events: {},
    pieces: new Array(36 + player_count * 10).fill(0),
    court_cards: [0, 0, 0, 0],
    players: [],
  };

  for (let i = 0; i < player_count; ++i) {
    game.players[i] = {
      vp: 0,
      loyalty: null,
      prizes: 0,
      coins: 4,
      hand: [],
      court: [],
      events: {},
    };
  }

  deal_action_cards();

  game.state = "lead_card";
  game.initiative = random(player_count);
  game.active = game.initiative;

  return save_game();
};

function load_game(state) {
  game = state;
  game.active = player_index[game.active];
  update_aliases();
}

function save_game() {
  game.active = player_names[game.active];
  return game;
}

exports.action = function (state, current, action, arg) {
  load_game(state);
  let S = states[game.state];
  if (action in S) {
    S[action](arg);
  } else {
    if (action === "undo" && game.undo && game.undo.length > 0) pop_undo();
    else throw new Error("Invalid action: " + action);
  }
  return save_game();
};

exports.view = function (state, current) {
  current = player_index[current];
  load_game(state);

  view = {
    log: game.log,
    active: player_names[game.active],
    prompt: null,
    favored: game.favored,
    events: game.events,
    pieces: game.pieces,
    market_cards: game.market_cards,
    market_coins: game.market_coins,
    players: game.players,
    selected: game.selected,
    open: game.open,
    hand: game.players[current].hand,
  };

  if (game.state === "game_over") {
    view.prompt = game.victory;
  } else if (current === "Observer" || game.active !== current) {
    let inactive = states[game.state].inactive || game.state;
    view.prompt = `Waiting for ${player_names[game.active]} to ${inactive}...`;
  } else {
    view.actions = {};
    states[game.state].prompt();
    view.prompt = player_names[game.active] + ": " + view.prompt;
    if (game.undo && game.undo.length > 0) view.actions.undo = 1;
    else view.actions.undo = 0;
  }

  save_game();
  return view;
};
