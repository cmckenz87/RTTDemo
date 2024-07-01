delete from titles;
insert or replace into titles ( title_id, title_name, bgg, is_symmetric ) values ( 'test', 'Arcs', 359871, 1 );
insert or ignore into setups ( title_id, player_count, scenario, options ) values
	( 'arcs', 2, '2P', '{"open_discard":true,"leaders_lore":true,"leaders_pack":true}' ),
	( 'arcs', 3, '3P', '{"open_discard":true,"leaders_lore":true,"leaders_pack":true}' ),
	( 'arcs', 4, '4P', '{"open_discard":true,"leaders_lore":true,"leaders_pack":true}' )
;
