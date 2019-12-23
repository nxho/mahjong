import React from 'react';
import { connect } from 'react-redux';
import Player from './Player';
import Opponent from '../components/Opponent';
import DiscardedTileContainer from '../components/DiscardedTileContainer';
import Overlay from './Overlay';

import './Board.css';

const Board = ({ opponents, discardedTile, isGameOver }) => {
	console.log('Re-rendering Board container')
	const renderOpponent = (id, position) => {
		const { name, revealedMelds, tileCount } = opponents[id];
		return <Opponent
			name={name}
			melds={revealedMelds}
			tileCount={tileCount}
			position={position}
		/>;
	};

	return (
		<div className='boardContainer' data-testid='board'>
			<div className='leftColumn'>
				{ renderOpponent(2, 'left') }
			</div>
			<div className='middleColumn'>
				{ renderOpponent(1, 'top') }
				<DiscardedTileContainer tileProps={discardedTile} />
				<Player />
			</div>
			<div className='rightColumn'>
				{ renderOpponent(0, 'right') }
			</div>
			{ isGameOver && <Overlay /> }
		</div>
	)
};

const mapStateToProps = state => ({
	discardedTile: state.player.discardedTile,
	isGameOver: state.player.isGameOver,
	opponents: state.opponents,
});

export default connect(
	mapStateToProps,
	null,
)(Board);

