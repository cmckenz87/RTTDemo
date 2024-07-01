delete from titles;
insert or replace into titles ( title_id, title_name, bgg, is_symmetric ) values ( 'imperium', 'Imperium', 318184, 1 );
insert or ignore into setups ( title_id, player_count, scenario, options ) values
	( 'imperium', 2, '2P', '{}')
;
