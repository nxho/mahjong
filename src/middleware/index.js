import {
	CLAIM_TILE,
	DRAW_TILE,
	END_TURN,
	JOIN_GAME,
	SEND_MESSAGE,
	claimTile,
	extendTiles,
	updateCurrentState,
	updateDiscardedTile,
	updateMessages,
	updateOpponents,
	updateRoomId,
	updateTiles,
	startTurn,
	rejoinGame,
	showTilesForRevealedMeld,
} from '../actions';

import uuidv1 from 'uuid/v1';

const createSocketMiddleware = (socket) => {
	let declareClaimTimer = null;
	return store => {
		// Initialize socketio listeners
		socket.on('connect', () => {
			// Data to retrieve from server when socket is initialized
			socket.emit('get_possible_states', (payload) => {
				console.log('states payload:', payload);
			});
			const request = {
				'player-uuid': localStorage.getItem('mahjong-player-uuid'),
			};
			socket.emit('rejoin_game', request, (playerData) => {
				if (playerData) {
					const { username, roomId } = playerData;
					if (!roomId) {
						console.log('No game in progress, display landing page');
					} else {
						console.log(`Player ${username} is in active room_id=${roomId}, rejoining game in progress`);

						console.log('Player data:', playerData);

						// Assign key to each tile for stable rendering
						playerData.tiles.map((item) => item.key = uuidv1());

						store.dispatch(rejoinGame(playerData));
					}
				} else {
					console.log('Something went horribly wrong');
				}
			});
		});
		socket.on('update_opponents', (opponents) => {
			console.log('Received "update_opponents" event from server, updating opponents to:', opponents);
			store.dispatch(updateOpponents(opponents));
		});
		socket.on('update_tiles', (tiles) => {
			console.log('Received "update_tiles" event from server, updating tiles to:', tiles);
			tiles.map((item) => item.key = uuidv1());
			store.dispatch(updateTiles(tiles));
		});
		socket.on('extend_tiles', (tile) => {
			console.log('Received "extend_tiles" event from server, adding tile:', tile);

			// Assign key to new tile for stable rendering
			tile.key = uuidv1();

			store.dispatch(extendTiles(tile));
		});
		socket.on('update_discarded_tile', (tile) => {
			console.log('Received "update_discarded_tile" event from server, updating discarded tile to:', tile);
			store.dispatch(updateDiscardedTile(tile));
		});
		socket.on('start_turn', () => {
			console.log('Received "start_turn" event from server, enabling tile movement for player');
			store.dispatch(startTurn());
		});
		socket.on('update_room_id', (roomId) => {
			console.log('Received "update_room_id" event from server, updating room ID to:', roomId);
			store.dispatch(updateRoomId(roomId));
		});
		socket.on('update_current_state', (state) => {
			console.log('Received "update_state" event from server, updating player action state to:', state);
			store.dispatch(updateCurrentState(state));
		});
		socket.on('declare_claim_with_timer', (startTime) => {
			let msDuration = 2000;
			if (!startTime) {
				socket.emit('declare_claim_start', {
					declareClaimStartTime: new Date().toISOString(),
				});
			} else {
				msDuration -= Date.now() - new Date(Date.parse(startTime));
			}

			if (msDuration <= 0) {
				store.dispatch(claimTile(null));
			} else {
				declareClaimTimer = setTimeout(() => {
					store.dispatch(claimTile(null));
				}, msDuration);
			}
		});
		socket.on('valid_tile_sets_for_meld', (payload) => {
			let { validMeldSubsets, declaredMeld } = payload;
			console.log('before -- declaredMeld:', declaredMeld);
			console.log('before -- validMeldSubsets:', validMeldSubsets);
			validMeldSubsets = validMeldSubsets.map((subset) => (new Set(subset.map(({suit, type}) => `${suit.slice(0, 4)}_${type}`))));
			console.log('after -- validMeldSubsets:', validMeldSubsets);
			store.dispatch(showTilesForRevealedMeld(validMeldSubsets));
		});

		// TODO: store messages on server?
		// or at least update messages from server so that messages sent before
		// a user joins can be seen as well
		socket.on('text_message', (message) => {
			console.log(`Received "message" event from server, message='${message}'`);
			store.dispatch(updateMessages(message));
		});

		return next => action => {
			switch (action.type) {
				case DRAW_TILE:
					socket.emit('draw_tile');
					break;
				case CLAIM_TILE:
					// TODO: clean up maybe
					if (declareClaimTimer) {
						clearTimeout(declareClaimTimer);
					}
					socket.emit('update_claim_state', {
						new_state: action.claimType ? 'CLAIM_TILE' : 'NO_ACTION',
						declared_meld: action.claimType,
					});
					break;
				case END_TURN:
					// Ignore 'key' prop on discardedTile
					const { suit, type } = action.discardedTile;
					socket.emit('end_turn', {
						discarded_tile: {
							suit,
							type,
						},
					});
					break;
				case JOIN_GAME:
					socket.emit('enter_game', {
						username: action.username,
						room_id: action.roomId,
						player_uuid: localStorage.getItem('mahjong-player-uuid'),
					});
					break;
				case SEND_MESSAGE:
					socket.emit('text_message', {
						message: action.message,
					});
					break;
				default:
			}
			return next(action);
		}
	}
}

export default createSocketMiddleware;

