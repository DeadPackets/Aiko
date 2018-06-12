/* eslint-disable */
import React, {
	Component
} from 'react';

import {
	AppRegistry,
	Platform,
	StyleSheet,
	Linking,
	AsyncStorage,
	StatusBar,
	SafeAreaView,
	Text,
	View
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
// import Icon from 'react-native-vector-icons/FontAwesome';

//Acts
import ActOne from './acts/one';
import Intro from './acts/intro';

export default class App extends Component {
	constructor() {
		super();
		this.state = {
			doneSetup: false
		}
	}

	componentWillMount() {
		let dev = false;
		if (dev) {
			AsyncStorage.setItem('doneSetup', '{}').then(() => {
				return;
			})
		} else {
			AsyncStorage.getItem('doneSetup').then((response) => {
				let res = JSON.parse(response);
				if (res !== null) {
					this.setState({doneSetup: true});
				}
			})
		}
	}

	doneSetup() {
		this.setState({doneSetup: true});
	}

	render() {
		let item;
			if (this.state.doneSetup) {
				item = <Animatable.View animation={"fadeIn"} style={styles.container} duration={3000}><ActOne /></Animatable.View>
			} else {
				item = <Intro done={this.doneSetup.bind(this)}/>
			}

			return (
				<LinearGradient colors={['#6497b1', '#011f4b']} style={styles.container}>
				<SafeAreaView style={styles.container}>
				<StatusBar barStyle="light-content" backgroundColor="#6497b1" />
					{item}
				</SafeAreaView>
				</LinearGradient>
			)
	}
}

const styles = StyleSheet.create({
	 container: {
		flex: 1
	  }
  });

AppRegistry.registerComponent('Aiko', () => App);
