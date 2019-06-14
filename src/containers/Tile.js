import React, { Component } from 'react';
import { connect } from 'react-redux';
import { swapTile } from '../actions';
import './Tile.css'

class Tile extends Component {
	handleEventPreventDefault = (e) => {
		e.preventDefault()
	}

	handleDragStart = (e) => {
		e.dataTransfer.setData('src_index', this.props.index);
	}

	handleDrop = (e) => {
		this.props.swapTile(parseInt(e.dataTransfer.getData('src_index')), this.props.index);
	}

	tryRequire() {
		let img = null;

		try {
			img = require(`../images/tiles/${this.props.suit.slice(0, 4)}_${this.props.type}.png`)
		} catch (e) {
			// handle silently
		}

		return img;
	}

	renderImg(img_src) {
		return (
			<img
				className='imgTile'
				src={img_src}
				alt={`${this.props.suit}_${this.props.type}`}
			/>
		);
	}

	renderText() {
		return (
			<div className='textTileDiv'>
				<div>{this.props.suit.slice(0, 4)}</div>
				<div>{this.props.type}</div>
			</div>
		);
	}

	render() {
		let img_src = this.tryRequire();
		return (
			<div
				className='tileDiv'
				style={{
					transform: `rotate(${this.props.tileRotation}turn)`,
				}}
				draggable={`${this.props.dragEnabled}`}
				onDragStart={this.props.dragEnabled ? this.handleDragStart : this.handleEventPreventDefault}
				onDragEnter={this.handleEventPreventDefault}
				onDragOver={this.handleEventPreventDefault}
				onDrop={this.props.dragEnabled ? this.handleDrop : this.handleEventPreventDefault}
			>
				{
					(img_src && this.renderImg(img_src)) || this.renderText()
				}
			</div>
		);
	}
}

const mapDispatchToProps = dispatch => ({
	swapTile: (playerId, src_index, dst_index) => dispatch(swapTile(playerId, src_index, dst_index)),
});

export default connect(
	null,
	mapDispatchToProps,
)(Tile);

